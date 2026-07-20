<?php

namespace App\Services\Academic;

use App\Models\Student;
use App\Models\Module;
use App\Models\Grade;

class DeliberationEngine
{
    /**
     * Calculate the module result for a specific student with official ENCG Apogée rules.
     * 
     * Rules:
     * - Module average >= 10/20 -> Validé (V)
     * - Any exam grade < 6.0/20 -> Note Éliminatoire (NV)
     * - Semester Average >= 10/20 & no eliminatory grade -> Validé par Compensation (VC)
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

            $value = $grade->absent ? 0.0 : ($grade->value ?? 0.0);
            
            $weightFraction = $assessment->weight / 100.0;
            $weightedSum += ($value * $weightFraction);
            $totalWeight += $weightFraction;

            // ENCG Apogée Rule: Exam < 6.0 is Eliminatory (NV)
            if (in_array(strtolower($assessment->type), ['exam', 'examen', 'cc2']) && $value < 6.0) {
                $hasEliminatory = true;
            }
        }

        $average = $totalWeight > 0 ? ($weightedSum / $totalWeight) : 0.0;
        $average = round($average, 2);

        // Determine Status
        $status = 'V'; // Validé

        if ($hasEliminatory) {
            $status = 'NV'; // Non Validé (Note éliminatoire < 6.0)
        } elseif ($average < 10.0) {
            $status = 'RAT'; // Rattrapage
        }

        return [
            'average' => $average,
            'status' => $status,
            'has_eliminatory' => $hasEliminatory,
            'missing_grades' => $missingGrades,
        ];
    }

    /**
     * Calculate Semester Deliberation with Compensation Rules.
     * If Semester Average >= 10.0 and no module has eliminatory mark (<6.0),
     * modules with grade between 7.0 and 9.99 are Validated by Compensation (VC).
     */
    public function calculateSemesterDeliberation(Student $student, $modules): array
    {
        $moduleResults = [];
        $totalWeights = 0;
        $totalWeightedScore = 0;
        $hasEliminatoryGrade = false;

        foreach ($modules as $module) {
            $res = $this->calculateModuleResult($student, $module);
            $weight = $module->coefficient ?? 1.0;
            
            $totalWeightedScore += ($res['average'] * $weight);
            $totalWeights += $weight;
            
            if ($res['has_eliminatory']) {
                $hasEliminatoryGrade = true;
            }

            $moduleResults[$module->id] = $res;
        }

        $semesterAverage = $totalWeights > 0 ? round($totalWeightedScore / $totalWeights, 2) : 0.0;
        $isAdmitted = $semesterAverage >= 10.0 && !$hasEliminatoryGrade;

        // Apply compensation (VC) if admitted
        if ($isAdmitted) {
            foreach ($moduleResults as $modId => &$res) {
                if ($res['status'] === 'RAT' && $res['average'] >= 7.0) {
                    $res['status'] = 'VC'; // Validé par Compensation
                }
            }
        }

        return [
            'semester_average' => $semesterAverage,
            'is_admitted' => $isAdmitted,
            'has_eliminatory' => $hasEliminatoryGrade,
            'decision' => $isAdmitted ? 'ADMIS (SEMESTRE VALIDÉ)' : 'RATTRAPAGE / NON ADMIS',
            'module_results' => $moduleResults
        ];
    }
}
