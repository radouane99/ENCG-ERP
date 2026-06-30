<?php

declare(strict_types=1);

namespace App\Domain\Exam\Services;

use App\Domain\Academic\Models\Filiere;
use App\Domain\Exam\Models\Deliberation;
use App\Domain\Exam\Models\DeliberationDecision;
use App\Domain\Exam\Models\CompensationRule;
use App\Domain\Exam\Models\Grade;
use App\Domain\Student\Models\Student;
use Illuminate\Support\Collection;

/**
 * DeliberationEngine
 *
 * Implements Apogée-inspired deliberation logic for Moroccan universities.
 * Handles:
 *  - Module average calculation from weighted components (CC, TP, Projet, Final)
 *  - Semester average from module averages with coefficients
 *  - Compensation between modules (within semester)
 *  - Compensation between semesters (annual)
 *  - Rattrapage (jury rachat) decisions
 *  - Pass/Fail/Retake determination
 */
class DeliberationEngine
{
    public function __construct(
        private readonly CompensationRule $compensationRules,
    ) {}

    /**
     * Run deliberation for all students in a group/filiere.
     */
    public function processDeliberation(Deliberation $deliberation): void
    {
        $deliberation->update(['status' => 'in_progress']);

        $students = $this->getStudentsForDeliberation($deliberation);

        foreach ($students as $student) {
            $decision = $this->processStudentDeliberation($deliberation, $student);
            $decision->save();
        }

        $deliberation->update(['status' => 'completed']);
    }

    /**
     * Calculate a single student's deliberation result.
     */
    public function processStudentDeliberation(Deliberation $deliberation, Student $student): DeliberationDecision
    {
        // 1. Gather all module grades for this semester
        $moduleAverages = $this->calculateModuleAverages($student, $deliberation);

        // 2. Calculate raw semester average
        $semesterAverage = $this->calculateSemesterAverage($moduleAverages, $deliberation->filiere_id);

        // 3. Apply compensation rules (between modules)
        $compensationResult = $this->applyCompensation($student, $moduleAverages, $deliberation, $semesterAverage);
        $compensatedAverage = $compensationResult['average'];

        // 4. Determine decision
        $decision = $this->determineDecision($compensatedAverage, $moduleAverages, $compensationResult);

        return new DeliberationDecision([
            'deliberation_id'      => $deliberation->id,
            'student_id'           => $student->id,
            'semester_average'     => round($semesterAverage, 2),
            'compensated_average'  => round($compensatedAverage, 2),
            'was_compensated'      => $compensationResult['was_compensated'],
            'decision'             => $decision['decision'],
            'mention'              => $this->getMention($compensatedAverage),
            'next_semester'        => $decision['next_semester'],
            'jury_notes'           => $decision['notes'],
        ]);
    }

    /**
     * Calculate each module's average from its grade components.
     * Formula: Sum(component_score * component_weight) / Sum(weights)
     */
    public function calculateModuleAverages(Student $student, Deliberation $deliberation): Collection
    {
        return Grade::query()
            ->where('student_id', $student->id)
            ->where('exam_session_id', $deliberation->semester->exam_session_id ?? null)
            ->with(['gradeComponent.module'])
            ->get()
            ->groupBy('gradeComponent.module_id')
            ->map(function ($moduleGrades, $moduleId) {
                $totalWeight = 0;
                $weightedSum = 0;
                $hasEliminatory = false;

                foreach ($moduleGrades as $grade) {
                    $component = $grade->gradeComponent;
                    $weight = (float) $component->weight;
                    $score = $grade->is_absent ? 0 : (float) ($grade->final_score ?? $grade->score ?? 0);

                    // Check eliminatory threshold
                    if ($component->is_eliminatory && $score < (float) $component->eliminatory_threshold) {
                        $hasEliminatory = true;
                    }

                    $weightedSum += $score * $weight;
                    $totalWeight += $weight;
                }

                $average = $totalWeight > 0 ? $weightedSum / $totalWeight : 0;
                $module = $moduleGrades->first()->gradeComponent->module;

                return [
                    'module_id'    => $moduleId,
                    'module'       => $module,
                    'average'      => round($average, 2),
                    'coefficient'  => (float) $module->coefficient,
                    'is_validated' => $average >= 10.0 && !$hasEliminatory,
                    'has_eliminatory_failure' => $hasEliminatory,
                ];
            });
    }

