<?php

namespace App\Http\Controllers\Api;

use App\Actions\Attendance\ListAttendanceSessionsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\StartAttendanceSessionRequest;
use App\Models\AttendanceSession;
use App\Models\Group;
use App\Models\Module;
use App\Services\Academic\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(private AttendanceService $attendanceService)
    {
    }

    public function index(Request $request, ListAttendanceSessionsAction $action): JsonResponse
    {
        $result = $action->execute($request->search);

        return response()->json($result);
    }

    public function store(StartAttendanceSessionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $session = $this->attendanceService->startSession(
            $validated['module_id'],
            $validated['group_id'],
            $request->user()->id,
            $validated['room_name']
        );

        return response()->json([
            'message' => 'Attendance session started successfully',
            'data' => $session,
        ], 201);
    }

    public function createSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'nullable|integer|exists:modules,id',
            'module_name' => 'nullable|string|max:255',
            'group_id' => 'nullable|integer|exists:groups,id',
            'group_name' => 'nullable|string|max:255',
            'room_name' => 'required|string|max:100',
            'duration_minutes' => 'nullable|integer|min:1|max:180',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $module = ! empty($validated['module_id'])
            ? Module::findOrFail($validated['module_id'])
            : Module::query()
                ->where('name', $validated['module_name'] ?? '')
                ->orWhere('code', $validated['module_name'] ?? '')
                ->firstOrFail();

        $group = ! empty($validated['group_id'])
            ? Group::findOrFail($validated['group_id'])
            : Group::where('name', $validated['group_name'] ?? '')->firstOrFail();

        $session = $this->attendanceService->startSession(
            $module->id,
            $group->id,
            $request->user()->id,
            $validated['room_name'],
            [
                'module_name' => $module->name,
                'group_name' => $group->name,
                'duration_minutes' => $validated['duration_minutes'] ?? 15,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Attendance session started successfully',
            'data' => $session,
        ], 201);
    }

    public function sessionStats(int $id): JsonResponse
    {
        $session = AttendanceSession::with(['records.student.user'])->findOrFail($id);
        $records = $session->records;
        $presentRecords = $records->filter(fn ($record) => in_array((string) $record->status, ['present', 'late', 'excused'], true));

        return response()->json([
            'data' => [
                'session_id' => $session->id,
                'scans_count' => $presentRecords->count(),
                'present_count' => $presentRecords->where('status', 'present')->count(),
                'late_count' => $presentRecords->where('status', 'late')->count(),
                'absent_count' => $records->where('status', 'absent')->count(),
                'students' => $presentRecords->map(function ($record) {
                    return [
                        'id' => $record->student_id,
                        'name' => $record->student?->user?->name ?? 'Étudiant',
                        'status' => (string) $record->status,
                        'scanned_at' => $record->scanned_at,
                        'is_valid' => (bool) $record->is_valid,
                    ];
                })->values(),
            ],
        ]);
    }

    public function scanQr(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_token' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $student = $request->user()?->student;
        if (! $student) {
            return response()->json(['message' => 'Profil étudiant introuvable.'], 403);
        }

        $session = AttendanceSession::where('qr_token', $validated['qr_token'])
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')->orWhere('expires_at', '>=', now());
            })
            ->first();

        if (! $session) {
            return response()->json(['message' => 'Session QR invalide ou expirée.'], 404);
        }

        $record = $this->attendanceService->markPresence(
            $session->id,
            $student->id,
            'present',
            isset($validated['latitude']) ? (float) $validated['latitude'] : null,
            isset($validated['longitude']) ? (float) $validated['longitude'] : null
        );

        return response()->json([
            'message' => 'Présence enregistrée avec succès.',
            'data' => [
                'session_id' => $session->id,
                'attendance_id' => $record->id,
                'status' => (string) $record->status,
            ],
        ]);
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
