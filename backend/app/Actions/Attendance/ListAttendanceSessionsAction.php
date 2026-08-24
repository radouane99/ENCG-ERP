<?php

namespace App\Actions\Attendance;

use App\Http\Resources\AttendanceSessionResource;
use App\Models\AttendanceSession;

class ListAttendanceSessionsAction
{
    public function execute(?string $searchQuery = null): array
    {
        $query = AttendanceSession::with('professor.user')->withCount('records');

        if ($searchQuery) {
            $query->where(fn ($q) => $q->where('module_name', 'like', "%$searchQuery%")
                ->orWhere('group_name', 'like', "%$searchQuery%")
            );
        }

        $sessions = $query->latest()->get();

        return [
            'data' => AttendanceSessionResource::collection($sessions),
            'stats' => [
                'total_sessions' => $sessions->count(),
                'active_sessions' => $sessions->where('status', 'active')->count(),
            ],
        ];
    }
}