    /**
     * Calculate semester average from module averages weighted by coefficient.
     */
    public function calculateSemesterAverage(Collection $moduleAverages, int $filiereId): float
    {
        $totalCoefficients = $moduleAverages->sum('coefficient');
        if ($totalCoefficients === 0.0) {
            return 0.0;
        }

        $weightedSum = $moduleAverages->sum(fn ($m) => $m['average'] * $m['coefficient']);
        return $weightedSum / $totalCoefficients;
    }

    /**
     * Apply compensation rules between modules in a semester.
     * A student passes if:
     *   - Semester average >= 10 AND
     *   - No module grade < 7 (unless compensation rule allows) AND
     *   - No eliminatory failure
     */
    public function applyCompensation(
        Student $student,
        Collection $moduleAverages,
        Deliberation $deliberation,
        float $semesterAverage
    ): array {
        $rules = CompensationRule::query()
            ->where('institution_id', $deliberation->institution_id)
            ->where(function ($q) use ($deliberation) {
                $q->whereNull('filiere_id')
                  ->orWhere('filiere_id', $deliberation->filiere_id);
            })
            ->where('is_active', true)
            ->first();

        if (!$rules) {
            return ['average' => $semesterAverage, 'was_compensated' => false, 'details' => []];
        }

        $minModuleGrade = (float) $rules->minimum_module_grade;  // default 7.0
        $failedModules = $moduleAverages->filter(fn ($m) => $m['average'] < $minModuleGrade);

        // If any eliminatory failure, compensation doesn't apply
        if ($moduleAverages->contains('has_eliminatory_failure', true)) {
            return ['average' => $semesterAverage, 'was_compensated' => false, 'details' => []];
        }

        // If semester average >= threshold and no module below minimum → passed with compensation
        if ($semesterAverage >= (float) $rules->minimum_average && $failedModules->isEmpty()) {
            return ['average' => $semesterAverage, 'was_compensated' => false, 'details' => []];
        }

        // Compensation: if average >= 10 and deficit in single module within allowed range
        if ($semesterAverage >= 10.0 && $failedModules->count() === 1) {
            $deficit = 10.0 - $failedModules->first()['average'];
            if ($deficit <= (float) $rules->max_deficit_allowed) {
                return [
                    'average'        => $semesterAverage,
                    'was_compensated' => true,
                    'details'        => $failedModules->values()->toArray(),
                ];
            }
        }

        return ['average' => $semesterAverage, 'was_compensated' => false, 'details' => []];
    }

    /**
     * Determine pass/fail/retake decision.
     */
    private function determineDecision(float $average, Collection $moduleAverages, array $compensationResult): array
    {
        // Eliminatory failure → excluded
        if ($moduleAverages->contains('has_eliminatory_failure', true)) {
            return ['decision' => 'excluded', 'next_semester' => null, 'notes' => 'Échec éliminatoire'];
        }

        // Passed (with or without compensation)
        if ($average >= 10.0) {
            return [
                'decision'     => 'admitted',
                'next_semester' => null,
                'notes'        => $compensationResult['was_compensated'] ? 'Admis par compensation' : null,
            ];
        }

        // Failed but can retake (5-9.99 range)
        if ($average >= 5.0) {
            return ['decision' => 'retake', 'next_semester' => null, 'notes' => 'Convoqué en rattrapage'];
        }

        // Below 5 → excluded from retake
        return ['decision' => 'excluded', 'next_semester' => null, 'notes' => 'Moyenne insuffisante pour rattrapage'];
    }

    /**
     * Academic mention (Appréciation) based on average.
     */
    public function getMention(float $average): string
    {
        return match (true) {
            $average >= 16 => 'Très Bien',
            $average >= 14 => 'Bien',
            $average >= 12 => 'Assez Bien',
            $average >= 10 => 'Passable',
            default        => 'Ajourné',
        };
    }

    private function getStudentsForDeliberation(Deliberation $deliberation): Collection
    {
        return Student::query()
            ->where('institution_id', $deliberation->institution_id)
            ->whereHas('currentPathway', function ($q) use ($deliberation) {
                $q->where('filiere_id', $deliberation->filiere_id)
                  ->when($deliberation->group_id, fn ($q) => $q->where('group_id', $deliberation->group_id));
            })
            ->with(['grades', 'currentPathway'])
            ->get();
    }
}
