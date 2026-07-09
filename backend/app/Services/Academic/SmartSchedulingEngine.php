<?php

namespace App\Services\Academic;

use App\Models\Module;
use App\Models\Room;
use App\Models\Group;
use App\Models\Semester;
use App\Models\ProfessorAvailability;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Exception;

class SmartSchedulingEngine
{
    /**
     * Standard time blocks for Moroccan universities (2-hour blocks)
     */
    public const TIME_BLOCKS = [
        ['start' => '08:30:00', 'end' => '10:30:00'],
        ['start' => '10:45:00', 'end' => '12:45:00'],
        ['start' => '14:30:00', 'end' => '16:30:00'],
        ['start' => '16:45:00', 'end' => '18:45:00'],
    ];

    /**
     * Days of the week to schedule (1 = Monday, 6 = Saturday)
     */
    public const DAYS = [1, 2, 3, 4, 5, 6];

    /**
     * Generate an entire semester timetable for a filière
     * Uses Heuristic Constraint Satisfaction
     */
    public function generateSemesterTimetable(int $institutionId, int $academicYearId, int $semesterId, int $filiereId): array
    {
        $generatedCount = 0;
        $failedCount = 0;
        $conflicts = [];

        // 1. Fetch Data
        $groups = Group::where('filiere_id', $filiereId)
                       ->where('academic_year_id', $academicYearId)
                       ->get();

        $modules = Module::where('filiere_id', $filiereId)->get();
        $rooms = Room::where('institution_id', $institutionId)->where('is_available', true)->get();

        DB::beginTransaction();

        try {
            // Delete existing DRAFT schedules for this scope
            // We do not delete published schedules (is_active = true) during generation
            DB::table('schedules')
                ->where('academic_year_id', $academicYearId)
                ->where('semester_id', $semesterId)
                ->whereIn('group_id', $groups->pluck('id'))
                ->where('is_active', false)
                ->delete();

            // 2. Schedule generation (Heuristic Backtracking-lite)
            foreach ($groups as $group) {
                foreach ($modules as $module) {
                    $blocksNeeded = 2; // Fixed requirement for demo: 4 hours (2 blocks) per module per group

                    $assignment = DB::table('module_professor')
                        ->where('module_id', $module->id)
                        ->where('academic_year_id', $academicYearId)
                        ->where('group_id', $group->id)
                        ->first();

                    if (!$assignment) continue;

                    $blocksScheduled = 0;

                    foreach (self::DAYS as $day) {
                        foreach (self::TIME_BLOCKS as $block) {
                            if ($blocksScheduled >= $blocksNeeded) break 2;

                            // Room type logic
                            $roomTypeNeeded = ($assignment->session_type === 'tp') ? 'lab' : 'classroom';
                            if ($assignment->session_type === 'cm') $roomTypeNeeded = 'amphitheater';

                            // Find best room (smallest capacity that fits the group to save large rooms)
                            $suitableRoom = $rooms->filter(function ($r) use ($group, $roomTypeNeeded) {
                                return $r->capacity >= $group->capacity && $r->type === $roomTypeNeeded;
                            })->sortBy('capacity')->first();

                            if (!$suitableRoom) {
                                $conflicts[] = "Pas de salle ({$roomTypeNeeded}) assez grande pour le groupe {$group->name}";
                                continue;
                            }

                            // Check Hard Constraints
                            if ($this->isSlotFree($day, $block['start'], $block['end'], $suitableRoom->id, $assignment->professor_id, $group->id, $academicYearId)) {
                                
                                // Check Soft Constraints (Professor Availability)
                                if (!$this->isProfessorAvailable($assignment->professor_id, $day, $block['start'], $block['end'])) {
                                    continue; // Skip this slot if professor prefers not to teach here
                                }

                                // Insert as Draft (is_active = false)
                                DB::table('schedules')->insert([
                                    'id' => \Illuminate\Support\Facades\DB::raw('uuid()'),
                                    'institution_id' => $institutionId,
                                    'academic_year_id' => $academicYearId,
                                    'semester_id' => $semesterId,
                                    'group_id' => $group->id,
                                    'module_id' => $module->id,
                                    'room_id' => $suitableRoom->id,
                                    'professor_id' => $assignment->professor_id,
                                    'professor_type' => $assignment->professor_type,
                                    'day_of_week' => $day,
                                    'start_time' => $block['start'],
                                    'end_time' => $block['end'],
                                    'session_type' => $assignment->session_type,
                                    'is_active' => false, // DRAFT MODE
                                    'created_at' => now(),
                                    'updated_at' => now()
                                ]);

                                $generatedCount++;
                                $blocksScheduled++;
                            }
                        }
                    }

                    if ($blocksScheduled < $blocksNeeded) {
                        $failedCount++;
                        $conflicts[] = "Impossible de placer le module {$module->name} pour le groupe {$group->name} (Manque de créneaux)";
                    }
                }
            }

            DB::commit();

            return [
                'success' => true,
                'planned' => $generatedCount,
                'failed' => $failedCount,
                'message' => 'Emplois du temps générés en mode brouillon (Draft).',
                'conflicts' => array_unique($conflicts)
            ];

        } catch (Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'planned' => 0,
                'failed' => 0,
                'message' => 'Erreur lors de la génération: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Checks if a slot is completely free (Hard Constraints).
     */
    public function isSlotFree(int $day, string $start, string $end, int $roomId, int $professorId, int $groupId, int $academicYearId, ?string $excludeScheduleId = null): bool
    {
        $query = DB::table('schedules')
            ->where('academic_year_id', $academicYearId)
            ->where('day_of_week', $day)
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_time', [$start, $end])
                  ->orWhereBetween('end_time', [$start, $end])
                  ->orWhere(function ($subQ) use ($start, $end) {
                      $subQ->where('start_time', '<=', $start)
                           ->where('end_time', '>=', $end);
                  });
            })
            ->where(function ($q) use ($roomId, $professorId, $groupId) {
                $q->where('room_id', $roomId)
                  ->orWhere('professor_id', $professorId)
                  ->orWhere('group_id', $groupId);
            });

        if ($excludeScheduleId) {
            $query->where('id', '!=', $excludeScheduleId);
        }

        return $query->count() === 0;
    }

    /**
     * Soft constraint: Check if professor is available.
     * If no availability records exist, assume available.
     */
    public function isProfessorAvailable(int $professorId, int $day, string $start, string $end): bool
    {
        $records = ProfessorAvailability::where('professor_id', $professorId)
                                        ->where('day_of_week', $day)
                                        ->get();

        if ($records->isEmpty()) {
            return true; // No constraints defined
        }

        foreach ($records as $record) {
            if (!$record->is_available) {
                if ($start < $record->end_time && $end > $record->start_time) {
                    return false;
                }
            } else {
                if ($start >= $record->start_time && $end <= $record->end_time) {
                    return true;
                }
            }
        }

        return false; 
    }
}
