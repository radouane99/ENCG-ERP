<?php

namespace App\Http\Controllers\Api\Professor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\ManualCallRequest;
use App\Http\Requests\Academic\StartAttendanceSessionRequest;
use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\Filiere;
use App\Models\Module;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\StudentRegistration;
use App\Services\Academic\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfessorAttendanceController extends Controller
{
    public function __construct(
        private AttendanceService $attendanceService
    ) {}

    /**
     * Récupérer le contexte officiel d'assiduité du professeur connecté :
     * ses modules réellement affectés, ses créneaux d'emploi du temps réels et ses filières.
     */
    public function getAttendanceContext(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Non authentifié.'], 401);
        }

        $profId = $user->professor?->id;
        $userId = $user->id;

        // 1. Récupérer les séances officielles assignées à l'enseignant (Schedules)
        $schedulesQuery = Schedule::with(['module.filiere', 'group', 'room'])->where('professor_id', $profId ?? -1)->where('academic_year_id', \App\Services\Academic\AcademicContext::yearId())->whereHas('module', fn ($q) => $q->where('institution_id', $user->institution_id));
        $dbSchedules = $schedulesQuery->get();

        // 2. Récupérer les modules assignés via le pivot officiel module_professor
        $mpModuleIds = [];
        if ($profId) {
            $mpModuleIds = DB::table('module_professor')
                ->where('professor_id', $profId)
                ->pluck('module_id')
                ->filter()
                ->unique()
                ->toArray();
        }

        $scheduleModuleIds = $dbSchedules->pluck('module_id')->filter()->unique()->toArray();
        $allAssignedModuleIds = array_values(array_unique(array_merge($scheduleModuleIds, $mpModuleIds)));

        // Modules complets strictement affectés
        $assignedModules = ! empty($allAssignedModuleIds)
            ? Module::with('filiere')->whereIn('id', $allAssignedModuleIds)->get()
            : collect();

        // Filières distinctes strictement issues des modules affectés
        $filieres = $assignedModules->pluck('filiere')
            ->filter()
            ->unique('id')
            ->values()
            ->map(fn ($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'code' => $f->code,
            ]);

        // Créneaux horaires réels de l'emploi du temps
        $daysMap = [1 => 'Lundi', 2 => 'Mardi', 3 => 'Mercredi', 4 => 'Jeudi', 5 => 'Vendredi', 6 => 'Samedi', 7 => 'Dimanche'];
        $assignedSchedules = $dbSchedules->map(function ($s) use ($daysMap) {
            $startTime = $s->start_time ? substr($s->start_time, 0, 5) : '08:30';
            $endTime = $s->end_time ? substr($s->end_time, 0, 5) : '10:30';

            $rawType = strtoupper($s->session_type ?? 'CM');
            $sessionTypeLabel = match ($rawType) {
                'TD' => 'Travaux Dirigés (TD)',
                'TP' => 'Travaux Pratiques (TP)',
                default => 'Cours Magistral (CM)',
            };

            $dayName = is_numeric($s->day_of_week)
                ? ($daysMap[(int) $s->day_of_week] ?? 'Lundi')
                : ucfirst($s->day_of_week ?? 'Lundi');

            return [
                'id' => (string) $s->id,
                'day' => $dayName,
                'day_of_week' => is_numeric($s->day_of_week) ? (int) $s->day_of_week : null,
                'timeSlot' => "{$startTime} - {$endTime}",
                'filiereId' => $s->module?->filiere_id,
                'filiereCode' => $s->module?->filiere?->code ?? 'ENCG',
                'filiereName' => $s->module?->filiere?->name ?? 'Filière',
                'groupId' => $s->group_id,
                'groupName' => $s->group?->name ?? 'Section / Amphi',
                'moduleId' => $s->module_id,
                'moduleCode' => $s->module?->code ?? 'MOD',
                'moduleName' => $s->module?->name ?? 'Module',
                'roomName' => $s->room?->name ?? 'Salle',
                'sessionType' => $sessionTypeLabel,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'modules' => $assignedModules->map(fn ($m) => [
                    'id' => $m->id,
                    'name' => $m->name,
                    'code' => $m->code,
                    'filiere_id' => $m->filiere_id,
                    'filiere_name' => $m->filiere?->name,
                    'filiere_code' => $m->filiere?->code,
                ]),
                'schedules' => $assignedSchedules,
                'filieres' => $filieres,
                'has_assignments' => $assignedModules->isNotEmpty() || $assignedSchedules->isNotEmpty(),
            ],
        ]);
    }

    /**
     * Récupérer la liste exacte des étudiants selon la filière, l'année et le groupe (G1, G2 ou Tous les groupes).
     */
    /**
     * Récupérer la liste exacte des étudiants selon la filière, l'année et le groupe (G1, G2 ou Tous les groupes).
     */
    public function getStudents(Request $request): JsonResponse
    {
        if ($request->filled('exam_id')) {
            $data = $request->validate(['exam_id' => 'required|integer', 'room_id' => 'required|integer']);
            $exam = \App\Models\Exam::with('module')->findOrFail($data['exam_id']); abort_unless((int) $exam->module->institution_id === (int) $request->user()->institution_id, 403);
            abort_unless(\App\Support\InternshipAccess::staff($request->user()) || \App\Models\ExamSurveillance::where('exam_id', $exam->id)->where('room_id', $data['room_id'])->where('professor_id', $request->user()->id)->exists(), 403);
            $seats = \App\Models\ExamSeating::with('student.user')->where('exam_id', $exam->id)->where('room_id', $data['room_id'])->orderBy('id')->get();
            return response()->json(['data' => $seats->map(fn ($s) => ['id' => $s->student_id, 'name' => $s->student->user->name, 'cne' => $s->student->cne, 'apogee' => $s->student->student_number, 'status' => $s->is_present ? 'present' : 'absent'])]);
        }
        $session = null;
        if ($request->filled('attendance_session_id')) {
            $session = AttendanceSession::findOrFail($request->integer('attendance_session_id')); $this->attendanceService->authorizeSession($session, false);
            $module = Module::findOrFail($session->module_id); $group = \App\Models\Group::findOrFail($session->group_id);
        } elseif ($request->filled('schedule_id') && is_numeric($request->input('schedule_id'))) {
            $schedule = Schedule::findOrFail($request->integer('schedule_id')); $module = Module::findOrFail($schedule->module_id); $group = \App\Models\Group::findOrFail($schedule->group_id);
        } else {
            $data = $request->validate(['module_id' => 'required|integer', 'group_id' => 'required|integer']);
            $module = Module::findOrFail($data['module_id']); $group = \App\Models\Group::findOrFail($data['group_id']);
        }
        app(\App\Services\Security\ClassroomAccessService::class)->authorize($request->user(), $module, $group, write: true);
        $students = Student::with('user')->where('institution_id', $request->user()->institution_id)->where(fn ($q) => $q->whereHas('pathways', fn ($p) => $p->where('academic_year_id', $group->academic_year_id)->where('group_id', $group->id))->orWhereHas('registrations', fn ($r) => $r->where('academic_year_id', $group->academic_year_id)->where('group_id', $group->id)))->get()->sortBy(fn ($s) => $s->user->name);
        $records = $session ? Attendance::where('attendance_session_id', $session->id)->get()->keyBy('student_id') : collect();
        return response()->json(['data' => $students->map(fn ($s) => ['id' => $s->id, 'name' => $s->user->name, 'cne' => $s->cne, 'apogee' => $s->student_number, 'status' => $records[$s->id]->status ?? 'absent'])->values(), 'module_id' => $module->id, 'group_id' => $group->id]);
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
            $request->validated('room_name'),
            ['date' => $request->validated('date') ?? now()->toDateString()]
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
            'records.*.student_id' => 'required|integer|distinct',
            'records.*.status' => 'required|in:present,absent,late,excused',
            'close_session' => 'sometimes|boolean',
        ]);

        $session = DB::transaction(function () use ($request, $validated) {
            $session = isset($validated['session_id'])
                ? AttendanceSession::whereKey($validated['session_id'])->lockForUpdate()->firstOrFail()
                : $this->attendanceService->startSession((int) $validated['module_id'], (int) $validated['group_id'], $request->user()->id, 'Appel manuel', ['session_type' => 'manual', 'date' => $validated['date'] ?? now()->toDateString()]);
            $this->attendanceService->authorizeSession($session, false);
            if ($session->status === 'completed') {
                foreach ($validated['records'] as $row) abort_unless(Attendance::where('attendance_session_id', $session->id)->where('student_id', $row['student_id'])->where('status', $row['status'])->exists(), 409, 'Session déjà fermée avec des données différentes.');
                return $session;
            }
            foreach ($validated['records'] as $row) $this->attendanceService->markPresence($session->id, (int) $row['student_id'], $row['status']);
            if ($validated['close_session'] ?? false) $this->attendanceService->closeSession($session->id);
            return $session;
        });
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

        $raw = trim($validated['token']);
        $student = preg_match('/^(?:ENCG-)?\d+(?:-|$)/', $raw) ? Student::with('user')->find($studentId) : Student::with('user')->where('cne', $raw)->orWhere('student_number', $raw)->first();
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Étudiant introuvable.'], 404);
        }

        $studentId = $student->id;
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
