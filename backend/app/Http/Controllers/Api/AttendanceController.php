<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AttendanceController extends Controller
{
    public function index(Request $request, \App\Actions\Attendance\ListAttendanceSessionsAction $action): JsonResponse
    {
        $result = $action->execute($request->search);

        return response()->json($result);
    }

    public function store(\App\Http\Requests\StartAttendanceSessionRequest $request): JsonResponse
    {
        // This is a placeholder since the plan says store method is added and StartAttendanceSessionRequest already exists
        return response()->json(['message' => 'Not implemented yet'], 501);
    }

    public function destroy(AttendanceSession $attendanceSession): JsonResponse
    {
        $attendanceSession->delete();
        
        activity()
            ->causedBy(auth()->user())
            ->performedOn($attendanceSession)
            ->log('Attendance session deleted');

        return response()->json(['message' => 'Session d\'absence supprimée.']);
    }
}
