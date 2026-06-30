<?php

namespace App\Services\Academic;

use App\Models\Module;
use App\Models\Room;
use App\Models\Group;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Exception;

class SmartSchedulingEngine
{
    /**
     * Standard time blocks for Moroccan universities (2-hour blocks)
     */
    protected const TIME_BLOCKS = [
        ['start' => '08:30:00', 'end' => '10:30:00'],
        ['start' => '10:45:00', 'end' => '12:45:00'],
        ['start' => '14:30:00', 'end' => '16:30:00'],
        ['start' => '16:45:00', 'end' => '18:45:00'],
    ];

    /**
     * Days of the week to schedule (1 = Monday, 6 = Saturday)
     */
    protected const DAYS = [1, 2, 3, 4, 5, 6];

    /**
     * Generate an entire semester timetable
     * Uses a greedy constraint solver approach
     */
    public function generateSemesterTimetable(int $institutionId, int $academicYearId, int $semesterId, int $filiereId): array
    {
        $generatedSessions = [];
        $conflicts = [];

        // 1. Fetch data
        $groups = Group::where('filiere_id', $filiereId)
                       ->where('academic_year_id', $academicYearId)
                       ->get();

        $modules = Module::where('filiere_id', $filiereId)->get();
        $rooms = Room::where('institution_id', $institutionId)->where('is_available', true)->get();

        DB::beginTransaction();

        try {
            // Delete existing active schedule for this scope to regenerate
            DB::table('schedules')
                ->where('academic_year_id', $academicYearId)
                ->where('semester_id', $semesterId)
                ->whereIn('group_id', $groups->pluck('id'))
                ->delete();

            // 2. Loop through Groups -> Modules -> Find Available Slot
            foreach ($groups as $group) {
                foreach ($modules as $module) {
                    
                    // Determine how many 2-hour blocks are needed (e.g. 48h / 14 weeks = ~3.4h/week -> 2 blocks)
                    // For demo purposes, we will try to place 2 blocks per module per group
                    $blocksNeeded = 2; 

                    // Fetch assigned professor for this module and group
                    $assignment = DB::table('module_professor')
                        ->where('module_id', $module->id)
                        ->where('academic_year_id', $academicYearId)
                        ->where('group_id', $group->id)
                        ->first();

                    if (!$assignment) continue;

                    $blocksScheduled = 0;

                    // Greedy search for a slot
                    foreach (self::DAYS as $day) {
                        foreach (self::TIME_BLOCKS as $block) {
                            if ($blocksScheduled >= $blocksNeeded) break 2;

                            // Find a room that matches capacity and type
                            $roomTypeNeeded = ($assignment->session_type === 'tp') ? 'lab' : 'classroom';
                            if ($assignment->session_type === 'cm') $roomTypeNeeded = 'amphitheater';

                            $suitableRoom = $rooms->filter(function ($r) use ($group, $roomTypeNeeded) {
                                return $r->capacity >= $group->capacity && $r->type === $roomTypeNeeded;
                            })->first();

                            if (!$suitableRoom) {
                                $conflicts[] = "Pas de salle de type $roomTypeNeeded assez grande pour le groupe {$group->name}";
                                continue;
                            }

                            // Check constraints
                            if ($this->isSlotFree($day, $block['start'], $block['end'], $suitableRoom->id, $assignment->professor_id, $group->id, $academicYearId)) {
                                
                                // Schedule it
                                $scheduleId = DB::table('schedules')->insertGetId([
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
                                    'is_active' => true,
                                    'created_at' => now(),
                                    'updated_at' => now()
                                ]);

                                $generatedSessions[] = $scheduleId;
                                $blocksScheduled++;
                            }
                        }
                    }

                    if ($blocksScheduled < $blocksNeeded) {
                        $conflicts[] = "Impossible de placer le module {$module->name} pour le groupe {$group->name} (Manque de créneaux)";
                    }
                }
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Emploi du temps généré avec succès',
                'sessions_generated' => count($generatedSessions),
                'conflicts' => array_unique($conflicts)
            ];

        } catch (Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Erreur lors de la génération: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check if a specific time slot is free regarding all Hard Constraints.
     */
    public function isSlotFree(int $day, string $start, string $end, int $roomId, int $profId, int $groupId, int $academicYearId, ?int $excludeScheduleId = null): bool
    {
        $query = DB::table('schedules')
            ->where('academic_year_id', $academicYearId)
            ->where('day_of_week', $day)
            ->where('is_active', true)
            ->where(function($q) use ($start, $end) {
                // Time overlap check
                $q->where(function($sub) use ($start, $end) {
                    $sub->where('start_time', '<', $end)
                        ->where('end_time', '>', $start);
                });
            });

        if ($excludeScheduleId) {
            $query->where('id', '!=', $excludeScheduleId);
        }

        // Check Room Conflict
        $roomConflict = (clone $query)->where('room_id', $roomId)->exists();
        if ($roomConflict) return false;

        // Check Group Conflict
        $groupConflict = (clone $query)->where('group_id', $groupId)->exists();
        if ($groupConflict) return false;

        // Check Professor Conflict
        $profConflict = (clone $query)->where('professor_id', $profId)->exists();
        if ($profConflict) return false;

        // Check Professor Availability Preference
        $isProfAvailable = DB::table('professor_availability')
            ->where('professor_id', $profId)
            ->where('academic_year_id', $academicYearId)
            ->where('day_of_week', $day)
            ->where('is_available', false)
            ->where('start_time', '<=', $start)
            ->where('end_time', '>=', $end)
            ->exists();

        // If an explicit unavailability record covers this slot, they are NOT free
        if ($isProfAvailable) return false;

        return true;
    }
}
