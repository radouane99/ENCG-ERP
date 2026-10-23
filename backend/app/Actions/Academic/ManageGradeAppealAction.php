<?php
namespace App\Actions\Academic;

use App\Models\{Assessment, Grade, GradeAppeal, GradeAudit, Module, ModulePvSignature, Student, User};
use App\Services\Academic\{AcademicContext, GradeService};
use Illuminate\Support\Facades\DB;

final class ManageGradeAppealAction
{
    public function create(Student $student, array $data): GradeAppeal
    {
        return DB::transaction(function () use ($student, $data) {
            Student::whereKey($student->id)->lockForUpdate()->firstOrFail();
            $assessment = Assessment::whereKey($data['assessment_id'] ?? -1)->where('module_id', $data['module_id'] ?? -1)->where('needs_review', false)->first();
            abort_unless($assessment, 422, 'Sélectionnez une évaluation publiée de ce module.');
            $publication = DB::table('grade_publications')->where('assessment_id', $assessment->id)->first();
            abort_unless($publication && now()->between(\Carbon\Carbon::parse($publication->published_at), \Carbon\Carbon::parse($publication->appeals_until)), 422, 'La fenêtre de recours de cette évaluation est fermée.');
            $grade = Grade::where('student_id', $student->id)->where('assessment_id', $assessment->id)->first();
            abort_unless($grade && $grade->value !== null, 422, 'Aucune note publiée correspondante.');
            abort_if(GradeAppeal::where('student_id', $student->id)->where('assessment_id', $assessment->id)->whereIn('status', ['pending', 'submitted', 'under_review'])->exists(), 422, 'Un recours est déjà en cours.');
            $appeal = GradeAppeal::create(['student_id' => $student->id, 'module_id' => $assessment->module_id, 'assessment_id' => $assessment->id,
                'grade_id' => $grade->id, 'original_grade' => $grade->value, 'old_grade' => $grade->value, 'claimed_grade' => $data['claimed_grade'] ?? null,
                'reason_category' => $data['reason_category'], 'reason' => $data['student_justification'], 'student_justification' => $data['student_justification'],
                'status' => 'submitted', 'appeal_deadline_at' => $publication->appeals_until]);
            activity()->causedBy(auth()->user())->performedOn($appeal)->log('grade_appeal_submitted');
            return $appeal;
        });
    }

    public function resolve(User $actor, int $id, array $data): GradeAppeal
    {
        return DB::transaction(function () use ($actor, $id, $data) {
            $initial = GradeAppeal::with('student')->findOrFail($id);
            abort_unless((int) $initial->student->institution_id === (int) $actor->institution_id, 404);
            Module::whereKey($initial->module_id)->lockForUpdate()->firstOrFail();
            $appeal = GradeAppeal::whereKey($id)->lockForUpdate()->firstOrFail();
            $staff = $actor->hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director', 'pedagogy_officer', 'department-head']);
            abort_unless($staff || app(GradeService::class)->isProfessorAssignedToModule($actor->id, (int) $appeal->module_id), 403);
            abort_unless(in_array($appeal->status, ['pending', 'submitted', 'under_review']), 409, 'Ce recours est déjà traité.');
            $decision = $data['decision']; $score = $data['rectified_grade'] ?? null;
            if ($decision === 'rectified') {
                $assessment = Assessment::withoutGlobalScopes()->whereKey($appeal->assessment_id)->where('module_id', $appeal->module_id)->where('needs_review', false)->first();
                abort_unless($assessment && $score !== null, 422, 'Évaluation et note de correction obligatoires.');
                abort_if(ModulePvSignature::withoutGlobalScopes()->where('module_id', $assessment->module_id)->where('academic_year_id', $assessment->academic_year_id)->exists(), 409, 'PV signé : une réouverture motivée par la direction est requise.');
                $grade = Grade::where('student_id', $appeal->student_id)->where('assessment_id', $assessment->id)->lockForUpdate()->first();
                abort_unless($grade, 422, 'La note officielle n’existe pas.');
                abort_unless((float) $grade->value === (float) $appeal->original_grade, 409, 'La note a changé depuis le dépôt du recours. Rechargez et vérifiez le dossier.');
                GradeAudit::create(['grade_id' => $grade->id, 'user_id' => $actor->id, 'old_value' => $grade->value, 'new_value' => $score,
                    'ip_address' => request()->ip(), 'user_agent' => substr(request()->userAgent() ?? '', 0, 255), 'reason' => 'Recours '.$appeal->id.' : '.$data['professor_comment']]);
                $grade->update(['value' => $score, 'absent' => false]);
                $appeal->fill(['rectified_grade' => $score, 'new_grade' => $score]);
            }
            $appeal->fill(['status' => $decision, 'professor_comment' => $data['professor_comment'], 'professor_notes' => $data['professor_comment'], 'resolved_by' => $actor->id, 'resolved_at' => now()])->save();
            activity()->causedBy($actor)->performedOn($appeal)->withProperties(['decision' => $decision])->log('grade_appeal_resolved');
            return $appeal->load('resolver');
        });
    }
}
