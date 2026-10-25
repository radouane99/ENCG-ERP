<?php

namespace App\Services\Academic;

use App\Actions\Exam\StoreBulkGradesAction;
use App\Models\Assessment;
use App\Models\Grade;
use App\Models\Group;
use App\Models\Module;
use App\Models\Student;
use App\Models\User;
use App\Services\Security\ClassroomAccessService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class GradeGridService
{
    public function context(User $user, int $moduleId, int $groupId): array
    {
        $module = Module::findOrFail($moduleId);
        $group = Group::findOrFail($groupId);
        abort_unless((int) $group->academic_year_id === AcademicContext::yearId() && (int) $group->semester_number === (int) $module->semester_number, 422, 'Contexte du groupe invalide.');
        app(ClassroomAccessService::class)->authorize($user, $module, $group, write: true);
        if ($user->hasAnyRole(['professor', 'vacataire']) && ! $user->hasAnyRole(['super-admin', 'institution-admin', 'director'])) {
            abort_unless(DB::table('module_professor')->where('module_id', $moduleId)->where('professor_id', $user->professor?->id)->where('academic_year_id', $group->academic_year_id)
                ->where(fn ($q) => $q->where('group_id', $groupId)->orWhereNull('group_id'))->exists(), 403);
        }
        $students = Student::with('user')->whereHas('registrations', fn ($q) => $q->where('group_id', $groupId)->where('academic_year_id', $group->academic_year_id))->get()
            ->sortBy(fn ($s) => ($s->last_name ?? '').' '.($s->first_name ?? ''))->values();
        $assessments = Assessment::where('module_id', $moduleId)->get();
        $cc = $assessments->first(fn ($a) => strtolower($a->type) === 'cc');
        $exam = $assessments->first(fn ($a) => strtolower($a->type) === 'exam');
        abort_unless($cc && $exam && $assessments->count() === 2, 422, 'Configurez CC et Exam ou utilisez la saisie par évaluation.');
        abort_unless(abs($cc->weight + $exam->weight - 100) < 0.01, 422, 'Poids des évaluations invalides.');

        return [$module, $group, $students, $cc, $exam];
    }

    public function grid(User $user, int $moduleId, int $groupId): array
    {
        [$module,$group,$students,$cc,$exam] = $this->context($user, $moduleId, $groupId);
        $grades = Grade::whereIn('assessment_id', [$cc->id, $exam->id])->whereIn('student_id', $students->pluck('id'))->get()->keyBy(fn ($g) => $g->student_id.':'.$g->assessment_id);
        $rows = $students->map(function ($s) use ($grades, $cc, $exam) {
            $c = $grades->get($s->id.':'.$cc->id);
            $e = $grades->get($s->id.':'.$exam->id);
            $average = $c && $e && ! $c->absent && ! $e->absent && $c->value !== null && $e->value !== null ? ((float) $c->value * $cc->weight + (float) $e->value * $exam->weight) / 100 : null;

            return ['id' => $s->id, 'student_id' => $s->id, 'name' => $s->user?->name, 'first_name' => $s->first_name, 'last_name' => $s->last_name, 'cne' => $s->cne,
                'cc' => $c?->value, 'exam' => $e?->value, 'cc_absent' => (bool) $c?->absent, 'exam_absent' => (bool) $e?->absent,
                'cc_version' => $c?->version ?? 0, 'exam_version' => $e?->version ?? 0, 'average' => $average, 'status' => $average === null ? 'Non saisie' : 'Saisie'];
        });

        return ['success' => true, 'data' => $rows, 'meta' => ['module_name' => $module->name, 'group_name' => $group->name, 'weights' => ['cc' => $cc->weight / 100, 'exam' => $exam->weight / 100]]];
    }

    public function save(User $user, array $data): array
    {
        return DB::transaction(function () use ($user, $data) {
            [$module,$group,$students,$cc,$exam] = $this->context($user, $data['module_id'], $data['group_id']);
            Module::whereKey($module->id)->lockForUpdate()->firstOrFail();
            app(AcademicWindowGuard::class)->assertGradesOpen();
            $service = app(GradeService::class);
            foreach ([$cc, $exam] as $a) {
                abort_if($service->isPvSigned($module->id) || $service->isExamLocked($a), 403, 'Module verrouillé.');
            }
            foreach ($data['updates'] as $u) {
                if (! $students->contains('id', $u['student_id'])) {
                    throw ValidationException::withMessages(['updates' => 'Étudiant hors groupe.']);
                }
            }
            foreach (['cc' => $cc, 'exam' => $exam] as $key => $a) {
                $updates = collect($data['updates'])->map(fn ($u) => ['student_id' => $u['student_id'], 'value' => $u[$key] ?? null, 'absent' => $u[$key.'_absent'] ?? false, 'version' => $u[$key.'_version']])->all();
                app(StoreBulkGradesAction::class)->execute($a, $updates, $service->getFraudStudentIds($module), function ($old, $value, $absent, $studentId, $assessment) use ($user) {
                    activity()->causedBy($user)->withProperties(['student_id' => $studentId, 'assessment_id' => $assessment->id, 'old_value' => $old?->value, 'value' => $value])->log('grade_grid_updated');
                });
            }

            return ['success' => true, 'calculated_results' => $this->grid($user, $module->id, $group->id)['data']];
        });
    }
}
