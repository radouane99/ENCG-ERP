<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Professor;
use App\Models\Room;
use App\Models\Schedule;
use App\Services\Academic\AiTimetableSchedulerService;
use App\Services\Academic\TimetableCampaignService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AiTimetableSchedulerController extends Controller
{
    protected AiTimetableSchedulerService $scheduler;

    public function __construct(AiTimetableSchedulerService $scheduler)
    {
        $this->scheduler = $scheduler;
    }

    /**
     * Générer un emploi du temps optimisé par IA.
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_year_id' => 'nullable|integer',
            'semester_number' => 'nullable',
            'semester_period' => 'nullable|string',
            'filiere_id' => 'nullable|integer',
            'avoid_saturday_afternoon' => 'nullable|boolean',
            'prefer_morning_lectures' => 'nullable|boolean',
            'dedicated_rooms' => 'nullable|array',
            'dedicated_professors' => 'nullable|array',
        ]);

        $academicYearId = (! empty($validated['academic_year_id']) ? $validated['academic_year_id'] : null)
            ?? AcademicYear::where('is_current', true)->value('id')
            ?? AcademicYear::first()?->id
            ?? null;

        $semesterSelection = $validated['semester_period'] ?? $validated['semester_number'] ?? 'odd';

        $options = [
            'filiere_id' => $validated['filiere_id'] ?? null,
            'avoid_saturday_afternoon' => $validated['avoid_saturday_afternoon'] ?? true,
            'prefer_morning_lectures' => $validated['prefer_morning_lectures'] ?? true,
            'dedicated_rooms' => $validated['dedicated_rooms'] ?? [],
            'dedicated_professors' => $validated['dedicated_professors'] ?? [],
        ];

        $result = $this->scheduler->generateSchedule($academicYearId, $semesterSelection, $options);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Obtenir les séances actives enregistrées en base de données.
     */
    public function activeSessions(Request $request): JsonResponse
    {
        $academicYearId = (! empty($request->query('academic_year_id')) ? (int) $request->query('academic_year_id') : null)
            ?? AcademicYear::where('is_current', true)->value('id')
            ?? AcademicYear::first()?->id
            ?? 1;

        $schedules = DB::table('schedules')
            ->leftJoin('rooms', 'schedules.room_id', '=', 'rooms.id')
            ->leftJoin('professors', 'schedules.professor_id', '=', 'professors.id')
            ->leftJoin('users', 'professors.user_id', '=', 'users.id')
            ->leftJoin('modules', 'schedules.module_id', '=', 'modules.id')
            ->leftJoin('groups', 'schedules.group_id', '=', 'groups.id')
            ->leftJoin('filieres', 'groups.filiere_id', '=', 'filieres.id')
            ->where(function ($q) use ($academicYearId) {
                $q->where('schedules.academic_year_id', $academicYearId)
                    ->orWhereNull('schedules.academic_year_id');
            })
            ->whereRaw('(schedules.is_active = true OR schedules.is_active IS NULL)')
            ->select([
                'schedules.id',
                'schedules.day_of_week',
                'schedules.start_time',
                'schedules.end_time',
                'schedules.module_id',
                'schedules.group_id',
                'schedules.professor_id',
                'schedules.room_id',
                'schedules.session_type as schedule_type',
                'rooms.name as room_name',
                'rooms.type as room_type',
                DB::raw("COALESCE(NULLIF(TRIM(CONCAT(users.first_name, ' ', users.last_name)), ''), users.name, 'Enseignant non assigné') as professor_name"),
                'modules.name as module_name',
                'groups.name as group_name',
                'groups.capacity as students_count',
                'filieres.code as filiere_code',
            ])
            ->orderBy('schedules.day_of_week')
            ->orderBy('schedules.start_time')
            ->get();

        $items = [];
        foreach ($schedules as $s) {
            $dayOfWeek = (int) ($s->day_of_week ?? 1);
            $rType = strtolower($s->room_type ?? 'classroom');
            $roomTypeLabel = ($rType === 'lab') ? 'Labo Informatique (PC)' : (($rType === 'amphitheater' || $rType === 'amphi') ? 'Amphithéâtre' : 'Salle de TD');
            $isLab = $rType === 'lab' || str_contains(strtolower($s->room_name ?? ''), 'info');
            $isAmphi = ($rType === 'amphitheater' || $rType === 'amphi' || str_contains(strtolower($s->room_name ?? ''), 'amphi'));
            $isLanguage = str_contains(strtolower($s->module_name ?? ''), 'langue') || str_contains(strtolower($s->module_name ?? ''), 'soft skills') || str_contains(strtolower($s->schedule_type ?? ''), 'langue');

            $schedType = strtolower($s->schedule_type ?? '');
            $isCM = ($schedType === 'cm' || $isAmphi);
            $isTD = ($schedType === 'td' || $isLanguage);
            $isTP = ($schedType === 'tp' || $isLab);

            // Récupérer la filière et le semestre réels associés
            $filiereIdFromGroup = DB::table('groups')->where('id', $s->group_id)->value('filiere_id');
            if (! $filiereIdFromGroup) {
                $filiereIdFromGroup = DB::table('modules')->where('id', $s->module_id)->value('filiere_id');
            }
            if (! $filiereIdFromGroup && ! empty($s->filiere_code)) {
                $filiereIdFromGroup = DB::table('filieres')->where('code', $s->filiere_code)->value('id');
            }

            // Nombre réel d'étudiants inscrits dans cette filière (student_pathways)
            $totalFiliereStudents = 0;
            if ($filiereIdFromGroup) {
                $totalFiliereStudents = (int) DB::table('student_pathways')
                    ->where('filiere_id', $filiereIdFromGroup)
                    ->where('is_current', true)
                    ->count();
            }

            // Nombre réel par sous-groupe (soit par group_id, soit la moitié de la filière pour G1/G2)
            $realGroupStudents = 0;
            if ($s->group_id) {
                $realGroupStudents = (int) DB::table('student_pathways')
                    ->where('group_id', $s->group_id)
                    ->where('is_current', true)
                    ->count();
            }

            if ($realGroupStudents === 0 && $totalFiliereStudents > 0) {
                // Si les étudiants sont inscrits dans la filière mais pas encore subdivisés en sous-groupes,
                // un sous-groupe TD = la moitié de l'effectif réel de la filière (ex: 24 / 2 = 12)
                $realGroupStudents = (int) ceil($totalFiliereStudents / 2);
            }

            // Si c'est un CM en Amphithéâtre regroupant la filière entière :
            if ($isCM) {
                $natureLabel = 'Cours Magistral (Section)';
                $natureBadge = 'CM SECTION';
                $sessionFormat = 'cm';
                $studentsCount = $totalFiliereStudents > 0 ? $totalFiliereStudents : ($realGroupStudents > 0 ? $realGroupStudents : 0);
            } elseif ($isTD) {
                $natureLabel = 'Travaux Dirigés (Sous-groupe)';
                $natureBadge = 'TD GROUPE';
                $sessionFormat = 'td';
                $studentsCount = $realGroupStudents;
            } else {
                $natureLabel = 'TP Informatique (Labo PC)';
                $natureBadge = 'TP MACHINE';
                $sessionFormat = 'tp';
                $studentsCount = $realGroupStudents;
            }

            // Normalisation de l'appellation du professeur selon le format réel ENCG :
            $profDisplayName = $s->professor_name;
            if ($isCM && ! str_starts_with($profDisplayName, 'Pr.') && $profDisplayName !== 'Enseignant non assigné') {
                $profDisplayName = "Pr. {$profDisplayName}";
            } elseif ($isTD && ! str_ends_with($profDisplayName, '(TD)') && $profDisplayName !== 'Enseignant non assigné') {
                $cleanName = preg_replace('/^Pr\.\s*/i', '', $profDisplayName);
                $profDisplayName = "{$cleanName} (TD)";
            }

            $items[] = [
                'id' => $s->id,
                'temp_id' => 'SCHED_'.$s->id,
                'day_of_week' => $dayOfWeek,
                'day_name' => AiTimetableSchedulerService::DAYS[$dayOfWeek] ?? "Jour {$dayOfWeek}",
                'start_time' => substr((string) $s->start_time, 0, 5),
                'end_time' => substr((string) $s->end_time, 0, 5),
                'module_id' => $s->module_id,
                'module_name' => $s->module_name ?: 'Module',
                'course_id' => $s->module_id,
                'course_name' => $s->module_name ?: 'Module',
                'group_id' => $s->group_id,
                'group_name' => $s->group_name ?: 'Section ENCG',
                'filiere_code' => $s->filiere_code ?: 'TC',
                'professor_id' => $s->professor_id,
                'professor_name' => $profDisplayName,
                'room_id' => $s->room_id,
                'room_name' => $s->room_name ?: 'Salle',
                'room_type' => $s->room_type ?: 'classroom',
                'room_type_label' => $roomTypeLabel,
                'students_count' => $studentsCount,
                'session_nature' => $natureLabel,
                'session_badge' => $natureBadge,
                'session_format' => $sessionFormat,
                'is_database_active' => true,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_sessions' => count($items),
                'scheduled_sessions' => $items,
            ],
        ]);
    }

    /**
     * Scanner l'état des emplois du temps enregistrés pour vérifier les conflits.
     */
    public function scanConflicts(Request $request): JsonResponse
    {
        $academicYearId = (! empty($request->query('academic_year_id')) ? (int) $request->query('academic_year_id') : null)
            ?? AcademicYear::where('is_current', true)->value('id')
            ?? AcademicYear::first()?->id
            ?? 1;

        $scan = $this->scheduler->scanConflicts((int) $academicYearId);

        return response()->json([
            'success' => true,
            'data' => $scan,
        ]);
    }

    /**
     * Résoudre automatiquement un conflit de séance.
     */
    public function resolveConflict(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'schedule_id' => 'required|integer',
        ]);

        $res = $this->scheduler->autoResolveConflict($validated['schedule_id']);

        return response()->json($res);
    }

    /**
     * Résoudre automatiquement TOUS les conflits détectés dans la base.
     */
    public function resolveAllConflicts(Request $request): JsonResponse
    {
        $academicYearId = (! empty($request->input('academic_year_id')) ? (int) $request->input('academic_year_id') : null)
            ?? AcademicYear::where('is_current', true)->value('id')
            ?? AcademicYear::first()?->id
            ?? 1;

        $res = $this->scheduler->autoResolveAllConflicts((int) $academicYearId);

        return response()->json($res);
    }

    /**
     * Appliquer et enregistrer l'emploi du temps généré dans la base de données.
     */
    public function apply(Request $request): JsonResponse
    {
        $data = $request->validate(['version_id' => 'required|integer']);
        $result = app(TimetableCampaignService::class)->publish($data['version_id']);

        return response()->json(['success' => $result['success'], 'data' => $result], $result['success'] ? 200 : 422);
    }

    public function clear(Request $request): JsonResponse
    {
        $data = $request->validate(['version_id' => 'required|integer']);
        $ids = Schedule::where('schedule_version_id', $data['version_id'])->pluck('id')->all();
        $result = app(TimetableCampaignService::class)->deleteSession($data['version_id'], $ids);

        return response()->json(['success' => $result['success'], 'data' => $result]);
    }

    public function resources(): JsonResponse
    {
        $rooms = Room::where('is_available', true)
            ->select(['id', 'name', 'code', 'type', 'capacity'])
            ->orderBy('name')
            ->get();

        if ($rooms->isEmpty()) {
            $rooms = Room::select(['id', 'name', 'code', 'type', 'capacity'])->orderBy('name')->get();
        }

        $professors = Professor::with(['user', 'department'])
            ->where('is_active', true)
            ->get()
            ->map(function ($p) {
                $name = $p->user ? trim(($p->user->first_name ?? '').' '.($p->user->last_name ?? '')) : null;
                if (! $name) {
                    $name = $p->user?->name ?? "Professeur #{$p->id}";
                }

                return [
                    'id' => $p->id,
                    'name' => $name,
                    'email' => $p->user?->email,
                    'department' => $p->department?->name ?? 'Sciences de Gestion',
                    'department_code' => $p->department?->code ?? 'SG',
                    'specialty' => $p->specialty ?? $p->department?->name ?? 'Enseignant Chercheur',
                ];
            });

        $filieres = Filiere::where('is_active', true)
            ->select(['id', 'name', 'code', 'type'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'rooms' => $rooms,
                'professors' => $professors,
                'filieres' => $filieres,
            ],
        ]);
    }
}
