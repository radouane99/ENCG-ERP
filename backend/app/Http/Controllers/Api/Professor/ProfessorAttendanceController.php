<?php

namespace App\Http\Controllers\Api\Professor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\ManualCallRequest;
use App\Http\Requests\Academic\StartAttendanceSessionRequest;
use App\Models\AcademicEvent;
use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\Exam;
use App\Models\ExamSeating;
use App\Models\ExamSession;
use App\Models\ExamSurveillance;
use App\Models\Group;
use App\Models\Module;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\Textbook;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Services\Academic\AcademicContext;
use App\Services\Academic\AttendanceService;
use App\Services\Security\ClassroomAccessService;
use App\Support\InternshipAccess;
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
        $schedulesQuery = Schedule::with(['module.filiere', 'group', 'room'])->where('professor_id', $profId ?? -1)->where('academic_year_id', AcademicContext::yearId())->whereHas('module', fn ($q) => $q->where('institution_id', $user->institution_id));
        $dbSchedules = $schedulesQuery->get();

        // 2. Récupérer les modules assignés via le pivot officiel module_professor
        $mpModuleIds = [];
        if ($profId) {
            $mpModuleIds = DB::table('module_professor')
                ->where('professor_id', $profId)
                ->where('academic_year_id', AcademicContext::yearId())
                ->pluck('module_id')
                ->filter()
                ->unique()
                ->toArray();
        }

        $scheduleModuleIds = $dbSchedules->pluck('module_id')->filter()->unique()->toArray();
        $allAssignedModuleIds = array_values(array_unique(array_merge($scheduleModuleIds, $mpModuleIds)));

        // Modules complets strictement affectés
        $assignedModules = ! empty($allAssignedModuleIds)
            ? Module::with('filiere')->where('institution_id', $user->institution_id)->whereIn('id', $allAssignedModuleIds)->get()
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
            $exam = Exam::with('module')->findOrFail($data['exam_id']);
            abort_unless((int) $exam->module->institution_id === (int) $request->user()->institution_id, 403);
            abort_unless(InternshipAccess::staff($request->user()) || ExamSurveillance::where('exam_id', $exam->id)->where('room_id', $data['room_id'])->where('professor_id', $request->user()->id)->exists(), 403);
            $seats = ExamSeating::with('student.user')->where('exam_id', $exam->id)->where('room_id', $data['room_id'])->orderBy('id')->get();

            return response()->json(['data' => $seats->map(fn ($s) => ['id' => $s->student_id, 'name' => $s->student->user->name, 'cne' => $s->student->cne, 'apogee' => $s->student->student_number, 'status' => $s->is_present ? 'present' : 'absent'])]);
        }
        $session = null;
        if ($request->filled('attendance_session_id')) {
            $session = AttendanceSession::findOrFail($request->integer('attendance_session_id'));
            $this->attendanceService->authorizeSession($session, false);
            $module = Module::findOrFail($session->module_id);
            $group = Group::findOrFail($session->group_id);
        } elseif ($request->filled('schedule_id') && is_numeric($request->input('schedule_id'))) {
            $schedule = Schedule::findOrFail($request->integer('schedule_id'));
            $module = Module::findOrFail($schedule->module_id);
            $group = Group::findOrFail($schedule->group_id);
        } else {
            $data = $request->validate(['module_id' => 'required|integer', 'group_id' => 'required|integer']);
            $module = Module::findOrFail($data['module_id']);
            $group = Group::findOrFail($data['group_id']);
        }
        app(ClassroomAccessService::class)->authorize($request->user(), $module, $group, write: true);
        $students = app(\App\Services\Academic\ClassroomRosterService::class)->students($group, $request->user()->institution_id)->with('user')->get()->sortBy(fn ($s) => $s->user->name);
        $records = $session ? Attendance::where('attendance_session_id', $session->id)->get()->keyBy('student_id') : collect();

        // Calcul des alertes d'assiduité officielles ENCG Fès (2 abs = warning, >= 3 abs = risque d'exclusion)
        $absenceCounts = Attendance::whereHas('session', fn ($q) => $q->where('module_id', $module->id)->where('academic_year_id', $group->academic_year_id))
            ->where('status', 'absent')
            ->where('is_justified', false)
            ->whereIn('student_id', $students->pluck('id'))
            ->selectRaw('student_id, count(*) as count')
            ->groupBy('student_id')
            ->pluck('count', 'student_id');

        return response()->json([
            'data' => $students->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->user->name,
                'cne' => $s->cne,
                'apogee' => $s->student_number,
                'status' => $records[$s->id]->status ?? 'absent',
                'absence_count' => (int) ($absenceCounts[$s->id] ?? 0),
                'version' => (int) ($records[$s->id]->version ?? 0),
            ])->values(),
            'module_id' => $module->id,
            'group_id' => $group->id,
        ]);
    }

    /**
     * Démarrer une session de présence.
     */
    public function startSession(StartAttendanceSessionRequest $request): JsonResponse
    {
        $sessionDate = $request->validated('date') ?? now()->toDateString();

        // Règle Académique ENCG Fès : Suspension d'appel durant la semaine d'examens
        $conflictingExam = ExamSession::where('is_active', true)
            ->whereDate('start_date', '<=', $sessionDate)
            ->whereDate('end_date', '>=', $sessionDate)
            ->first();

        if (! $conflictingExam) {
            $conflictingExam = AcademicEvent::where('is_active', true)
                ->whereIn('type', ['examens', 'exams', 'exam_normal', 'exam_resit'])
                ->whereDate('start_date', '<=', $sessionDate)
                ->whereDate('end_date', '>=', $sessionDate)
                ->first();
        }

        if ($conflictingExam) {
            $periodName = $conflictingExam->name ?? $conflictingExam->title ?? 'Semaine d\'Examens';

            return response()->json([
                'success' => false,
                'code' => 'EXAM_PERIOD_LOCKED',
                'message' => "Appel suspendu : La date du {$sessionDate} se situe dans la période d'examens ({$periodName}). Les cours et TD réguliers sont suspendus. L'émargement d'examen s'effectue exclusivement via le Procès-Verbal de Surveillance.",
            ], 422);
        }

        $session = $this->attendanceService->startSession(
            $request->validated('module_id'),
            $request->validated('group_id'),
            $request->user()->id,
            $request->validated('room_name'),
            ['date' => $sessionDate]
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
            'records.*.version' => 'nullable|integer|min:0',
            'close_session' => 'sometimes|boolean',
            'sync_textbook' => 'sometimes|boolean',
            'session_duration_hours' => 'required_if:sync_textbook,true|nullable|numeric|min:0.25|max:12',
            'chapter_title' => 'nullable|string|max:255',
            'key_concepts' => 'nullable|string|max:1000',
        ]);

        $session = DB::transaction(function () use ($request, $validated) {
            $session = isset($validated['session_id'])
                ? AttendanceSession::whereKey($validated['session_id'])->lockForUpdate()->firstOrFail()
                : $this->attendanceService->startSession((int) $validated['module_id'], (int) $validated['group_id'], $request->user()->id, 'Appel manuel', ['session_type' => 'manual', 'date' => $validated['date'] ?? now()->toDateString()]);
            $this->attendanceService->authorizeSession($session, false);
            if ($session->status === 'completed') {
                foreach ($validated['records'] as $row) {
                    abort_unless(Attendance::where('attendance_session_id', $session->id)->where('student_id', $row['student_id'])->where('status', $row['status'])->exists(), 409, 'Session déjà fermée avec des données différentes.');
                }

                return $session;
            }
            foreach ($validated['records'] as $row) {
                if (isset($row['version'])) {
                    $record = Attendance::where('attendance_session_id', $session->id)->where('student_id', $row['student_id'])->first();
                    abort_unless((int) ($record?->version ?? 0) === $row['version'], 409, 'L’appel a changé sur un autre poste. Actualisez les présences avant de confirmer.');
                }
                $this->attendanceService->markPresence($session->id, (int) $row['student_id'], $row['status']);
            }
            if ($validated['close_session'] ?? false) {
                $this->attendanceService->closeSession($session->id);

                // Synergie Pédagogique ENCG Fès : Clôture d'appel ➔ Synchronisation Cahier de Texte
                if (! empty($validated['sync_textbook'])) {
                    $prof = $request->user()->professor ?? \App\Models\Professor::where('user_id', $request->user()->id)->first();
                    if ($prof) {
                        $moduleObj = Module::find($session->module_id);
                        $totalPresent = Attendance::where('attendance_session_id', $session->id)->whereIn('status', ['present', 'late'])->count();
                        $totalAbsent = Attendance::where('attendance_session_id', $session->id)->where('status', 'absent')->count();
                        $defaultTitle = $validated['chapter_title'] ?? "Séance — ".($moduleObj?->name ?? 'Enseignement');
                        $defaultConcepts = $validated['key_concepts'] ?? "Séance officielle {$session->session_type} en {$session->room}. Effectif : {$totalPresent} présents, {$totalAbsent} absents.";



                        Textbook::updateOrCreate(
                            [
                                'attendance_session_id' => $session->id,
                            ],
                            [
                                'professor_id' => $prof->id,
                                'module_id' => $session->module_id,
                                'session_date' => $session->session_date,
                                'session_type' => $session->session_type ?? 'cours',
                                'user_id' => $request->user()->id,
                                'group_id' => $session->group_id,
                                'session_duration_hours' => $validated['session_duration_hours'],
                                'syllabus_percentage' => Textbook::where('attendance_session_id', $session->id)->value('syllabus_percentage') ?? 0,
                                'chapter_title' => $defaultTitle,
                                'key_concepts' => $defaultConcepts,
                                'pedagogical_goals' => "Progression du syllabus officiel & contrôle d'assiduité",

                                'status' => 'submitted',
                            ]
                        );
                    }
                }
            }

            return $session;
        });

        return response()->json([
            'success' => true,
            'message' => 'Émargement enregistré.',
            'session_id' => $session->id,
        ]);
    }

    /**
     * Téléchargement de la fiche d'émargement officielle de la session en PDF A4.
     */
    public function downloadSessionPdf(int $sessionId, Request $request)
    {
        $session = AttendanceSession::with(['module.filiere', 'group.academicYear'])->findOrFail($sessionId);
        $user = $request->user();
        $module = $session->module;
        $group = $session->group;
        app(ClassroomAccessService::class)->authorize($user, $module, $group);

        $records = Attendance::where('attendance_session_id', $session->id)->get()->keyBy('student_id');
        $absentIds = $records->where('status', 'absent')->pluck('student_id')->toArray();

        $students = Student::with(['user', 'latestPathway'])
            ->select('students.*')
            ->leftJoin('users', 'students.user_id', '=', 'users.id')
            ->where(fn ($q) => $q->whereHas('pathways', fn ($p) => $p->where('academic_year_id', $group->academic_year_id)->where('group_id', $group->id))
                ->orWhereHas('registrations', fn ($r) => $r->where('academic_year_id', $group->academic_year_id)->where('group_id', $group->id))
            )
            ->orderBy('users.last_name', 'asc')
            ->orderBy('users.first_name', 'asc')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'student_number' => $s->student_number,
                'cne' => $s->cne ?: ($s->massar_code ?: '—'),
                'cin' => $s->cin ?: ($s->user?->cin ?: '—'),
                'first_name' => $s->user?->first_name ?? '',
                'last_name' => $s->user?->last_name ?? '',
                'status' => $records[$s->id]->status ?? 'absent',
                'sub_group' => $s->latestPathway?->sub_group ?? ($s->sub_group ?? '—'),
            ]);

        $prof = $user->professor;
        $professorName = $user ? trim(($user->first_name ?? '').' '.($user->last_name ?? '')) : 'Professeur ENCG';
        $statusLabel = ($user->hasRole('vacataire') || $prof?->contract_type === 'vacataire') ? 'Enseignant Vacataire' : 'Professeur Titulaire (Permanent)';

        $trackingCode = 'EMG-'.date('Y').'-'.str_pad($session->id, 5, '0', STR_PAD_LEFT);
        $securityHash = hash('sha256', "{$session->id}_{$module->id}_{$group->id}_{$session->session_date}_{$user->id}");

        $pdf = Pdf::loadView('pdf.fiche_emargement_professeur', [
            'professorName' => $professorName,
            'professorStatus' => $statusLabel,
            'groupName' => $group->name,
            'filiereCode' => $module->filiere?->code ?? $group->filiere?->code ?? 'TC',
            'filiereName' => $module->filiere?->name ?? $group->filiere?->name ?? 'Tronc Commun',
            'semester' => $group->semester_number ?? $module->semester_number ?? 1,
            'moduleName' => $module->name ?? 'Module Pédagogique',
            'subGroup' => null,
            'academicYear' => $group->academicYear?->name ?? '2026/2027',
            'mode' => 'emargement',
            'orientation' => 'portrait',
            'absentIds' => $absentIds,
            'students' => $students,
            'trackingCode' => $trackingCode,
            'securityHash' => $securityHash,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("fiche_emargement_session_{$session->id}_{$session->session_date}.pdf");
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
    public function reopenSession(AttendanceSession $session, Request $request): JsonResponse
    {
        $data = $request->validate(['reason' => 'required|string|min:10|max:1000']);
        $session = app(\App\Actions\Attendance\ReopenAttendanceSessionAction::class)->execute($request->user(), $session->id, $data['reason']);
        return response()->json(['success' => true, 'session' => $session]);
    }

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
