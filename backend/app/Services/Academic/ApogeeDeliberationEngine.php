<?php

namespace App\Services\Academic;

use App\Models\Grade;
use App\Models\Module;
use App\Models\Semester;
use App\Models\User;
use App\Models\StudentModuleReservation;
use App\Models\ResitEligibility;
use Exception;

class ApogeeDeliberationEngine
{
    /**
     * Calculate Final Module Grade for Ordinary Session.
     * Rule: ModuleGrade = (CC * 0.5) + (Exam * 0.5)
     * If ABSENT in exam -> 0 and NOT_VALIDATED.
     * 
     * @return array ['grade' => float, 'validated' => bool, 'absent' => bool]
     */
    public function calculateModuleGrade(?float $ccGrade, ?float $examGrade, bool $isExamAbsent): array
    {
        if ($isExamAbsent) {
            return [
                'grade' => 0.0,
                'validated' => false,
                'absent' => true
            ];
        }

        $cc = $ccGrade ?? 0.0;
        $exam = $examGrade ?? 0.0;

        $finalGrade = ($cc * 0.5) + ($exam * 0.5);
        
        return [
            'grade' => round($finalGrade, 2),
            'validated' => $finalGrade >= 10.0,
            'absent' => false
        ];
    }

    /**
     * Calculate Final Module Grade for Resit Session (Rattrapage).
     * Rule: Final Grade = MIN(10, MAX(CC, Resit_Exam_Grade))
     * Note: Apogee typically replaces the Exam grade with the Resit grade, but here the explicit rule provided is MIN(10, MAX(CC, Resit)).
     * Wait, the user said: Final Module Grade = MIN(10, MAX(CC_GRADE, RESIT_EXAM_GRADE)).
     * I will implement it EXACTLY as the user requested.
     */
    public function calculateResitGrade(?float $ccGrade, ?float $resitExamGrade, bool $isResitAbsent): array
    {
        if ($isResitAbsent) {
            return [
                'grade' => 0.0,
                'validated' => false,
                'absent' => true
            ];
        }

        $cc = $ccGrade ?? 0.0;
        $resit = $resitExamGrade ?? 0.0;

        $maxVal = max($cc, $resit);
        $finalGrade = min(10.0, $maxVal);

        return [
            'grade' => round($finalGrade, 2),
            'validated' => $finalGrade >= 10.0,
            'absent' => false
        ];
    }

    /**
     * Apply APOGEE-style Semester Compensation.
     * Rule: If Semester Average >= 10, all modules >= 0 are compensated (if no eliminatory note, assuming 0 is eliminatory threshold based on user prompt, but user just said >= 10).
     */
    public function applyCompensation(array $moduleGrades): array
    {
        $totalGrades = 0;
        $count = count($moduleGrades);
        
        if ($count === 0) return ['average' => 0, 'compensated_modules' => []];

        foreach ($moduleGrades as $mg) {
            $totalGrades += $mg['grade'];
        }

        $semesterAverage = round($totalGrades / $count, 2);
        $isSemesterValidated = $semesterAverage >= 10.0;
        $compensatedModules = [];

        if ($isSemesterValidated) {
            foreach ($moduleGrades as $mg) {
                if ($mg['grade'] < 10.0) {
                    $compensatedModules[] = $mg['module_id'];
                }
            }
        }

        return [
            'average' => $semesterAverage,
            'is_validated' => $isSemesterValidated,
            'compensated_modules' => $compensatedModules
        ];
    }

    /**
     * Evaluate Year 1 -> Year 2 progression.
     * Rule: max_reserved_modules = 2 (default). If <= 2, pass. If > 2, repeat year.
     */
    public function evaluateProgression(int $failedModulesCount, int $maxReservedModules = 2): string
    {
        if ($failedModulesCount == 0) {
            return 'PASS';
        }

        if ($failedModulesCount <= $maxReservedModules) {
            return 'PASS_WITH_RESERVED_MODULES';
        }

        return 'REPEAT_YEAR';
    }

    /**
     * Evaluate Year 2 -> Year 3 progression.
     * Rule: MUST validate ALL reserved modules.
     */
    public function evaluateYear3Progression(int $failedModulesCount, int $unvalidatedReservedModulesCount): string
    {
        if ($unvalidatedReservedModulesCount > 0) {
            return 'RESERVE_YEAR';
        }

        if ($failedModulesCount == 0) {
            return 'PASS';
        }

        // Technically, can they pass to Y3 with new reserved modules from Y2? The rules say "must validate ALL reserved modules". 
        // Assuming yes, but they can't carry over Y1 modules to Y3.
        return 'PASS'; 
    }

    /**
     * Generate the final Jury Decision.
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

        if ($failedModulesCount == 0) {
            if ($annualAverage >= 10) { // Should be true if 0 failed modules, or fully compensated
                return 'PASS';
            }
        }

        // If they failed some modules, but the semester/annual compensation made them all >=10 via compensation
        // we'd need to check if ANY are truly "Failed" (not compensated).
        // Let's assume $failedModulesCount means TRULY failed (not compensated).

        if ($failedModulesCount > 0 && $failedModulesCount <= $maxReservedModules) {
            return 'PASS_WITH_RESERVED_MODULES';
        }

        return 'REPEAT_YEAR';
    }
}
