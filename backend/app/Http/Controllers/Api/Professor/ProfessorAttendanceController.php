<?php

namespace App\Http\Controllers\Api\Professor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\ManualCallRequest;
use App\Http\Requests\Academic\StartAttendanceSessionRequest;
use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\Filiere;
use App\Models\Student;
use App\Models\StudentRegistration;
use App\Services\Academic\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfessorAttendanceController extends Controller
{
    public function __construct(
        private AttendanceService $attendanceService
    ) {}

    /**
     * Récupérer la liste exacte des étudiants selon la filière, l'année et le groupe (G1, G2 ou Tous les groupes).
     */
    public function getStudents(Request $request): JsonResponse
    {
        $groupLabel = (string) $request->input('group_label', '');
        $groupName = (string) $request->input('group_name', '');
        $filiereCode = (string) $request->input('filiere_code', '');
        $semesterNum = $request->integer('semester_number');

        $academicYear = AcademicYear::query()->where('is_current', true)->first();
        $combined = trim($groupLabel.' '.$groupName.' '.$filiereCode);

        // 1. Détection du semestre académique (ex: S1 -> 1, S5 -> 5)
        if (! $semesterNum) {
            if (preg_match('/S(\d+)/i', $combined, $m)) {
                $semesterNum = (int) $m[1];
            } else {
                $semesterNum = 1;
            }
        }

        // 2. Détection de la portée : Les examens en amphi regroupent TOUJOURS les 24 étudiants (G1 + G2)
        $isExam = $request->boolean('is_exam')
            || $request->input('context') === 'exam'
            || preg_match('/(exam|surveillance|amphi|amphithéâtre)/i', $combined);

        $isAllGroups = $isExam || (bool) preg_match('/(tous|all|section|promo|g1\s*\+\s*g2)/i', $combined);
        $targetGroupNum = null;

        if (! $isAllGroups) {
            if (preg_match('/G2|Groupe\s*2/i', $combined)) {
                $targetGroupNum = 2;
            } elseif (preg_match('/G1|Groupe\s*1/i', $combined)) {
                $targetGroupNum = 1;
            }
        }

        // 3. Identification de la filière
        $filiere = null;
        if ($filiereCode !== '') {
            $cleanCode = trim(str_ireplace(['TC-', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', '•', 'G1', 'G2'], '', $filiereCode));
            if ($cleanCode !== '') {
                $filiere = Filiere::where('code', 'ILIKE', "%{$cleanCode}%")
                    ->orWhere('name', 'ILIKE', "%{$cleanCode}%")
                    ->first();
            }
        }

        // 4. Requête officielle des inscriptions d'étudiants (StudentRegistration)
        $regQuery = StudentRegistration::with(['student.user', 'group', 'filiere'])
            ->where('semester_number', $semesterNum);

        if ($academicYear) {
            $regQuery->where('academic_year_id', $academicYear->id);
        }

        if ($filiere) {
            $regQuery->where('filiere_id', $filiere->id);
        }

        // Si ce n'est PAS un examen et qu'un seul groupe est ciblé (ex: séance TD ordinaire)
        if (! $isAllGroups && $targetGroupNum) {
            $regQuery->whereHas('group', function ($q) use ($targetGroupNum) {
                $q->where('name', 'ILIKE', "%{$targetGroupNum}%");
            });
        }

        $registrations = $regQuery->get();

        if ($registrations->isNotEmpty()) {
            $data = $registrations->map(function ($reg) {
                $st = $reg->student;
                $user = $st?->user;
                $fullName = trim(($user->first_name ?? '').' '.($user->last_name ?? ''));
                if ($fullName === '') {
                    $fullName = $user->name ?? '—';
                }

                return [
                    'id' => $st->id,
                    'user_id' => $st->user_id,
                    'name' => $fullName,
                    'cne' => $st->cne ?? '—',
                    'apogee' => $st->student_number ?? '—',
                    'group' => $reg->group?->name ?? '—',
                    'filiere' => $reg->filiere?->name ?? '—',
                    'status' => 'present',
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'is_all_groups' => $isAllGroups,
                'group_scope' => $isAllGroups ? 'Section Complète (G1 + G2)' : "Groupe {$targetGroupNum}",
                'total_students' => $data->count(),
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [],
            'is_all_groups' => $isAllGroups,
            'group_scope' => $isAllGroups ? 'Section Complète (G1 + G2)' : "Groupe {$targetGroupNum}",
            'total_students' => 0,
        ]);
    }

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

    public function save(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => 'nullable|integer|exists:attendance_sessions,id',
            'module_id' => 'required_without:session_id|nullable|integer',
            'group_id' => 'required_without:session_id|nullable|integer',
            'date' => 'nullable|date',
            'records' => 'required|array|min:1',
            'records.*.student_id' => 'required|integer',
            'records.*.status' => 'required|in:present,absent,late,excused',
        ]);

        $session = isset($validated['session_id'])
            ? AttendanceSession::findOrFail($validated['session_id'])
            : $this->attendanceService->startSession(
                (int) $validated['module_id'],
                (int) $validated['group_id'],
                (int) $request->user()->id,
                'Hors-ligne',
                ['session_type' => 'manual']
            );

        foreach ($validated['records'] as $row) {
            $this->attendanceService->markPresence(
                $session->id,
                (int) $row['student_id'],
                (string) $row['status']
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Émargement enregistré.',
            'session_id' => $session->id,
        ]);
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
            'record' => $record,
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
        $studentId = count($tokenParts) > 1 ? (int) $tokenParts[1] : (int) $validated['token'];

        $student = Student::with('user')->find($studentId);
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Étudiant introuvable.'], 404);
        }

        $record = $this->attendanceService->markPresence($session->id, $studentId, 'present');

        $totalAbsences = Attendance::where('student_id', $studentId)->where('status', 'absent')->count();

        $warning = null;
        if ($totalAbsences >= 3) {
            $warning = "Attention : L'étudiant a atteint {$totalAbsences} absences.";
        }

        return response()->json([
            'success' => true,
            'message' => 'Présence validée.',
            'student_name' => $student->user->name ?? 'Étudiant',
            'warning' => $warning,
            'record' => $record,
        ]);
    }
}
