<?php

namespace App\Actions\Academic;

use App\Domain\Deliberation\ProgramCompletionRules;
use App\Models\Deliberation;
use App\Models\DeliberationDecision;
use App\Models\Student;
use App\Models\User;
use App\Support\AdmissionAccess;
use Illuminate\Support\Facades\DB;

final class FinalizeGraduationAction
{
    public function execute(User $actor, int $decisionId): Student
    {
        abort_unless(AdmissionAccess::staff($actor) || $actor->hasRole('pedagogy_officer'), 403);

        return DB::transaction(function () use ($actor, $decisionId) {
            $decision = DeliberationDecision::findOrFail($decisionId);
            $jury = Deliberation::whereKey($decision->deliberation_id)->lockForUpdate()->firstOrFail();
            $student = Student::whereKey($decision->student_id)->where('institution_id', $actor->institution_id)->lockForUpdate()->firstOrFail();
            abort_unless((int) $jury->institution_id === (int) $actor->institution_id, 403);
            abort_unless($jury->is_sealed && in_array($jury->type, ['annual', 'annuel'], true), 422, 'Un PV annuel scellé est requis.');
            abort_unless(in_array($decision->decision, ['DIPLOME', 'graduated', 'admitted', 'V', 'V.Comp'], true), 422, 'Le jury n’a pas validé la réussite du cursus.');
            if ($student->graduations()->where('deliberation_decision_id', $decision->id)->exists()) {
                return $student;
            }
            $path = $student->latestPathway()->with('filiere')->firstOrFail();
            $terminal = ProgramCompletionRules::finalSemester($path->filiere?->type, $path->filiere?->duration_years);
            abort_unless($terminal && (int) ceil($path->current_semester / 2) * 2 === $terminal
                && (int) $path->academic_year_id === (int) $jury->academic_year_id
                && (int) $path->filiere_id === (int) $jury->filiere_id, 422, 'Le PV doit correspondre à l’année terminale et à la formation du parcours.');
            abort_if($decision->next_semester !== null && $decision->next_semester > $terminal, 422, 'La décision prévoit une poursuite : vérifiez le PV.');
            abort_if($student->pathways()->where('is_current', true)->where('id', '!=', $path->id)->exists(), 409, 'Plusieurs cursus actifs : rapprochement nécessaire avant clôture.');
            $student->graduations()->firstOrCreate(['filiere_id' => $jury->filiere_id, 'academic_year_id' => $jury->academic_year_id], [
                'institution_id' => $student->institution_id, 'deliberation_decision_id' => $decision->id,
                'finalized_by' => $actor->id, 'finalized_at' => now(), 'terminal_semester' => $terminal,
                'filiere_name' => $path->filiere->name, 'academic_year_label' => $jury->academicYear->label,
            ]);
            $student->update(['status' => 'graduated']);
            $path->update(['is_current' => false]);
            activity()->causedBy($actor)->performedOn($student)->withProperties([
                'decision_id' => $decision->id, 'deliberation_id' => $jury->id,
                'academic_year_id' => $jury->academic_year_id, 'filiere_id' => $jury->filiere_id,
            ])->log('graduation_finalized');

            return $student;
        });
    }
}
