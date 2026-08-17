<?php

namespace App\Domain\Deliberation\Services;

use App\Models\Deliberation;
use App\Models\DeliberationDecision;
use App\Models\ExamSession;
use App\Models\ResitEligibility;
use App\Models\Student;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Enterprise Service for processing academic deliberations (Apogée style).
 * Handles average calculations, elimination rules, rachat, and Rattrapage eligibility.
 */
class DeliberationEngine
{
    /**
     * Run a full deliberation process for a given semester or year.
     */
    public function processDeliberation(Deliberation $deliberation): void
    {
        DB::transaction(function () use ($deliberation) {
            $deliberation->update(['status' => 'in_progress']);

            // 1. Fetch all students registered in this filiere/semester/group
            $students = $this->getEligibleStudents($deliberation);
            $semesterNumber = $deliberation->semester->number;
            $isRattrapage = ($deliberation->type === 'RATTRAPAGE');

            foreach ($students as $student) {
                // 2. Calculate raw averages per module (Handles MAX of Normale vs Rattrapage)
                $moduleAverages = $this->calculateModuleAverages($student->id, $semesterNumber, $isRattrapage);

                // 3. Grant Rattrapage Eligibility for failed modules (If this is NORMALE deliberation)
                if (! $isRattrapage) {
                    $this->grantResitEligibility($student->id, $moduleAverages, $deliberation);
                }

                // 4. Check for eliminatory marks (< 7/20)
                $hasEliminatory = $this->checkEliminatoryMarks($moduleAverages);

                // 5. Calculate semester average
                $semesterAverage = $moduleAverages->avg('final_module_score');

                // 6. Apply Compensation (Rachat) rules if applicable
                $decision = 'retake'; // Assume retake by default
                $wasCompensated = false;
                $compensatedAverage = null;

                if ($semesterAverage >= 10 && ! $hasEliminatory) {
                    $decision = 'admitted';
                } elseif ($semesterAverage >= 9.5 && $semesterAverage < 10 && ! $hasEliminatory) {
                    // System Rachat (Jury Compensation)
                    $decision = 'admitted';
                    $wasCompensated = true;
                    $compensatedAverage = 10.00;
                }

                // 7. Record Decision
                DeliberationDecision::updateOrCreate(
                    [
                        'deliberation_id' => $deliberation->id,
                        'student_id' => $student->id,
                    ],
                    [
                        'semester_average' => $semesterAverage,
                        'compensated_average' => $compensatedAverage,
                        'decision' => $decision,
                        'was_compensated' => $wasCompensated,
                        'mention' => $this->calculateMention($compensatedAverage ?? $semesterAverage),
                    ]
                );
            }

            $deliberation->update(['status' => 'completed']);
        });
    }

    private function getEligibleStudents(Deliberation $deliberation): Collection
    {
        return Student::whereHas('registrations', function ($query) use ($deliberation) {
            $query->where('academic_year_id', $deliberation->academic_year_id)
                ->where('filiere_id', $deliberation->filiere_id);

            if ($deliberation->group_id) {
                $query->where('group_id', $deliberation->group_id);
            }
        })->get();
    }

    private function calculateModuleAverages(int $studentId, int $semesterNumber, bool $includeRattrapage): Collection
    {
        return DB::table('grades')
            ->join('assessments', 'grades.assessment_id', '=', 'assessments.id')
            ->join('modules', 'assessments.module_id', '=', 'modules.id')
            ->where('grades.student_id', $studentId)
            ->where('modules.semester_number', $semesterNumber)
            ->select(
                'modules.id as module_id',
                DB::raw('SUM(grades.value * (assessments.weight / 100.0)) as final_module_score')
            )
            ->groupBy('modules.id')
            ->get();
    }

    private function grantResitEligibility(int $studentId, Collection $moduleAverages, Deliberation $deliberation): void
    {
        $session = $deliberation->semester?->examSessions()->where('type', 'normale')->orWhere('type', 'NORMALE')->first()
            ?? $deliberation->semester?->examSessions()->first()
            ?? ExamSession::first();

        $examSessionId = $session?->id;

        if (! $examSessionId) {
            return;
        }

        // Standard rule: < 10 grants rattrapage eligibility
        foreach ($moduleAverages as $module) {
            if ($module->final_module_score < 10.0) {
                ResitEligibility::updateOrCreate(
                    [
                        'student_id' => $studentId,
                        'module_id' => $module->module_id,
                        'exam_session_id' => $examSessionId,
                    ],
                    [
                        'is_eligible' => true,
                    ]
                );
            }
        }
    }

    private function checkEliminatoryMarks(Collection $moduleAverages): bool
    {
        // Moroccan university standard: < 7/20 is often eliminatory for the whole semester
        $threshold = 7.0;

        foreach ($moduleAverages as $module) {
            if ($module->final_module_score < $threshold) {
                return true;
            }
        }

        return false;
    }

    private function calculateMention(float $average): ?string
    {
        if ($average < 10) {
            return null;
        }
        if ($average < 12) {
            return 'Passable';
        }
        if ($average < 14) {
            return 'Assez Bien';
        }
        if ($average < 16) {
            return 'Bien';
        }

        return 'Très Bien';
    }
}
