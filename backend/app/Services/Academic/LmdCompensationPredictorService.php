<?php

namespace App\Services\Academic;

use App\Domain\Deliberation\LmdRules;

class LmdCompensationPredictorService
{
    /**
     * Seuil éliminatoire selon le cycle ENCG.
     * Tronc Commun (S1-S4) : 06.00/20
     * Cycle Master / Spécialité (S5-S10) : 07.00/20
     */
    const ELIMINATORY_THRESHOLD_TRONC_COMMUN = LmdRules::ELIMINATORY_THRESHOLD;

    const ELIMINATORY_THRESHOLD_MASTER = 7.00;

    const VALIDATION_THRESHOLD = LmdRules::VALIDATION_THRESHOLD;

    /**
     * Simule le résultat d'un semestre selon les notes fournies.
     *
     * @param  array  $modules  Array of ['name' => string, 'coefficient' => float, 'grade' => float, 'is_rattrapage' => bool]
     * @param  int  $semesterNumber  Numéro du semestre (1 à 10)
     * @param  float  $targetGpa  Moyenne cible souhaitée (ex: 10.00, 12.00, 14.00)
     */
    public function simulate(array $modules, int $semesterNumber = 2, float $targetGpa = LmdRules::VALIDATION_THRESHOLD): array
    {
        $isMaster = $semesterNumber >= 5;
        $eliminatoryThreshold = $isMaster ? self::ELIMINATORY_THRESHOLD_MASTER : self::ELIMINATORY_THRESHOLD_TRONC_COMMUN;

        $totalWeighted = 0;
        $totalCoeff = 0;
        $modulesResult = [];
        $hasEliminatory = false;
        $nonValidatedCount = 0;
        $missingGradeCount = 0;

        foreach ($modules as $mod) {
            $name = $mod['name'] ?? 'Module';
            $coeff = max(1.0, (float) ($mod['coefficient'] ?? 1.0));
            $grade = isset($mod['grade']) && $mod['grade'] !== null ? (float) $mod['grade'] : null;

            if ($grade === null) {
                $missingGradeCount++;
                $modulesResult[] = [
                    'name' => $name,
                    'coefficient' => $coeff,
                    'grade' => null,
                    'status' => 'PENDING',
                    'status_label' => 'À passer / En attente',
                    'is_eliminatory' => false,
                ];
                $totalCoeff += $coeff;

                continue;
            }

            $grade = min(20.0, max(0.0, $grade));
            $isElim = $grade < $eliminatoryThreshold;
            $isValid = $grade >= self::VALIDATION_THRESHOLD;

            if ($isElim) {
                $hasEliminatory = true;
            }
            if (! $isValid) {
                $nonValidatedCount++;
            }

            $totalWeighted += ($grade * $coeff);
            $totalCoeff += $coeff;

            $modulesResult[] = [
                'name' => $name,
                'coefficient' => $coeff,
                'grade' => round($grade, 2),
                'status' => $isValid ? 'VALIDATED' : ($isElim ? 'ELIMINATORY' : 'COMPENSABLE'),
                'status_label' => $isValid ? 'Validé' : ($isElim ? 'Note Éliminatoire' : 'Compensable'),
                'is_eliminatory' => $isElim,
            ];
        }

        $calculatedAverage = $totalCoeff > 0 ? ($totalWeighted / $totalCoeff) : 0;

        // Détermination de la décision du Jury LMD
        $decision = 'AJOURNE';
        $decisionLabel = 'Session de Rattrapage (Ajourné)';
        $decisionColor = 'rose';

        if ($missingGradeCount === 0) {
            if ($nonValidatedCount === 0) {
                $decision = 'VALIDE';
                $decisionLabel = 'Semestre Validé (V)';
                $decisionColor = 'emerald';
            } elseif ($calculatedAverage >= self::VALIDATION_THRESHOLD && ! $hasEliminatory) {
                $decision = 'COMPENSE';
                $decisionLabel = 'Validé par Compensation (VPC)';
                $decisionColor = 'indigo';
            } else {
                $decision = 'RATTRAPAGE';
                $decisionLabel = 'Ajourné — Convoqué au Rattrapage (RAT)';
                $decisionColor = 'rose';
            }
        } else {
            $decision = 'EN_COURS';
            $decisionLabel = 'Simulation Prévisionnelle en Cours';
            $decisionColor = 'amber';
        }

        // Calcul de la mention
        $honour = 'Sans Mention';
        if ($calculatedAverage >= 16.0) {
            $honour = 'Très Bien (Félicitations du Jury)';
        } elseif ($calculatedAverage >= 14.0) {
            $honour = 'Bien';
        } elseif ($calculatedAverage >= 12.0) {
            $honour = 'Assez Bien';
        } elseif ($calculatedAverage >= LmdRules::VALIDATION_THRESHOLD) {
            $honour = 'Passable';
        }

        // Calcul du besoin pour la moyenne cible
        $targetCalculation = $this->calculateRequiredGradeForTarget($modules, $targetGpa, $totalCoeff, $eliminatoryThreshold);
        $rescuePlan = $this->buildRattrapageRescuePlan($modulesResult, $totalWeighted, $totalCoeff, $targetGpa, $eliminatoryThreshold);

        return [
            'semester_number' => $semesterNumber,
            'cycle' => $isMaster ? 'Cycle Master / Spécialisation' : 'Tronc Commun',
            'eliminatory_threshold' => $eliminatoryThreshold,
            'validation_threshold' => self::VALIDATION_THRESHOLD,
            'current_average' => round($calculatedAverage, 2),
            'decision' => $decision,
            'decision_label' => $decisionLabel,
            'decision_color' => $decisionColor,
            'honour' => $honour,
            'has_eliminatory_grade' => $hasEliminatory,
            'non_validated_modules_count' => $nonValidatedCount,
            'missing_grades_count' => $missingGradeCount,
            'modules' => $modulesResult,
            'rescue_plan' => $rescuePlan,
            'target_simulation' => [
                'target_gpa' => $targetGpa,
                'is_achievable' => $targetCalculation['is_achievable'],
                'required_grade' => $targetCalculation['required_grade'],
                'advice' => $targetCalculation['advice'],
            ],
        ];
    }

