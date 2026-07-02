<?php

namespace App\Services\Academic;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class TimetableService
{
    /**
     * Retrieve schedules based on context (admin, prof, group)
     */
    public function getSchedules(array $filters): Collection
    {
        $query = DB::table('schedules')
            ->join('modules', 'schedules.module_id', '=', 'modules.id')
            ->join('rooms', 'schedules.room_id', '=', 'rooms.id')
            ->join('groups', 'schedules.group_id', '=', 'groups.id')
            ->join('professors', 'schedules.professor_id', '=', 'professors.id')
            ->select(
                'schedules.id',
                'schedules.day_of_week',
                'schedules.start_time',
                'schedules.end_time',
                'modules.name as module_name',
                'modules.color as module_color',
                'rooms.name as room_name',
                'groups.name as group_name',
                'schedules.professor_id',
                'professors.first_name as prof_first_name',
                'professors.last_name as prof_last_name',
                'schedules.type' // e.g., 'CM', 'TD', 'TP'
            )
            ->where('schedules.is_active', true);

        if (!empty($filters['group_id'])) {
            $query->where('schedules.group_id', $filters['group_id']);
        }
        
        if (!empty($filters['professor_id'])) {
            $query->where('schedules.professor_id', $filters['professor_id']);
        }
        
        if (!empty($filters['room_id'])) {
            $query->where('schedules.room_id', $filters['room_id']);
        }

        return $query->get();
    }
}
