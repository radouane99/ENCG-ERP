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
    public function scanQrCode(AttendanceSession $session, \Illuminate\Http\Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string'
        ]);

        // In a real scenario, the token would be decrypted/verified.
        // For ENCG ERP V1, the token contains the student_id prefixed with "STU-"
        $tokenParts = explode('-', $validated['token']);
        $studentId = count($tokenParts) > 1 ? (int)$tokenParts[1] : (int)$validated['token'];

        // Check if student exists
        $student = \App\Models\Student::with('user')->find($studentId);
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Étudiant introuvable.'], 404);
        }

        // Mark presence
        $record = $this->attendanceService->markPresence(
            $session->id,
            $studentId,
            'present'
        );

        // Check total absences for ENCG limits
        $totalAbsences = \App\Models\AttendanceRecord::where('student_id', $studentId)
            ->where('status', 'absent')
            ->count();

        $warning = null;
        if ($totalAbsences >= 3) {
            $warning = "Attention: L'étudiant a atteint $totalAbsences absences.";
        }

        return response()->json([
            'success' => true,
            'message' => 'Présence validée.',
            'student_name' => $student->user->name ?? 'Étudiant',
            'warning' => $warning,
            'record' => $record
        ]);
    }
}
