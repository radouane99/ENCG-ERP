<?php

namespace App\Services\Academic;

use App\Models\Room;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ConflictResolutionService
{
    protected SmartSchedulingEngine $engine;

    public function __construct(SmartSchedulingEngine $engine)
    {
        $this->engine = $engine;
    }

    /**
     * Used when Admin Drags & Drops a schedule block.
     * Returns true if valid, or a conflict message and alternative suggestions.
     */
    public function validateAndSuggestMove(string $scheduleId, int $newDay, string $newStart, string $newEnd, int $newRoomId): array
    {
        $schedule = DB::table('schedules')->where('id', $scheduleId)->first();
        if (!$schedule) return ['success' => false, 'message' => 'Schedule not found'];

        // Check if the slot is free
        $isFree = $this->engine->isSlotFree(
            $newDay, 
            $newStart, 
            $newEnd, 
            $newRoomId, 
            $schedule->professor_id, 
            $schedule->group_id, 
            $schedule->academic_year_id,
            $scheduleId // Exclude itself
        );

        if ($isFree) {
            return ['success' => true, 'message' => 'Mouvement valide.'];
        }

        // If not free, find WHY and suggest alternatives
        $alternatives = $this->findAlternatives($schedule, $newDay, $newStart, $newEnd);

        return [
            'success' => false,
            'message' => 'Conflit détecté (Salle, Professeur ou Groupe non disponible).',
            'suggestions' => $alternatives
        ];
    }

    /**
     * Find alternative rooms for the same time slot, or alternative time slots.
     */
    private function findAlternatives($schedule, int $desiredDay, string $desiredStart, string $desiredEnd): array
    {
        $suggestions = [];
        $rooms = Room::where('institution_id', $schedule->institution_id)
                     ->where('is_available', true)
                     ->get();

        // 1. Suggest same time, different room
        foreach ($rooms as $room) {
            if ($room->id === $schedule->room_id) continue;
            
            // Check capacity
            $groupCapacity = DB::table('groups')->where('id', $schedule->group_id)->value('capacity') ?? 0;
            if ($room->capacity < $groupCapacity) continue;

            if ($this->engine->isSlotFree($desiredDay, $desiredStart, $desiredEnd, $room->id, $schedule->professor_id, $schedule->group_id, $schedule->academic_year_id, $schedule->id)) {
                $suggestions[] = [
                    'day' => $desiredDay,
                    'start_time' => $desiredStart,
                    'end_time' => $desiredEnd,
                    'room_id' => $room->id,
                    'room_name' => $room->name,
                    'type' => 'same_time_different_room'
                ];
                if (count($suggestions) >= 2) break;
            }
        }

        return $suggestions;
    }
}
