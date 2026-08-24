<?php

namespace App\Domain\Deliberation\Services;

use App\Domain\Deliberation\LmdRules;
use App\Models\Deliberation;
use App\Models\DeliberationDecision;
use App\Models\ResitEligibility;
use App\Models\Student;
use App\Services\Academic\DeliberationEngine as CanonicalDeliberationEngine;
use App\Services\Academic\DeliberationSealService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Orchestration jury / décisions — les moyennes module/semestre viennent du moteur LMD canonique.
 */
class DeliberationEngine extends CanonicalDeliberationEngine
{
    public function processDeliberation(Deliberation $deliberation): void
    {
        app(DeliberationSealService::class)->assertNotSealed($deliberation);

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

                // 4. Check for eliminatory marks (< 6/20 NPN)
                $hasEliminatory = $this->checkEliminatoryMarks($moduleAverages);

                // 5. Calculate semester average
                $semesterAverage = $moduleAverages->avg('final_module_score');

                // 6. Apply Compensation (Rachat) rules if applicable
                $decision = 'retake'; // Assume retake by default
                $wasCompensated = false;
                $compensatedAverage = null;

                if ($semesterAverage >= LmdRules::VALIDATION_THRESHOLD && ! $hasEliminatory) {
                    $decision = 'admitted';
                } elseif ($semesterAverage >= LmdRules::RACHAT_MIN_AVERAGE && $semesterAverage < LmdRules::VALIDATION_THRESHOLD && ! $hasEliminatory) {
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
        $rows = DB::table('grades')
            ->join('assessments', 'grades.assessment_id', '=', 'assessments.id')
            ->join('modules', 'assessments.module_id', '=', 'modules.id')
            ->where('grades.student_id', $studentId)
            ->where('modules.semester_number', $semesterNumber)
            ->select(
                'modules.id as module_id',
                'assessments.id as assessment_id',
                'assessments.type as assessment_type',
                'assessments.weight as weight',
                'grades.value as value'
            )
            ->get();

        return $rows->groupBy('module_id')->map(function (Collection $moduleRows, $moduleId) use ($includeRattrapage) {
            $normale = $moduleRows->reject(fn ($row) => $this->isRattrapageType($row->assessment_type));
            $resitBest = $moduleRows
                ->filter(fn ($row) => $this->isRattrapageType($row->assessment_type))
                ->max('value');

            $score = 0.0;
            foreach ($normale as $row) {
                $value = (float) ($row->value ?? 0);
                if ($includeRattrapage && $resitBest !== null && $this->isExamComponentType($row->assessment_type)) {
                    $value = max($value, (float) $resitBest);
                }
                $score += $value * ((float) $row->weight / 100.0);
            }

            return (object) [
                'module_id' => $moduleId,
                'final_module_score' => $score,
            ];
        })->values();
    }

    private function isRattrapageType(?string $type): bool
    {
        return in_array(strtolower(trim((string) $type)), ['rattrapage', 'r', 'resit', 'rat'], true);
    }

    private function isExamComponentType(?string $type): bool
    {
        return in_array(strtolower(trim((string) $type)), ['exam', 'examen', 'examen_final', 'final', 'epreuve', 'cc2'], true);
    }

    private function grantResitEligibility(int $studentId, Collection $moduleAverages, Deliberation $deliberation): void
    {
        $session = $deliberation->semester?->examSessions()
            ->where(function ($query) {
                $query->whereRaw('LOWER(type) = ?', ['normale']);
            })
            ->first()
            ?? $deliberation->semester?->examSessions()->first();

        $examSessionId = $session?->id;

        if (! $examSessionId) {
            return;
        }

        foreach ($moduleAverages as $module) {
            if ($module->final_module_score < LmdRules::VALIDATION_THRESHOLD) {
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
        foreach ($moduleAverages as $module) {
            if (LmdRules::isEliminatory((float) $module->final_module_score)) {
                return true;
            }
        }

        return false;
    }

    private function calculateMention(float $average): ?string
    {
        if ($average < LmdRules::VALIDATION_THRESHOLD) {
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
