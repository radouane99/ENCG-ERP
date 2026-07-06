<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\Group;
use App\Models\StudentPathway;
use App\Models\Student;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class AcademicYearRolloverService
{
    protected ApogeeDeliberationEngine $deliberationEngine;

    public function __construct(ApogeeDeliberationEngine $deliberationEngine)
    {
        $this->deliberationEngine = $deliberationEngine;
    }

    /**
     * Executes the full rollover process.
     */
    public function executeRollover(int $currentYearId, string $newLabel, string $startDate, string $endDate): array
    {
        DB::beginTransaction();

        try {
            $currentYear = AcademicYear::findOrFail($currentYearId);
            
            // 1. Close current year
            $currentYear->update([
                'is_current' => false,
                'is_locked' => true
            ]);

            // 2. Create New Year
            $newYear = AcademicYear::create([
                'institution_id' => $currentYear->institution_id,
                'label' => $newLabel,
                'start_year' => (int) substr($newLabel, 0, 4),
                'end_year' => (int) substr($newLabel, 5, 4),
                'start_date' => $startDate,
                'end_date' => $endDate,
                'is_current' => true,
                'is_locked' => false,
            ]);

            // 3. Clone Semesters & Groups
            $this->cloneStructure($currentYear, $newYear);

            // 4. Rollover Students based on Apogee Rules
            $stats = $this->rolloverStudents($currentYear, $newYear);

            DB::commit();

            return [
                'success' => true,
                'message' => "Rollover complété avec succès. Bienvenue en {$newLabel}.",
                'stats' => $stats
            ];

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Rollover Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Erreur lors du rollover : ' . $e->getMessage()
            ];
        }
    }

    protected function cloneStructure(AcademicYear $oldYear, AcademicYear $newYear)
    {
        // Clone Semesters
        $semesters = Semester::where('academic_year_id', $oldYear->id)->get();
        foreach ($semesters as $semester) {
            Semester::create([
                'academic_year_id' => $newYear->id,
                'name' => $semester->name,
                'number' => $semester->number,
                'start_date' => $newYear->start_date, // Approx, should be adjusted manually later
                'end_date' => clone $newYear->start_date->addMonths(5), // Approx
            ]);
        }

        // Clone Groups
        $groups = Group::where('academic_year_id', $oldYear->id)->get();
        foreach ($groups as $group) {
            Group::create([
                'filiere_id' => $group->filiere_id,
                'academic_year_id' => $newYear->id,
                'speciality_id' => $group->speciality_id,
                'name' => $group->name,
                'semester_number' => $group->semester_number,
                'capacity' => $group->capacity,
                'current_count' => 0, // Reset
            ]);
        }

        // Clone Module-Professor Assignments
        $assignments = DB::table('module_professor')->where('academic_year_id', $oldYear->id)->get();
        foreach ($assignments as $assignment) {
            // Find equivalent group in new year
            $oldGroup = Group::find($assignment->group_id);
            $newGroup = Group::where('academic_year_id', $newYear->id)
                             ->where('name', $oldGroup->name)
                             ->where('filiere_id', $oldGroup->filiere_id)
                             ->first();

            if ($newGroup) {
                DB::table('module_professor')->insert([
                    'module_id' => $assignment->module_id,
                    'professor_id' => $assignment->professor_id,
                    'professor_type' => $assignment->professor_type,
                    'academic_year_id' => $newYear->id,
                    'group_id' => $newGroup->id,
                    'session_type' => $assignment->session_type,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }
    }

    protected function rolloverStudents(AcademicYear $oldYear, AcademicYear $newYear): array
    {
        $pathways = StudentPathway::where('academic_year_id', $oldYear->id)
                                  ->where('is_current', true)
                                  ->get();

        $passed = 0;
        $repeated = 0;

        foreach ($pathways as $pathway) {
            // 1. Mark old pathway as no longer current
            $pathway->update(['is_current' => false]);

            // 2. Fetch Grades & Calculate Decision via Apogee Engine
            // Simplification: We assume a method in DeliberationEngine or we query DB directly
            // For now, we simulate finding the 'failed' modules count
            $failedCount = DB::table('grades')
                ->where('student_id', $pathway->student_id)
                ->where('academic_year_id', $oldYear->id)
                ->where('value', '<', 10)
                ->count();

            $decision = $this->deliberationEngine->evaluateProgression($failedCount);

            $newSemesterNumber = $pathway->current_semester;

            if ($decision === 'PASS' || $decision === 'PASS_WITH_RESERVED_MODULES') {
                $newSemesterNumber += 2; // Pass to next year (2 semesters)
                $passed++;
            } else {
                $repeated++;
            }

            // Find new group for the student
            // Typically if they passed, they go to Semester N+2
            $newGroup = Group::where('academic_year_id', $newYear->id)
                             ->where('filiere_id', $pathway->filiere_id)
                             ->where('semester_number', $newSemesterNumber)
                             ->first();

            // 3. Create New Pathway
            StudentPathway::create([
                'student_id' => $pathway->student_id,
                'filiere_id' => $pathway->filiere_id,
                'speciality_id' => $pathway->speciality_id,
                'academic_year_id' => $newYear->id,
                'group_id' => $newGroup ? $newGroup->id : null,
                'current_semester' => $newSemesterNumber,
                'is_current' => true,
            ]);

            if ($newGroup) {
                $newGroup->increment('current_count');
            }
        }

        return [
            'total_processed' => count($pathways),
            'passed' => $passed,
            'repeated' => $repeated
        ];
    }
}
