<?php

namespace App\Actions\Exam;

use App\Models\Assessment;
use App\Models\ExamIncident;
use App\Models\Grade;
use App\Models\Module;
use App\Services\Academic\ExamWorkflowGuard;
use Illuminate\Support\Facades\DB;

class DecideExamIncidentAction
{
    public function execute(int $id, array $data): ExamIncident
    {
        $user = auth()->user();
        abort_unless($user && $user->hasAnyRole(['admin', 'super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director', 'discipline-committee']), 403);
        return DB::transaction(function () use ($id, $data, $user) {
            $incident = ExamIncident::with('exam.module', 'exam.examSession')->whereKey($id)->lockForUpdate()->firstOrFail();
            app(ExamWorkflowGuard::class)->session($incident->exam->examSession);
            abort_unless(in_array($incident->status, ['convoked', 'auditioned'], true), 409, 'Convoquer le dossier et consigner l’audition avant toute décision.');
            abort_if(! $incident->hearing_date || \Carbon\Carbon::parse(str_replace(' à ', ' ', $incident->hearing_date))->isFuture(), 422, 'L’audition prévue n’a pas encore eu lieu.');
            $sanction = $data['sanction'];
            $dismissed = in_array($sanction, ['dismissed', 'classement']);
            $text = match ($sanction) {
                'module' => 'Annulation de l’épreuve du module concerné.',
                'semestre' => 'Annulation des évaluations du semestre concerné.',
                'blame' => 'Blâme inscrit au dossier.',
                'avertissement' => 'Avertissement écrit.',
                'exclusion', 'annee' => 'Exclusion : portée et durée précisées dans les observations du conseil.',
                default => 'Classement sans suite.',
            };
            if (in_array($sanction, ['module', 'semestre'], true)) {
                app(ExamWorkflowGuard::class)->mutableSession($incident->exam->examSession);
                abort_if($incident->exam->is_locked || $incident->exam->grades_published, 409, 'Réouvrir le PV et les résultats avant application de la sanction.');
                $module = $incident->exam->module;
                $moduleIds = $sanction === 'module' ? collect([$module->id]) : Module::where('institution_id', $module->institution_id)->where('filiere_id', $module->filiere_id)->where('semester_number', $module->semester_number)->pluck('id');
                $assessments = Assessment::withoutGlobalScopes()->where('academic_year_id', $incident->exam->examSession->academic_year_id)->where('needs_review', false)->whereIn('module_id', $moduleIds)
                    ->when($sanction === 'module', fn ($q) => $q->whereIn(DB::raw('LOWER(type)'), $incident->exam->examSession->type === 'rattrapage' ? ['rattrapage', 'resit', 'r'] : ['examen', 'exam', 'final', 'examen final']))->lockForUpdate()->get();
                abort_unless($assessments->isNotEmpty() && ($sanction !== 'module' || $assessments->count() === 1), 422, 'Évaluation cible absente ou ambiguë : réconcilier les modalités avant de décider.');
                foreach ($assessments as $assessment) {
                    $grade = Grade::firstOrNew(['student_id' => $incident->student_id, 'assessment_id' => $assessment->id]);
                    $grade->fill(['value' => 0, 'absent' => false])->save();
                }
            }
            $incident->update(['status' => $dismissed ? 'dismissed' : 'resolved', 'decision' => $text, 'sanction_scope' => $sanction, 'hearing_notes' => $data['observations']]);
            activity()->causedBy($user)->performedOn($incident)->withProperties(['sanction' => $sanction, 'observations' => $data['observations']])->log('exam_incident_council_decision');
            return $incident;
        });
    }
}
