<?php

namespace App\Http\Controllers\Api\Professor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\ManualCallRequest;
use App\Http\Requests\Academic\StartAttendanceSessionRequest;
use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\Student;
use App\Services\Academic\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfessorAttendanceController extends Controller
{
    public function __construct(
        private AttendanceService $attendanceService
    ) {}

    /**
     * Démarrer une session de présence.
     */
    public function startSession(StartAttendanceSessionRequest $request): JsonResponse
    {
        $session = $this->attendanceService->startSession(
            $request->validated('module_id'),
            $request->validated('group_id'),
            $request->user()->id,
            $request->validated('room_name')
        );

        return response()->json([
            'success' => true,
            'message' => 'Session de présence démarrée.',
            'session' => $session,
        ], 201);
    }

    /**
     * Appel manuel d'un étudiant.
     */
    public function manualCall(AttendanceSession $session, ManualCallRequest $request): JsonResponse
    {
        $record = $this->attendanceService->markPresence(
            $session->id,
            $request->validated('student_id'),
            $request->validated('status')
        );

        return response()->json([
            'success' => true,
            'message' => 'Présence marquée.',
            'record'  => $record,
        ]);
    }

    /**
     * Fermer une session de présence.
     */
    public function closeSession(AttendanceSession $session): JsonResponse
    {
        $closedSession = $this->attendanceService->closeSession($session->id);

        return response()->json([
            'success' => true,
            'message' => 'Session de présence fermée.',
            'session' => $closedSession,
        ]);
    }

    /**
     * Scanner un QR code de présence.
     */
    public function scanQrCode(AttendanceSession $session, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
        ]);

        $tokenParts = explode('-', $validated['token']);
        $studentId  = count($tokenParts) > 1 ? (int) $tokenParts[1] : (int) $validated['token'];

        $student = Student::with('user')->find($studentId);
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Étudiant introuvable.'], 404);
        }

        $record = $this->attendanceService->markPresence($session->id, $studentId, 'present');

        $totalAbsences = Attendance::where('student_id', $studentId)->where('status', 'absent')->count();

        $warning = null;
        if ($totalAbsences >= 3) {
            $warning = "Attention : L'étudiant a atteint {$totalAbsences} absences.";
        }

        return response()->json([
            'success'      => true,
            'message'      => 'Présence validée.',
            'student_name' => $student->user->name ?? 'Étudiant',
            'warning'      => $warning,
            'record'       => $record,
        ]);
    }
}