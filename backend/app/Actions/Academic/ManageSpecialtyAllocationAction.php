<?php

namespace App\Actions\Academic;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\FiliereQuota;
use App\Models\Institution;
use App\Models\SpecialtyWish;
use App\Models\Student;
use App\Models\StudentRegistration;
use App\Models\User;
use App\Services\Academic\AcademicContext;
use App\Services\Academic\AcademicMeritService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ManageSpecialtyAllocationAction
{
    public function authorize(User $actor): void
    {
        abort_unless($actor->hasAnyRole(['super-admin', 'institution-admin', 'director', 'admin', 'pedagogy_officer']), 403);
    }

    public function campaign(int $institution): array
    {
        $settings = Institution::findOrFail($institution)->settings ?? [];

        return $settings['specialty_campaign'] ?? ['source_year_id' => AcademicContext::yearId(), 'target_year_id' => AcademicContext::yearId(), 'is_open' => false, 'target_semester' => null, 'revision' => 0];
    }

    public function year(array $campaign): AcademicYear
    {
        return AcademicYear::findOrFail($campaign['target_year_id']);
    }

    public function choices(Student $student, array $wishes): void
    {
        DB::transaction(function () use ($student, $wishes) {
            Institution::whereKey($student->institution_id)->lockForUpdate()->firstOrFail();
            $c = $this->campaign($student->institution_id);
            abort_unless(($c['is_open'] ?? false) && ! ($c['finalized_at'] ?? false) && isset($c['opens_at'], $c['closes_at']) && now()->between(Carbon::parse($c['opens_at']), Carbon::parse($c['closes_at'])), 422, 'Campagne d’orientation fermée.');
            abort_unless($student->pathways()->where('academic_year_id', $c['source_year_id'])->whereIn('current_semester', [$c['target_semester'] - 2, $c['target_semester'] - 1])->exists(), 422, 'Niveau non éligible à cette campagne.');
            $score = app(AcademicMeritService::class)->summary($student, $c['source_year_id']);
            abort_unless($score['complete'], 422, 'Les notes doivent être complètes et réconciliées avant le dépôt.');
            $label = $this->year($c)->label;
            $allowed = FiliereQuota::where('academic_year', $label)->whereHas('filiere', fn ($q) => $q->where('institution_id', $student->institution_id))->where('is_open', true)->where('capacity', '>', 0)->pluck('filiere_id')->all();
            foreach ($wishes as $wish) {
                abort_unless(in_array((int) $wish['filiere_id'], $allowed, true), 422, 'Filière absente de la campagne.');
            }
            SpecialtyWish::where('student_id', $student->id)->where('academic_year', $label)->delete();
            foreach ($wishes as $wish) {
                SpecialtyWish::create($wish + ['student_id' => $student->id, 'academic_year' => $label, 'calculated_merit_score' => $score['average'], 'allocation_status' => 'pending']);
            }
        });
    }

    private function fingerprint(int $institution, array $c): string
    {
        $year = $this->year($c);
        $quotas = FiliereQuota::where('academic_year', $year->label)->whereHas('filiere', fn ($q) => $q->where('institution_id', $institution))->orderBy('id')->get()->toArray();
        $wishes = SpecialtyWish::where('academic_year', $year->label)->whereHas('student', fn ($q) => $q->where('institution_id', $institution))->orderBy('id')->get()->toArray();
        $grades = DB::table('grades as g')->join('assessments as a', 'g.assessment_id', '=', 'a.id')->where('a.academic_year_id', $c['source_year_id'])->orderBy('g.id')->get(['g.id', 'g.value', 'g.version', 'g.absent'])->toArray();

        return hash('sha256', json_encode([$c, $quotas, $wishes, $grades]));
    }

    public function preview(User $actor): object
    {
        $this->authorize($actor);

        return DB::transaction(function () use ($actor) {
            Institution::whereKey($actor->institution_id)->lockForUpdate()->firstOrFail();
            $c = $this->campaign($actor->institution_id);
            abort_unless(($c['revision'] ?? 0) > 0 && ! ($c['finalized_at'] ?? null), 422, 'Configurez une campagne avant la répartition.');
            $fingerprint = $this->fingerprint($actor->institution_id, $c);
            $label = $this->year($c)->label;
            $quotas = FiliereQuota::where('academic_year', $label)->whereHas('filiere', fn ($q) => $q->where('institution_id', $actor->institution_id))->get()->keyBy('filiere_id');
            $wishes = SpecialtyWish::with('student')->where('academic_year', $label)->whereHas('student', fn ($q) => $q->where('institution_id', $actor->institution_id))->get()->groupBy('student_id');
            $roster = $wishes->map(function ($choices) use ($c) {
                $student = $choices->first()->student;
                $summary = app(AcademicMeritService::class)->summary($student, $c['source_year_id']);
                $eligible = $student->pathways()->where('academic_year_id', $c['source_year_id'])->whereIn('current_semester', [$c['target_semester'] - 2, $c['target_semester'] - 1])->exists();

                return ['student' => $student, 'choices' => $choices->sortBy('preference_rank'), 'score' => $eligible && $summary['complete'] ? $summary['average'] : null];
            })->sort(function ($a, $b) {
                return (($b['score'] ?? -1) <=> ($a['score'] ?? -1)) ?: strcmp($a['student']->cne, $b['student']->cne) ?: ($a['student']->id <=> $b['student']->id);
            });
            $used = [];
            $assignments = [];
            $waiting = 0;
            foreach ($roster as $r) {
                $chosen = null;
                if ($r['score'] !== null) {
                    foreach ($r['choices'] as $wish) {
                        $quota = $quotas[$wish->filiere_id] ?? null;
                        if ($quota && $quota->is_open && $r['score'] >= $quota->min_score_required && ($used[$wish->filiere_id] ?? 0) < $quota->capacity) {
                            $chosen = $wish;
                            $used[$wish->filiere_id] = ($used[$wish->filiere_id] ?? 0) + 1;
                            break;
                        }
                    }
                }
                $assignments[] = ['student_id' => $r['student']->id, 'wish_id' => $chosen?->id, 'filiere_id' => $chosen?->filiere_id, 'score' => $r['score'],
                    'status' => $r['score'] === null ? 'needs_review' : ($chosen ? 'assigned' : 'waiting_list'), 'waiting_rank' => $r['score'] !== null && ! $chosen ? ++$waiting : null];
            }
            abort_unless(hash_equals($fingerprint, $this->fingerprint($actor->institution_id, $c)), 409, 'Les notes ont changé pendant le calcul ; recommencez.');
            $id = (string) Str::uuid();
            DB::table('specialty_allocation_runs')->insert(['id' => $id, 'institution_id' => $actor->institution_id, 'source_year_id' => $c['source_year_id'], 'target_year_id' => $c['target_year_id'],
                'assignments' => json_encode($assignments), 'fingerprint' => $fingerprint, 'status' => 'preview', 'created_by' => $actor->id, 'created_at' => now(), 'updated_at' => now()]);

            return DB::table('specialty_allocation_runs')->find($id);
        });
    }

    public function commit(User $actor, string $id): array
    {
        $this->authorize($actor);

        return DB::transaction(function () use ($actor, $id) {
            $institution = Institution::whereKey($actor->institution_id)->lockForUpdate()->firstOrFail();
            $plan = DB::table('specialty_allocation_runs')->where('id', $id)->where('institution_id', $actor->institution_id)->lockForUpdate()->first();
            abort_unless($plan, 404);
            $assignments = json_decode($plan->assignments, true);
            $count = collect($assignments)->where('status', 'assigned')->count();
            if ($plan->status === 'committed') {
                return ['allocated_count' => $count, 'plan_id' => $id];
            }
            $c = $this->campaign($actor->institution_id);
            abort_if($c['finalized_at'] ?? false, 409, 'Campagne déjà affectée.');
            DB::table('grades')->whereIn('assessment_id', Assessment::withoutGlobalScopes()->where('academic_year_id', $c['source_year_id'])->select('id'))->lockForUpdate()->get();
            abort_unless(hash_equals($plan->fingerprint, $this->fingerprint($actor->institution_id, $c)), 409, 'Le contexte a changé : générez un nouvel aperçu.');
            $label = $this->year($c)->label;
            foreach ($assignments as $a) {
                $q = SpecialtyWish::where('student_id', $a['student_id'])->where('academic_year', $label);
                if ($a['filiere_id']) {
                    abort_if(StudentRegistration::where('student_id', $a['student_id'])->where('academic_year_id', $c['target_year_id'])->where('status', 'admin_validated')->where('filiere_id', '!=', $a['filiere_id'])->exists(), 409, 'Une inscription définitive existe dans une autre filière.');
                }
                $q->update(['allocation_status' => $a['wish_id'] ? 'rejected' : $a['status'], 'waiting_list_rank' => $a['waiting_rank'], 'allocated_at' => now()]);
                if ($a['wish_id']) {
                    SpecialtyWish::whereKey($a['wish_id'])->update(['allocation_status' => 'assigned', 'calculated_merit_score' => $a['score'], 'allocated_at' => now()]);
                }
            }
            DB::table('specialty_allocation_runs')->where('id', $id)->update(['status' => 'committed', 'updated_at' => now()]);
            $settings = $institution->settings ?? [];
            $settings['specialty_campaign']['finalized_at'] = now()->toIso8601String();
            $settings['specialty_campaign']['is_open'] = false;
            $institution->update(['settings' => $settings]);
            activity()->causedBy($actor)->withProperties(['plan_id' => $id, 'allocated_count' => $count])->log('specialty_allocation_committed');

            return ['allocated_count' => $count, 'plan_id' => $id];
        });
    }
}
