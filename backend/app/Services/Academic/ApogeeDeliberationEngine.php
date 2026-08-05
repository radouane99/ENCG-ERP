<?php

namespace App\Services\Academic;

use App\Models\Institution;

class ApogeeDeliberationEngine
{
    /**
     * Calculer la note finale d'un module (session ordinaire).
     */
    public function calculateModuleGrade(?float $ccGrade, ?float $examGrade, bool $isExamAbsent): array
    {
        if ($isExamAbsent) {
            return ['grade' => 0.0, 'validated' => false, 'absent' => true];
        }

        $finalGrade = round((($ccGrade ?? 0.0) * 0.5) + (($examGrade ?? 0.0) * 0.5), 2);

        return [
            'grade'     => $finalGrade,
            'validated' => $finalGrade >= 10.0,
            'absent'    => false,
        ];
    }

    /**
     * Calculer la note finale après rattrapage.
     */
    public function calculateResitGrade(?float $ccGrade, ?float $resitExamGrade, bool $isResitAbsent, ?float $maxCap = null): array
    {
        if ($isResitAbsent) {
            return ['grade' => 0.0, 'validated' => false, 'absent' => true];
        }

        if ($maxCap === null) {
            $maxCap = (float) (Institution::first()?->settings['rattrapage_max_grade'] ?? 12.0);
        }

        $finalGrade = round(min($maxCap, max($ccGrade ?? 0.0, $resitExamGrade ?? 0.0)), 2);

        return [
            'grade'     => $finalGrade,
            'validated' => $finalGrade >= 10.0,
            'absent'    => false,
        ];
    }

    /**
     * Appliquer la compensation semestrielle APOGEE.
     */
    public function applyCompensation(array $moduleGrades): array
    {
        $count = count($moduleGrades);
        if ($count === 0) {
            return ['average' => 0, 'is_validated' => false, 'compensated_modules' => []];
        }

        $semesterAverage = round(array_sum(array_column($moduleGrades, 'grade')) / $count, 2);
        $isValidated     = $semesterAverage >= 10.0;
        $compensated     = [];

        if ($isValidated) {
            foreach ($moduleGrades as $mg) {
                if ($mg['grade'] < 10.0) {
                    $compensated[] = $mg['module_id'];
                }
            }
        }

        return [
            'average'             => $semesterAverage,
            'is_validated'        => $isValidated,
            'compensated_modules' => $compensated,
        ];
    }

    /**
     * Évaluer la progression (Année 1 → Année 2).
     */
    public function evaluateProgression(int $failedModulesCount, int $maxReservedModules = 2): string
    {
        return match (true) {
            $failedModulesCount === 0 => 'PASS',
            $failedModulesCount <= $maxReservedModules => 'PASS_WITH_RESERVED_MODULES',
            default => 'REPEAT_YEAR',
        };
    }

    /**
     * Évaluer la progression (Année 2 → Année 3).
     */
    public function evaluateYear3Progression(int $failedModulesCount, int $unvalidatedReservedModulesCount): string
    {
        if ($unvalidatedReservedModulesCount > 0) {
            return 'RESERVE_YEAR';
        }

        return $failedModulesCount === 0 ? 'PASS' : 'PASS_WITH_RESERVED_MODULES';
    }

    /**
     * Générer la décision finale du jury.
     */
    public function generateJuryDecision(
        float $annualAverage,
        int $failedModulesCount,
        int $unvalidatedReservedModulesCount,
        int $yearLevel,
        int $maxReservedModules = 2
    ): string {
        if ($yearLevel == 2 && $unvalidatedReservedModulesCount > 0) {
            return 'RESERVE_YEAR';
        }

        if ($failedModulesCount === 0) {
            return $annualAverage >= 10 ? 'PASS' : 'REPEAT_YEAR';
        }

        return $failedModulesCount <= $maxReservedModules
            ? 'PASS_WITH_RESERVED_MODULES'
            : 'REPEAT_YEAR';
    }
}