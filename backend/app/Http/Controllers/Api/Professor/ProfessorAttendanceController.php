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
        $schedulesQuery = Schedule::with(['module.filiere', 'group', 'room'])
            ->where(function ($q) use ($profId, $userId) {
                if ($profId) {
                    $q->where('professor_id', $profId);
                }
                $q->orWhere('professor_id', $userId);
            });

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
        $assignedSchedules = $dbSchedules->map(function ($s) {
            $startTime = $s->start_time ? substr($s->start_time, 0, 5) : '08:30';
            $endTime = $s->end_time ? substr($s->end_time, 0, 5) : '10:30';

            $rawType = strtoupper($s->session_type ?? 'CM');
            $sessionTypeLabel = match ($rawType) {
                'TD' => 'Travaux Dirigés (TD)',
                'TP' => 'Travaux Pratiques (TP)',
                default => 'Cours Magistral (CM)',
            };

            return [
                'id' => (string) $s->id,
                'day' => ucfirst($s->day_of_week ?? 'Lundi'),
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
        $sessionId = $request->input('session_id') ?? $request->input('schedule_id');
        $groupLabel = (string) $request->input('group_label', '');
        $groupName = (string) $request->input('group_name', '');
        $filiereCode = (string) $request->input('filiere_code', '');
        $semesterNum = $request->integer('semester_number');
        $scheduleGroupId = null;
        $sessionType = '';
        $schedule = null;

        // Si session_id est fourni, charger les métadonnées officielles de la séance d'emploi du temps
        if ($sessionId && is_numeric($sessionId)) {
            $schedule = Schedule::with(['module.filiere', 'group', 'room'])->find($sessionId);
            if ($schedule) {
                if (! $filiereCode && $schedule->module?->filiere?->code) {
                    $filiereCode = $schedule->module->filiere->code;
                }
                if (! $semesterNum && $schedule->module?->semester_number) {
                    $semesterNum = $schedule->module->semester_number;
                }
                if (! $groupLabel && $schedule->group?->name) {
                    $groupLabel = $schedule->group->name;
                }
                if ($schedule->group_id) {
                    $scheduleGroupId = $schedule->group_id;
                }
                $sessionType = strtoupper($schedule->session_type ?? 'CM');
            }
        }

        $academicYear = AcademicYear::query()->where('is_current', true)->first();
        $combined = trim($groupLabel.' '.$groupName.' '.$filiereCode.' '.$sessionType);

        // 1. Détection du semestre académique (ex: S1 -> 1, S5 -> 5)
        if (! $semesterNum) {
            if (preg_match('/S(\d+)/i', $combined, $m)) {
                $semesterNum = (int) $m[1];
            } else {
                $semesterNum = 1;
            }
        }

        // 2. Détection de la portée et du groupe ciblé (Règle 3 : toujours filtrer par groupe s'il est spécifié)
        $isExam = $request->boolean('is_exam')
            || $request->input('context') === 'exam'
            || preg_match('/(exam|surveillance)/i', $combined);

        $isAllGroups = $isExam || (bool) preg_match('/(tous|all|section\s*complète|promo|g1\s*\+\s*g2)/i', $combined);
        $targetGroupNum = null;

        if (! $isAllGroups) {
            if (preg_match('/G2|Groupe\s*2/i', $combined)) {
                $targetGroupNum = 2;
            } elseif (preg_match('/G1|Groupe\s*1/i', $combined)) {
                $targetGroupNum = 1;
            } elseif (preg_match('/G3|Groupe\s*3/i', $combined)) {
                $targetGroupNum = 3;
            } elseif (preg_match('/G4|Groupe\s*4/i', $combined)) {
                $targetGroupNum = 4;
            }
        }

        // 3. Identification de la filière
        $filiere = null;
        if ($request->has('filiere_id')) {
            $filiere = Filiere::find($request->input('filiere_id'));
        }
        if (! $filiere && ! empty($schedule?->module?->filiere)) {
            $filiere = $schedule->module->filiere;
        }
        if (! $filiere && $filiereCode !== '') {
            $cleanCode = trim(str_ireplace(['TC-', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', '•', 'G1', 'G2'], '', $filiereCode));
            if ($cleanCode !== '') {
                $filiere = Filiere::where('code', 'ILIKE', "%{$cleanCode}%")
                    ->orWhere('name', 'ILIKE', "%{$cleanCode}%")
                    ->first();
            }
        }
        if (! $filiere) {
            $filiere = Filiere::where('code', 'TC')->first() ?? Filiere::first();
        }

        // 4. Requête officielle des inscriptions d'étudiants (StudentRegistration)
        // Les étudiants sont inscrits annuellement : le semestre en base peut être S1 ou S2 pour l'année 1
        $yearLevel = (int) ceil($semesterNum / 2);
        $semestersInYear = [($yearLevel * 2) - 1, $yearLevel * 2];

        $regQuery = StudentRegistration::with(['student.user', 'group', 'filiere']);

        if ($academicYear) {
            $regQuery->where('academic_year_id', $academicYear->id);
        }

        if ($filiere) {
            $regQuery->where('filiere_id', $filiere->id);
        }

        // Vérifier d'abord si le semestre exact a des inscriptions, sinon utiliser les semestres de l'année
        $strictSemQuery = (clone $regQuery)->where('semester_number', $semesterNum);
        if ($strictSemQuery->exists()) {
            $regQuery->where('semester_number', $semesterNum);
        } else {
            $regQuery->whereIn('semester_number', $semestersInYear);
        }

        // Si ce n'est PAS un cours en amphi/examen et qu'un seul groupe est ciblé (séance TD/TP)
        if (! $isAllGroups && ($targetGroupNum || $scheduleGroupId)) {
            $regQuery->where(function ($q) use ($targetGroupNum, $scheduleGroupId) {
                if ($scheduleGroupId) {
                    $q->where('group_id', $scheduleGroupId);
                }
                if ($targetGroupNum) {
                    $q->orWhereHas('group', function ($gq) use ($targetGroupNum) {
                        $gq->where('name', 'ILIKE', "%G{$targetGroupNum}%")
                           ->orWhere('name', 'ILIKE', "%Groupe {$targetGroupNum}%")
                           ->orWhere('name', 'ILIKE', "%Groupe{$targetGroupNum}%");
                    });
                }
            });
        }

        $registrations = $regQuery->get();

        // Si aucun étudiant avec le filtre groupe strict, récupérer tous les étudiants de la filière pour l'année
        if ($registrations->isEmpty() && $filiere) {
            $registrations = StudentRegistration::with(['student.user', 'group', 'filiere'])
                ->where('filiere_id', $filiere->id)
                ->where('academic_year_id', $academicYear?->id ?? 3)
                ->whereIn('semester_number', $semestersInYear)
                ->get();
        }

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
            })->sortBy('name')->values();

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
