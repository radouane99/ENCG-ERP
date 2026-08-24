<?php

namespace App\Services\Academic;

use App\Domain\AI\Services\GroundedAiService;
use App\Models\AcademicYear;
use App\Models\Room;
use Illuminate\Support\Facades\Schema;

class SlotSuggestionService
{
    public function __construct(
        private ScheduleExceptionService $exceptions,
        private GroundedAiService $groundedAi
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function suggest(array $input = []): array
    {
        $yearId = (int) ($input['academic_year_id'] ?? AcademicYear::query()->where('is_current', true)->value('id') ?? AcademicYear::query()->value('id') ?? 1);
        $groupId = (int) ($input['group_id'] ?? 1);
        $profId = (int) ($input['professor_id'] ?? 1);
        $date = (string) ($input['date'] ?? now()->toDateString());

        $rooms = Schema::hasTable('rooms')
            ? Room::query()->where(function ($q) {
                $q->where('is_out_of_service', false)->orWhereNull('is_out_of_service');
            })->take(8)->get()
            : collect();

        if ($rooms->isEmpty()) {
            return [];
        }

        $candidates = [
            [1, '08:30:00', '10:30:00'],
            [1, '10:30:00', '12:30:00'],
            [2, '08:30:00', '10:30:00'],
            [2, '14:00:00', '16:00:00'],
            [3, '08:30:00', '10:30:00'],
            [3, '14:00:00', '16:00:00'],
            [4, '08:30:00', '10:30:00'],
            [5, '08:30:00', '10:30:00'],
        ];

        $valid = [];
        foreach ($candidates as [$day, $start, $end]) {
            foreach ($rooms as $room) {
                $check = $this->exceptions->validateSlot($yearId, $day, $start, $end, (int) $room->id, $profId, $groupId, $date);
                if (! ($check['isValid'] ?? false)) {
                    continue;
                }
                $copy = $this->groundedAi->explain([
                    'reason' => $check['reason'] ?: 'Créneau libre, hors férié et hors contrainte Ramadan.',
                    'day' => $day,
                    'start' => $start,
                    'end' => $end,
                    'room' => $room->name ?? $room->code,
                ], 'slot_reason');
                $valid[] = [
                    'day' => $day,
                    'start_time' => $start,
                    'end_time' => $end,
                    'room_id' => $room->id,
                    'room_name' => $room->name ?? $room->code,
                    'reason_fr' => $copy['text_fr'],
                    'reason_ar' => $copy['text_ar'],
                    'text_fr' => $copy['text_fr'],
                    'text_ar' => $copy['text_ar'],
                ];
                break;
            }
            if (count($valid) >= 3) {
                break;
            }
        }

        return array_slice($valid, 0, 3);
    }
}
