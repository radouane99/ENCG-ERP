<?php

namespace App\Services\Academic;

use App\Models\Module;
use Illuminate\Support\Facades\DB;

class DeliberationService
{
    /**
     * Calcule les moyennes de tous les étudiants pour un module donné
     * et alimente la table resit_eligibilities si la note est entre 5 et 10.
     * Règle ENCG :
     * - Note >= 10 : Validé
     * - 5 <= Note < 10 : Rattrapage (Éligible)
     * - Note < 5 : Non Validé (Note éliminatoire)
     *
     * @param int $moduleId
     * @param int|null $examSessionId (L'ID de la session normale en cours, optionnel pour l'instant)
     * @return array Résumé du traitement
     */
    public function processModuleDeliberation(int $moduleId, ?int $examSessionId = null): array
    {
        $module = Module::with('assessments')->findOrFail($moduleId);
        
        if ($module->assessments->isEmpty()) {
            return ['status' => 'error', 'message' => 'Ce module n\'a aucune évaluation définie.'];
        }

        // On vérifie qu'il n'y a pas d'évaluation de type "Rattrapage" parmi les évaluations normales pour ce calcul
        $normalAssessments = $module->assessments->filter(fn($a) => strtolower($a->type) !== 'rattrapage');

        $assessmentIds = $normalAssessments->pluck('id')->toArray();
        if (empty($assessmentIds)) {
            return ['status' => 'error', 'message' => 'Aucune évaluation de session normale trouvée.'];
        }

        // Récupérer toutes les notes pour ces évaluations
        $grades = DB::table('grades')
            ->whereIn('assessment_id', $assessmentIds)
            ->get();

        // Grouper par étudiant
        $studentGrades = $grades->groupBy('student_id');

        $validated = 0;
        $rattrapage = 0;
        $failed = 0;

        // Fallback pour exam_session_id si non fourni (utiliser la dernière session ouverte ou 1 par défaut)
        $sessionId = $examSessionId ?? DB::table('exam_sessions')->latest('id')->value('id') ?? 1;

        foreach ($studentGrades as $studentId => $studentGradeRecords) {
            $finalScore = 0;
            $hasAbsent = false;

            foreach ($normalAssessments as $assessment) {
                // Trouver la note de cet étudiant pour cette évaluation
                $record = $studentGradeRecords->firstWhere('assessment_id', $assessment->id);
                
                if (!$record || $record->absent) {
                    $hasAbsent = true; // S'il est absent à une des éval, il est considéré absent au module
                } else {
                    // Calcul de la moyenne pondérée
                    $finalScore += ($record->value * ($assessment->weight / 100));
                }
            }

            // Détermination du statut
            if ($hasAbsent || $finalScore < 5) {
                // Note éliminatoire ou absent = Non Validé (Ajourné, pas de rattrapage direct parfois, mais selon la norme ENCG, < 5 = Non validé)
                $failed++;
            } elseif ($finalScore >= 10) {
                // Validé
                $validated++;
            } else {
                // Entre 5 et 9.99 : Rattrapage
                $rattrapage++;
                
                // Insérer dans la table resit_eligibilities
                DB::table('resit_eligibilities')->updateOrInsert(
                    [
                        'student_id' => $studentId,
                        'module_id' => $moduleId,
                        'exam_session_id' => $sessionId
                    ],
                    [
                        'is_eligible' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }

        return [
            'status' => 'success',
            'validated' => $validated,
            'rattrapage' => $rattrapage,
            'failed' => $failed,
            'total_processed' => $studentGrades->count()
        ];
    }
}
