<?php

namespace App\Domain\Deliberation\Services;

use App\Models\Deliberation;
use App\Models\DeliberationDecision;
use App\Models\Student;
use App\Models\Grade;
use App\Models\GradeComponent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

/**
 * Enterprise Service for processing academic deliberations (Apogée style).
 * Handles average calculations, elimination rules, and rachat (compensation).
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

            // Get the semester number from the relationship to pass to our calculation method
            $semesterNumber = $deliberation->semester->number;

            foreach ($students as $student) {
                // 2. Calculate raw averages per module (Passing semesterNumber instead of ID)
                $moduleAverages = $this->calculateModuleAverages($student->id, $semesterNumber);

                // 3. Check for eliminatory marks (< 7/20 or < 8/20 depending on rules)
                $hasEliminatory = $this->checkEliminatoryMarks($moduleAverages, $deliberation);

                // 4. Calculate semester average
                $semesterAverage = $moduleAverages->avg('final_module_score');

                // 5. Apply Compensation (Rachat) rules if applicable
                $decision = 'retake';
                $wasCompensated = false;
                $compensatedAverage = null;

                if ($semesterAverage >= 10 && !$hasEliminatory) {
                    $decision = 'admitted';
                } elseif ($semesterAverage >= 9.5 && $semesterAverage < 10 && !$hasEliminatory) {
                    // System Rachat (Jury Compensation)
                    $decision = 'admitted';
                    $wasCompensated = true;
                    $compensatedAverage = 10.00;
                }

                // 6. Record Decision
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

    // غيرنا المتغير الثاني باش يكون هو الرقم ديال الدورة (semesterNumber)
    private function calculateModuleAverages(int $studentId, int $semesterNumber): Collection
    {
        // Complex query to sum up (grade * weight) / sum(weight) per module
        return DB::table('grades')
            ->join('grade_components', 'grades.grade_component_id', '=', 'grade_components.id')
            ->join('modules', 'grade_components.module_id', '=', 'modules.id')
            ->where('grades.student_id', $studentId)
            ->where('modules.semester_number', $semesterNumber) // هنا صلحنا الفلتر باش يخدم مع الـ Database ديالك
            ->select(
                'modules.id as module_id',
                DB::raw('SUM(grades.score * (grade_components.weight / 100)) as final_module_score')
            )
            ->groupBy('modules.id')
            ->get();
    }

    private function checkEliminatoryMarks(Collection $moduleAverages, Deliberation $deliberation): bool
    {
        // Moroccan university standard: < 7/20 or < 5/20 is often eliminatory
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
        if ($average < 10) return null;
        if ($average < 12) return 'Passable';
        if ($average < 14) return 'Assez Bien';
        if ($average < 16) return 'Bien';
        return 'Très Bien';
    }
}