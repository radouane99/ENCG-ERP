<?php
namespace App\Http\Controllers\Api\Academic;
use App\Actions\Academic\ManageSpecialtyAllocationAction;
use App\Http\Controllers\Controller;
use App\Models\{AcademicYear, Filiere, FiliereQuota, Institution, SpecialtyWish, Student};
use App\Services\Academic\AcademicMeritService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SpecialtyOrientationController extends Controller
{
    public function __construct(private ManageSpecialtyAllocationAction $action) {}
    public function studentGetChoices(Request $r)
    {
        $student = Student::where('user_id', $r->user()->id)->firstOrFail(); $c = $this->action->campaign($student->institution_id); $year = $this->action->year($c);
        $score = app(AcademicMeritService::class)->summary($student, $c['source_year_id']);
        $quotas = FiliereQuota::with('filiere')->where('academic_year', $year->label)->where('is_open', true)->whereHas('filiere', fn ($q) => $q->where('institution_id', $student->institution_id))->get();
        $open = ($c['is_open'] ?? false) && ! ($c['finalized_at'] ?? false) && isset($c['opens_at'], $c['closes_at']) && now()->between(\Carbon\Carbon::parse($c['opens_at']), \Carbon\Carbon::parse($c['closes_at']));
        return response()->json(['success' => true, 'data' => ['filieres' => $quotas->map(fn ($q) => $q->filiere->toArray() + ['capacity' => $q->capacity, 'min_score_required' => $q->min_score_required]),
            'existing_wishes' => SpecialtyWish::with('filiere')->where('student_id', $student->id)->where('academic_year', $year->label)->orderBy('preference_rank')->get(),
            'student_merit_score' => $score['average'], 'score_complete' => $score['complete'], 'is_campaign_open' => $open, 'deadline' => $c['closes_at'] ?? null, 'academic_year' => $year->label]]);
    }
    public function studentSubmitChoices(Request $r)
    {
        $data = $r->validate(['wishes' => 'required|array|min:1|max:5', 'wishes.*.filiere_id' => 'required|integer|distinct', 'wishes.*.preference_rank' => 'required|integer|min:1|max:5|distinct']);
        $ranks = collect($data['wishes'])->pluck('preference_rank')->sort()->values()->all(); abort_unless($ranks === range(1, count($ranks)), 422, 'Classez les vœux de 1 à N sans interruption.');
        $this->action->choices(Student::where('user_id', $r->user()->id)->firstOrFail(), $data['wishes']);
        return $this->studentGetChoices($r);
    }
    public function adminGetSimulation(Request $r)
    {
        $this->action->authorize($r->user()); $c = $this->action->campaign($r->user()->institution_id); $year = $this->action->year($c);
        $wishes = SpecialtyWish::with('student.user', 'filiere')->where('academic_year', $year->label)->whereHas('student', fn ($q) => $q->where('institution_id', $r->user()->institution_id))->get();
        $candidates = $wishes->groupBy('student_id')->map(function ($rows) { $a = $rows->first(); $assigned = $rows->firstWhere('allocation_status', 'assigned'); return ['student_id' => $a->student_id,
            'student_name' => $a->student->user->name, 'cne' => $a->student->cne, 'merit_score' => $a->calculated_merit_score, 'wishes' => $rows->sortBy('preference_rank')->values(), 'allocated_filiere' => $assigned?->filiere?->name]; })->values();
        $quotas = FiliereQuota::with('filiere')->where('academic_year', $year->label)->whereHas('filiere', fn ($q) => $q->where('institution_id', $r->user()->institution_id))->get()->map(fn ($q) => $q->toArray() + ['filiere_code' => $q->filiere->code, 'filiere_name' => $q->filiere->name, 'allocated_count' => $wishes->where('allocation_status', 'assigned')->where('filiere_id', $q->filiere_id)->count()]);
        return response()->json(['success' => true, 'data' => ['campaign' => $c, 'quotas' => $quotas, 'candidates' => $candidates, 'wishes' => $wishes,
            'years' => AcademicYear::where('institution_id', $r->user()->institution_id)->get(['id', 'label']), 'filieres' => Filiere::where('institution_id', $r->user()->institution_id)->get(['id', 'name'])]]);
    }
    public function configure(Request $r)
    {
        $this->action->authorize($r->user());
        $data = $r->validate(['source_year_id' => 'required|integer', 'target_year_id' => 'required|integer', 'target_semester' => 'required|in:5,7',
            'opens_at' => 'required|date', 'closes_at' => 'required|date|after:opens_at', 'is_open' => 'required|boolean', 'reason' => 'required|string|min:10|max:2000']);
        foreach (['source_year_id', 'target_year_id'] as $key) AcademicYear::where('institution_id', $r->user()->institution_id)->findOrFail($data[$key]);
        DB::transaction(function () use ($r, $data) {
            $institution = Institution::whereKey($r->user()->institution_id)->lockForUpdate()->firstOrFail(); $settings = $institution->settings ?? [];
            $revision = ($settings['specialty_campaign']['revision'] ?? 0) + 1; $settings['specialty_campaign'] = $data + ['revision' => $revision, 'finalized_at' => null];
            $institution->update(['settings' => $settings]); activity()->causedBy($r->user())->performedOn($institution)->withProperties($data)->log('specialty_campaign_configured');
        });
        return $this->adminGetSimulation($r);
    }
    public function saveQuotas(Request $r)
    {
        $this->action->authorize($r->user()); $data = $r->validate(['quotas' => 'required|array|min:1|max:100', 'quotas.*.filiere_id' => 'required|integer|distinct',
            'quotas.*.capacity' => 'required|integer|min:0|max:10000', 'quotas.*.min_score_required' => 'required|numeric|min:0|max:20', 'quotas.*.is_open' => 'required|boolean']);
        DB::transaction(function () use ($r, $data) {
            Institution::whereKey($r->user()->institution_id)->lockForUpdate()->firstOrFail(); $c = $this->action->campaign($r->user()->institution_id);
            abort_if($c['finalized_at'] ?? false, 409, 'Rouvrez explicitement la campagne avant de modifier ses quotas.'); $label = $this->action->year($c)->label;
            foreach ($data['quotas'] as $q) {
                Filiere::where('institution_id', $r->user()->institution_id)->findOrFail($q['filiere_id']);
                FiliereQuota::updateOrCreate(['filiere_id' => $q['filiere_id'], 'academic_year' => $label], $q);
            }
            activity()->causedBy($r->user())->withProperties(['academic_year' => $label])->log('specialty_quotas_updated');
        });
        return $this->adminGetSimulation($r);
    }
    public function preview(Request $r) { $p = $this->action->preview($r->user()); return response()->json(['success' => true, 'plan' => ['id' => $p->id, 'assignments' => json_decode($p->assignments, true)]]); }
    public function adminRunAllocation(Request $r)
    {
        $data = $r->validate(['plan_id' => 'required|uuid']);
        return response()->json(['success' => true, 'message' => 'Affectations enregistrées pour l’année cible.', 'data' => $this->action->commit($r->user(), $data['plan_id'])]);
    }
}
