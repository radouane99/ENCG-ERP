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
        
        // Eager load group mappings to prevent N+1
        $oldGroups = Group::where('academic_year_id', $oldYear->id)->get()->keyBy('id');
        $newGroups = Group::where('academic_year_id', $newYear->id)->get()->groupBy('filiere_id');
        
        $newAssignments = [];
        $now = now();

        foreach ($assignments as $assignment) {
            $oldGroup = $oldGroups->get($assignment->group_id);
            if (!$oldGroup) {
                continue;
            }

            // Find equivalent group in new year
            $newGroup = $newGroups->get($oldGroup->filiere_id)?->firstWhere('name', $oldGroup->name);

            if ($newGroup) {
                $newAssignments[] = [
                    'module_id' => $assignment->module_id,
                    'professor_id' => $assignment->professor_id,
                    'professor_type' => $assignment->professor_type,
                    'academic_year_id' => $newYear->id,
                    'group_id' => $newGroup->id,
                    'session_type' => $assignment->session_type,
                    'created_at' => $now,
                    'updated_at' => $now
                ];
            }
        }
        
        // Bulk insert to prevent N+1
        foreach (array_chunk($newAssignments, 500) as $chunk) {
            DB::table('module_professor')->insert($chunk);
        }
    }

    protected function rolloverStudents(AcademicYear $oldYear, AcademicYear $newYear): array
    {
        $pathways = StudentPathway::where('academic_year_id', $oldYear->id)
                                  ->where('is_current', true)
                                  ->get();

        if ($pathways->isEmpty()) {
            return ['total_processed' => 0, 'passed' => 0, 'repeated' => 0];
        }

        // 1. Bulk mark old pathways as no longer current
        StudentPathway::where('academic_year_id', $oldYear->id)
                      ->where('is_current', true)
                      ->update(['is_current' => false]);

        // 2. Fetch Grades & Calculate Decision via Apogee Engine without N+1
        $studentIds = $pathways->pluck('student_id')->toArray();
        
        $failedCounts = DB::table('grades')
            ->where('academic_year_id', $oldYear->id)
            ->whereIn('student_id', $studentIds)
            ->where('value', '<', 10)
            ->select('student_id', DB::raw('count(*) as failed_count'))
            ->groupBy('student_id')
            ->pluck('failed_count', 'student_id');

        $newGroups = Group::where('academic_year_id', $newYear->id)->get();
        $newPathways = [];
        $groupIncrements = [];
        
        $passed = 0;
        $repeated = 0;
        $now = now();

        foreach ($pathways as $pathway) {
            $failedCount = $failedCounts->get($pathway->student_id, 0);
            $decision = $this->deliberationEngine->evaluateProgression($failedCount);
            $newSemesterNumber = $pathway->current_semester;

            if ($decision === 'PASS' || $decision === 'PASS_WITH_RESERVED_MODULES') {
                $newSemesterNumber += 2; // Pass to next year (2 semesters)
                $passed++;
            } else {
                $repeated++;
            }

            // Find new group for the student
            $newGroup = $newGroups->where('filiere_id', $pathway->filiere_id)
                                  ->where('semester_number', $newSemesterNumber)
                                  ->first();

            // 3. Create New Pathway payload
            $newPathways[] = [
                'student_id' => $pathway->student_id,
                'filiere_id' => $pathway->filiere_id,
                'speciality_id' => $pathway->speciality_id,
                'academic_year_id' => $newYear->id,
                'group_id' => $newGroup ? $newGroup->id : null,
                'current_semester' => $newSemesterNumber,
                'is_current' => true,
                'created_at' => $now,
                'updated_at' => $now
            ];

            if ($newGroup) {
                $groupIncrements[$newGroup->id] = ($groupIncrements[$newGroup->id] ?? 0) + 1;
            }
        }

        // Bulk insert pathways
        foreach (array_chunk($newPathways, 500) as $chunk) {
            StudentPathway::insert($chunk);
        }

        // Bulk increment group counts
        foreach ($groupIncrements as $groupId => $count) {
            Group::where('id', $groupId)->increment('current_count', $count);
        }

        return [
            'total_processed' => $pathways->count(),
            'passed' => $passed,
            'repeated' => $repeated
        ];
    }
}
