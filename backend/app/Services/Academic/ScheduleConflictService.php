<?php

namespace App\Services\Academic;

use Illuminate\Support\Facades\DB;

class ScheduleConflictService
{
    /**
     * Checks if a specific time slot is free regarding all Hard Constraints.
     * 
     * @return array [ 'isValid' => bool, 'reason' => string|null ]
     */
    public function validateSlot(int $academicYearId, int $day, string $start, string $end, int $roomId, int $profId, int $groupId): array
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

        // Check Room Conflict
        if ((clone $query)->where('room_id', $roomId)->exists()) {
            return ['isValid' => false, 'reason' => 'Room is already occupied during this time slot.'];
        }

        // Check Group Conflict
        if ((clone $query)->where('group_id', $groupId)->exists()) {
            return ['isValid' => false, 'reason' => 'Group already has a class scheduled during this time slot.'];
        }

        // Check Professor Conflict
        if ((clone $query)->where('professor_id', $profId)->exists()) {
            return ['isValid' => false, 'reason' => 'Professor is already teaching another class during this time slot.'];
        }

        // Check Professor Availability Preference
        $isProfUnavailable = DB::table('professor_availabilities')
            ->where('professor_id', $profId)
            ->where('academic_year_id', $academicYearId)
            ->where('day_of_week', $day)
            ->where('is_available', false)
            ->where('start_time', '<=', $start)
            ->where('end_time', '>=', $end)
            ->exists();

        if ($isProfUnavailable) {
            return ['isValid' => false, 'reason' => 'Professor declared this time slot as unavailable.'];
        }

        return ['isValid' => true, 'reason' => null];
    }
}
