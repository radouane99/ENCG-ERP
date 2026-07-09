<?php

namespace App\Services\Academic;

use App\Models\Student;
use App\Models\Module;
use App\Models\Grade;

class DeliberationEngine
{
    /**
     * Calculate the module result for a specific student.
     * 
     * @param Student $student
     * @param Module $module
     * @return array{average: float, status: string, missing_grades: bool}
     */
    public function calculateModuleResult(Student $student, Module $module): array
    {
        $assessments = $module->assessments;
        
        $totalWeight = 0;
        $weightedSum = 0;
        $hasEliminatory = false;
        $missingGrades = false;

        foreach ($assessments as $assessment) {
            $grade = Grade::where('student_id', $student->id)
                          ->where('assessment_id', $assessment->id)
                          ->first();

            if (!$grade) {
                $missingGrades = true;
                continue;
            }

            // Treat absent as 0.0
            $value = $grade->absent ? 0.0 : ($grade->value ?? 0.0);
            
            $weightFraction = $assessment->weight / 100.0;
            $weightedSum += ($value * $weightFraction);
            $totalWeight += $weightFraction;

            // Apogée Rules: Exam < 5 is Eliminatory (NV)
            if ($assessment->type === 'Exam' && $value < 5.0) {
                $hasEliminatory = true;
            }
        }

        // If weight doesn't sum to 100%, we normalize it, or just use the sum calculated
        $average = $totalWeight > 0 ? ($weightedSum / $totalWeight) : 0.0;
        $average = round($average, 2);

        // Determine Status
        $status = 'V'; // Validé

        if ($hasEliminatory) {
            $status = 'NV'; // Non Validé (Eliminatory)
        } elseif ($average < 10.0) {
            $status = 'RAT'; // Rattrapage
        }

        return [
            'average' => $average,
            'status' => $status,
            'missing_grades' => $missingGrades,
        ];
    }
}