    /**
     * Génère un plan de sauvetage précis module par module (session de rattrapage / compensation).
     */
    protected function buildRattrapageRescuePlan(
        array $modulesResult,
        float $totalWeighted,
        float $totalCoeff,
        float $targetGpa,
        float $eliminatoryThreshold
    ): array {
        if ($totalCoeff <= 0) {
            return [];
        }

        $targetSum = $targetGpa * $totalCoeff;
        $pointsDeficit = max(0.0, $targetSum - $totalWeighted);
        $plan = [];

        foreach ($modulesResult as $mod) {
            $grade = $mod['grade'];
            $coeff = max(1.0, (float) ($mod['coefficient'] ?? 1.0));

            if ($grade !== null && $grade >= self::VALIDATION_THRESHOLD && $pointsDeficit <= 0) {
                continue;
            }

            $currentContribution = ($grade ?? 0.0) * $coeff;
            $otherModulesSum = $totalWeighted - $currentContribution;
            $neededInThisModuleAlone = ($targetSum - $otherModulesSum) / $coeff;
            $minRequiredAlone = round(max($eliminatoryThreshold, $neededInThisModuleAlone), 2);

            if ($grade === null || $grade < self::VALIDATION_THRESHOLD) {
                $plan[] = [
                    'name' => $mod['name'],
                    'coefficient' => $coeff,
                    'current_grade' => $grade,
                    'is_eliminatory' => (bool) ($mod['is_eliminatory'] ?? false),
                    'min_to_lift_eliminatory' => $eliminatoryThreshold,
                    'min_to_validate_module' => self::VALIDATION_THRESHOLD,
                    'target_alone_for_semester_goal' => $minRequiredAlone <= 20.0 ? $minRequiredAlone : null,
                    'can_compensate_alone' => $minRequiredAlone <= 20.0,
                    'points_gained_at_10' => $grade !== null && $grade < self::VALIDATION_THRESHOLD
                        ? round((self::VALIDATION_THRESHOLD - $grade) * $coeff, 2)
                        : round(self::VALIDATION_THRESHOLD * $coeff, 2),
                ];
            }
        }

        return $plan;
    }

    /**
     * Calcule la note minimale requise dans les modules restants ou à rattraper pour atteindre la moyenne cible.
     */
    protected function calculateRequiredGradeForTarget(array $modules, float $targetGpa, float $totalCoeff, float $eliminatoryThreshold): array
    {
        $currentSum = 0;
        $missingCoeff = 0;

        foreach ($modules as $mod) {
            $coeff = max(1.0, (float) ($mod['coefficient'] ?? 1.0));
            if (isset($mod['grade']) && $mod['grade'] !== null) {
                $currentSum += ((float) $mod['grade'] * $coeff);
            } else {
                $missingCoeff += $coeff;
            }
        }

        if ($missingCoeff === 0) {
            $avg = $totalCoeff > 0 ? ($currentSum / $totalCoeff) : 0;

            return [
                'is_achievable' => $avg >= $targetGpa,
                'required_grade' => null,
                'advice' => $avg >= $targetGpa
                    ? "Félicitations ! Votre moyenne actuelle ({$avg}/20) atteint déjà l'objectif visé."
                    : "Toutes les notes sont déjà saisies. Votre moyenne finale est de {$avg}/20.",
            ];
        }

        $neededSum = ($targetGpa * $totalCoeff) - $currentSum;
        $requiredPerCoeff = $neededSum / $missingCoeff;

        $isAchievable = $requiredPerCoeff <= 20.0;
        $requiredGrade = round(max($eliminatoryThreshold, $requiredPerCoeff), 2);

        $advice = '';
        if ($requiredPerCoeff > 20.0) {
            $advice = 'Mathématiquement inatteignable (nécessiterait plus de 20/20). Visez la validation standard à 10.00/20.';
        } elseif ($requiredGrade < $eliminatoryThreshold) {
            $advice = "Une note minimale de {$eliminatoryThreshold}/20 (seuil éliminatoire) dans les matières restantes vous garantit l'atteinte de cet objectif.";
        } else {
            $advice = "Il vous faut une moyenne d'au moins {$requiredGrade}/20 dans les {$missingCoeff} coefficients restants pour décrocher cet objectif.";
        }

        return [
            'is_achievable' => $isAchievable,
            'required_grade' => $isAchievable ? $requiredGrade : null,
            'advice' => $advice,
        ];
    }
}
