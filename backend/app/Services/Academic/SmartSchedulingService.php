<?php

namespace App\Services\Academic;

use App\Models\Module;
use App\Models\Room;
use App\Models\Group;
use App\Models\Semester;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Exception;

class SmartSchedulingService
{
    protected ScheduleConflictService $conflictService;

    public function __construct(ScheduleConflictService $conflictService)
    {
        $this->conflictService = $conflictService;
    }

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
     * Generate an entire semester timetable for a filière
     */
    public function generate(int $semesterId, int $filiereId): array
    {
        // Get academic year from semester
        $semester = Semester::findOrFail($semesterId);
        $academicYearId = $semester->academic_year_id;
        $institutionId = $semester->academicYear->institution_id ?? 1; // fallback

        $generatedCount = 0;
        $failedCount = 0;
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
                    
                    $blocksNeeded = 2; // For demo purposes, we will try to place 2 blocks per module per group

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
                                $conflicts[] = "Pas de salle ({$roomTypeNeeded}) assez grande pour le groupe {$group->name}";
                                continue;
                            }

                            // Use the Conflict Service to validate the slot
                            $validation = $this->conflictService->validateSlot(
                                $academicYearId,
                                $day,
                                $block['start'],
                                $block['end'],
                                $suitableRoom->id,
                                $assignment->professor_id,
                                $group->id
                            );

                            if ($validation['isValid']) {
                                // Schedule it
                                DB::table('schedules')->insert([
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

                                $generatedCount++;
                                $blocksScheduled++;
                            } else {
                                // Conflict detected, try the next slot (done by loop)
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
                'planifiés' => $generatedCount,
                'échoués' => $failedCount,
                'message' => 'Génération automatique terminée',
                'conflicts' => array_unique($conflicts)
            ];

        } catch (Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'planifiés' => 0,
                'échoués' => 0,
                'message' => 'Erreur lors de la génération: ' . $e->getMessage()
            ];
        }
    }
}
