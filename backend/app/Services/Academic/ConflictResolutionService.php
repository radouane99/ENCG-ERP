<?php

namespace App\Services\Academic;

use App\Models\Group;
use App\Models\Room;
use App\Models\Schedule;

class ConflictResolutionService
{
    public function __construct(
        private SmartSchedulingEngine $engine
    ) {}

    /**
     * Valider un déplacement Drag & Drop et suggérer des alternatives.
     */
    public function validateAndSuggestMove(int $scheduleId, int $newDay, string $newStart, string $newEnd, int $newRoomId): array
    {
        $schedule = Schedule::find($scheduleId);
        if (!$schedule) {
            return ['success' => false, 'message' => 'Créneau introuvable.'];
        }

        if ($this->engine->isSlotFree($newDay, $newStart, $newEnd, $newRoomId, $schedule->professor_id, $schedule->group_id, $schedule->academic_year_id, $scheduleId)) {
            return ['success' => true, 'message' => 'Mouvement valide.'];
        }

        return [
            'success'     => false,
            'message'     => 'Conflit détecté (salle, professeur ou groupe non disponible).',
            'suggestions' => $this->findAlternatives($schedule, $newDay, $newStart, $newEnd),
        ];
    }

    /**
     * Trouver des salles alternatives au même créneau.
     */
    private function findAlternatives(Schedule $schedule, int $desiredDay, string $desiredStart, string $desiredEnd): array
    {
        $suggestions   = [];
        $groupCapacity = Group::where('id', $schedule->group_id)->value('capacity') ?? 0;

        $rooms = Room::where('institution_id', $schedule->institution_id)
            ->where('is_available', true)
            ->where('capacity', '>=', $groupCapacity)
            ->where('id', '!=', $schedule->room_id)
            ->get();

        foreach ($rooms as $room) {
            if ($this->engine->isSlotFree($desiredDay, $desiredStart, $desiredEnd, $room->id, $schedule->professor_id, $schedule->group_id, $schedule->academic_year_id, $schedule->id)) {
                $suggestions[] = [
                    'day'        => $desiredDay,
                    'start_time' => $desiredStart,
                    'end_time'   => $desiredEnd,
                    'room_id'    => $room->id,
                    'room_name'  => $room->name,
                    'type'       => 'same_time_different_room',
                ];
                if (count($suggestions) >= 2) break;
            }
        }

        return $suggestions;
    }
}