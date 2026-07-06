<?php

namespace App\Http\Controllers\Api\Professor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\StartAttendanceSessionRequest;
use App\Http\Requests\Academic\ManualCallRequest;
use App\Services\Academic\AttendanceService;
use App\Models\AttendanceSession;
use Illuminate\Http\JsonResponse;

class ProfessorAttendanceController extends Controller
{
    public function __construct(private AttendanceService $attendanceService)
    {
    }

    public function startSession(StartAttendanceSessionRequest $request): JsonResponse
    {
        $session = $this->attendanceService->startSession(
            $request->validated('module_id'),
            $request->validated('group_id'),
            $request->user()->id,
            $request->validated('room_name')
        );

        return response()->json([
            'message' => 'Attendance session started successfully',
            'session' => $session
        ], 201);
    }

    public function manualCall(AttendanceSession $session, ManualCallRequest $request): JsonResponse
    {
        $record = $this->attendanceService->markPresence(
            $session->id,
            $request->validated('student_id'),
            $request->validated('status')
        );

        return response()->json([
            'message' => 'Attendance marked',
            'record' => $record
        ]);
    }

    public function closeSession(AttendanceSession $session): JsonResponse
    {
        $closedSession = $this->attendanceService->closeSession($session->id);

        return response()->json([
            'message' => 'Attendance session closed',
            'session' => $closedSession
        ]);
    }
}
