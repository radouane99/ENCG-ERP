<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AttendanceSession::with('professor')->withCount('records');

        if ($request->search) {
            $s = $request->search;
            $query->where(fn ($q) =>
                $q->where('module_name', 'like', "%$s%")
                  ->orWhere('group_name', 'like', "%$s%")
            );
        }

        $sessions = $query->latest()->get()->map(fn ($s) => [
            'id' => $s->id,
            'module_name' => $s->module_name,
            'group_name' => $s->group_name,
            'room_name' => $s->room_name,
            'status' => $s->status,
            'professor_name' => $s->professor ? $s->professor->first_name . ' ' . $s->professor->last_name : '—',
            'records_count' => $s->records_count,
            'created_at' => $s->created_at->format('Y-m-d H:i'),
        ]);

        return response()->json([
            'data' => $sessions,
            'stats' => [
                'total_sessions' => $sessions->count(),
                'active_sessions' => $sessions->where('status', 'active')->count(),
            ]
        ]);
    }

    public function destroy(AttendanceSession $attendanceSession): JsonResponse
    {
        $attendanceSession->delete();
        return response()->json(['message' => 'Session d\'absence supprimée.']);
    }
}
