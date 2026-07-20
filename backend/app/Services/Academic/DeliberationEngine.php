<?php

namespace App\Services\Academic;

use App\Models\Student;
use App\Models\Module;
use App\Models\Grade;
use App\Models\DisciplineCase;

class DeliberationEngine
{
    /**
     * Calculate the module result for a specific student with official ENCG Apogée & Discipline rules.
     * 
     * Rules:
     * - Fraud / Conseil de Discipline sanction (annulation_module) -> Grade = 0.00/20, Status = 'FRAUDE'
     * - Module average >= 10/20 -> Validé (V)
     * - Any exam grade < 6.0/20 -> Note Éliminatoire (NV)
     * - Semester Average >= 10/20 & no eliminatory grade -> Validé par Compensation (VC)
     */
    public function calculateModuleResult(Student $student, Module $module): array
    {
        // 1. Check for Conseil de Discipline Sanction (Annulation Module or Semestre)
        $disciplinarySanction = DisciplineCase::where('student_id', $student->id)
            ->whereIn('decision', ['annulation_module', 'annulation_semestre', 'exclusion'])
            ->where('status', 'resolved')
            ->first();

        if ($disciplinarySanction) {
            if ($disciplinarySanction->decision === 'annulation_module') {
                return [
                    'average' => 0.0,
                    'status' => 'FRAUDE',
                    'has_eliminatory' => true,
                    'missing_grades' => false,
                    'disciplinary_mention' => 'Annulation de Note (Conseil de Discipline — Fraude)'
                ];
            } elseif (in_array($disciplinarySanction->decision, ['annulation_semestre', 'exclusion'])) {
                return [
                    'average' => 0.0,
                    'status' => 'DISCIPLINE',
                    'has_eliminatory' => true,
                    'missing_grades' => false,
                    'disciplinary_mention' => 'Annulation du Semestre (Conseil de Discipline)'
                ];
            }
        }

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
            'disciplinary_mention' => null
        ];
    }

    /**
     * Calculate Semester Deliberation with Compensation & Conseil de Discipline Sanctions.
     */
    public function calculateSemesterDeliberation(Student $student, $modules): array
    {
        // Check if student has a global semester cancellation sanction from Conseil de Discipline
        $disciplinarySanction = DisciplineCase::where('student_id', $student->id)
            ->whereIn('decision', ['annulation_semestre', 'exclusion'])
            ->where('status', 'resolved')
            ->first();

        if ($disciplinarySanction) {
            $moduleResults = [];
            foreach ($modules as $module) {
                $moduleResults[$module->id] = [
                    'average' => 0.0,
                    'status' => 'DISCIPLINE',
                    'has_eliminatory' => true,
                    'missing_grades' => false,
                    'disciplinary_mention' => 'Annulé par Conseil de Discipline'
                ];
            }

            return [
                'semester_average' => 0.0,
                'is_admitted' => false,
                'has_eliminatory' => true,
                'is_disciplinary' => true,
                'decision' => 'ANNULATION DU SEMESTRE (CONSEIL DE DISCIPLINE — FRAUDE)',
                'module_results' => $moduleResults
            ];
        }

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
            'is_disciplinary' => false,
            'decision' => $isAdmitted ? 'ADMIS (SEMESTRE VALIDÉ)' : 'RATTRAPAGE / NON ADMIS',
            'module_results' => $moduleResults
        ];
    }
}
