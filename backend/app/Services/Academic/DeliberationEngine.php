<?php

namespace App\Services\Academic;

use App\Domain\Deliberation\LmdRules;
use App\Models\DisciplinaryDecision;
use App\Models\Grade;
use App\Models\Module;
use App\Models\Student;

class DeliberationEngine
{
    /**
     * Calculer le résultat d'un module avec règles ENCG et discipline.
     */
    public function calculateModuleResult(Student $student, Module $module): array
    {
        // Vérifier les sanctions disciplinaires
        $sanction = DisciplinaryDecision::whereHas('disciplinaryCase', function ($q) use ($student) {
            $q->where('student_id', $student->id)
                ->where('status', 'resolved');
        })->whereIn('sanction_type', ['annulation_module', 'annulation_semestre', 'exclusion'])
            ->first();

        if ($sanction) {
            return match ($sanction->sanction_type) {
                'annulation_module' => [
                    'average' => 0.0,
                    'status' => 'FRAUDE',
                    'has_eliminatory' => true,
                    'missing_grades' => false,
                    'disciplinary_mention' => 'Annulation de Note (Conseil de Discipline)',
                ],
                'annulation_semestre', 'exclusion' => [
                    'average' => 0.0,
                    'status' => 'DISCIPLINE',
                    'has_eliminatory' => true,
                    'missing_grades' => false,
                    'disciplinary_mention' => 'Annulation du Semestre (Conseil de Discipline)',
                ],
                default => [],
            };
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

            if (! $grade) {
                $missingGrades = true;

                continue;
            }

            $value = $grade->absent ? 0.0 : ($grade->value ?? 0.0);
            $weightFraction = $assessment->weight / 100.0;
            $weightedSum += ($value * $weightFraction);
            $totalWeight += $weightFraction;

            if (in_array(strtolower($assessment->type), ['exam', 'examen', 'cc2']) && LmdRules::isEliminatory($value)) {
                $hasEliminatory = true;
            }
        }

        $average = $totalWeight > 0 ? round($weightedSum / $totalWeight, 2) : 0.0;

        $status = match (true) {
            $hasEliminatory => 'NV',
            $average < LmdRules::VALIDATION_THRESHOLD => 'RAT',
            default => 'V',
        };

        return [
            'average' => $average,
            'status' => $status,
            'has_eliminatory' => $hasEliminatory,
            'hasEliminatory' => $hasEliminatory,
            'missing_grades' => $missingGrades,
            'missingGrades' => $missingGrades,
            'disciplinary_mention' => null,
        ];
    }

    /**
     * Calculer la délibération semestrielle avec compensation.
     */
    public function calculateSemesterDeliberation(Student $student, $modules): array
    {
        // Sanction semestre entier
        $sanction = DisciplinaryDecision::whereHas('disciplinaryCase', function ($q) use ($student) {
            $q->where('student_id', $student->id)->where('status', 'resolved');
        })->whereIn('sanction_type', ['annulation_semestre', 'exclusion'])->first();

        if ($sanction) {
            $moduleResults = [];
            foreach ($modules as $module) {
                $moduleResults[$module->id] = [
                    'average' => 0.0,
                    'status' => 'DISCIPLINE',
                    'has_eliminatory' => true,
                    'missing_grades' => false,
                    'disciplinary_mention' => 'Annulé par Conseil de Discipline',
                ];
            }

            return [
                'semester_average' => 0.0,
                'is_admitted' => false,
                'has_eliminatory' => true,
                'is_disciplinary' => true,
                'decision' => 'ANNULATION DU SEMESTRE (CONSEIL DE DISCIPLINE)',
                'module_results' => $moduleResults,
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
        $isAdmitted = $semesterAverage >= LmdRules::VALIDATION_THRESHOLD && ! $hasEliminatoryGrade;

        if ($isAdmitted) {
            foreach ($moduleResults as &$res) {
                if ($res['status'] === 'RAT' && $res['average'] >= LmdRules::ELIMINATORY_THRESHOLD) {
                    $res['status'] = 'VC';
                }
            }
        }

        return [
            'semester_average' => $semesterAverage,
            'is_admitted' => $isAdmitted,
            'has_eliminatory' => $hasEliminatoryGrade,
            'is_disciplinary' => false,
            'decision' => $isAdmitted ? 'ADMIS (SEMESTRE VALIDÉ)' : 'RATTRAPAGE / NON ADMIS',
            'module_results' => $moduleResults,
        ];
    }
}
