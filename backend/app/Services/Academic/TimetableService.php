<?php

namespace App\Services\Academic;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

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
            ->leftJoin('users', 'professors.user_id', '=', 'users.id')
            ->select(
                'schedules.id',
                'schedules.day_of_week',
                'schedules.start_time',
                'schedules.end_time',
                'modules.name as module_name',
                DB::raw('NULL as module_color'),
                'rooms.name as room_name',
                'groups.name as group_name',
                'schedules.professor_id',
                DB::raw("COALESCE(users.first_name, 'Professeur') as prof_first_name"),
                DB::raw("COALESCE(users.last_name, '') as prof_last_name"),
                'schedules.session_type as type',
                'schedules.version'
            )
            ->where('schedules.is_active', true)
            ->where('schedules.academic_year_id', $filters['academic_year_id'] ?? AcademicContext::yearId())
            ->where('schedules.institution_id', auth()->user()?->institution_id ?? config('erp.institution_id', 1));

        if (! empty($filters['group_id'])) {
            $query->where('schedules.group_id', $filters['group_id']);
        }

        if (! empty($filters['professor_id'])) {
            $query->where('schedules.professor_id', $filters['professor_id']);
        }

        if (! empty($filters['room_id'])) {
            $query->where('schedules.room_id', $filters['room_id']);
        }

        return $query->get();
    }
}
