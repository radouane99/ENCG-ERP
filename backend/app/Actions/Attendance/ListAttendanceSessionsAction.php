<?php

namespace App\Actions\Attendance;

use App\Models\AttendanceSession;
use Illuminate\Support\Collection;

class ListAttendanceSessionsAction
{
    public function execute(?string $searchQuery = null): array
    {
        $query = AttendanceSession::with('professor.user')->withCount('records');

        if ($searchQuery) {
            $query->where(fn ($q) =>
                $q->where('module_name', 'like', "%$searchQuery%")
                  ->orWhere('group_name', 'like', "%$searchQuery%")
            );
        }

        $sessions = $query->latest()->get();

        return [
            'data' => $sessions->map(fn ($s) => [
                'id' => $s->id,
                'module_name' => $s->module_name,
                'group_name' => $s->group_name,
                'room_name' => $s->room_name,
                'status' => $s->status,
                'professor_name' => $s->professor && $s->professor->user ? $s->professor->user->first_name . ' ' . $s->professor->user->last_name : '—',
                'records_count' => $s->records_count,
                'created_at' => $s->created_at->format('Y-m-d H:i'),
            ])->toArray(),
            'stats' => [
                'total_sessions' => $sessions->count(),
                'active_sessions' => $sessions->where('status', 'active')->count(),
            ]
        ];
    }
}
