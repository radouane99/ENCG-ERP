<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Institution;
use App\Models\Professor;
use App\Models\Room;
use App\Models\Schedule;
use App\Services\Academic\AiTimetableSchedulerService;
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
            $isLanguage = str_contains(strtolower($s->module_name ?? ''), 'langue') || str_contains(strtolower($s->module_name ?? ''), 'soft skills') || str_contains(strtolower($s->schedule_type ?? ''), 'langue');

            $natureLabel = $isLab ? 'TP Informatique (Travaux Pratiques)' : ($isLanguage ? 'TD Langues & Soft Skills' : 'Cours Magistral & TD Intégré');
            $natureBadge = $isLab ? 'TP MACHINE' : ($isLanguage ? 'TD GROUPE' : 'CM / TD');

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
                'professor_name' => $s->professor_name,
                'room_id' => $s->room_id,
                'room_name' => $s->room_name ?: 'Salle',
                'room_type' => $s->room_type ?: 'classroom',
                'room_type_label' => $roomTypeLabel,
                'students_count' => $s->students_count ?: 35,
                'session_nature' => $natureLabel,
                'session_badge' => $natureBadge,
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
        $validated = $request->validate([
            'academic_year_id' => 'nullable|integer',
            'scheduled_items' => 'required|array|min:1',
            'overwrite_existing' => 'nullable|boolean',
        ]);

        $academicYearId = (! empty($validated['academic_year_id']) ? (int) $validated['academic_year_id'] : null)
            ?? AcademicYear::where('is_current', true)->value('id')
            ?? AcademicYear::first()?->id
            ?? 1;

        $institutionId = Institution::first()?->id ?? 1;
        $fallbackSemesterId = DB::table('semesters')->where('academic_year_id', $academicYearId)->value('id')
            ?? DB::table('semesters')->value('id')
            ?? 1;

        $items = $validated['scheduled_items'];
        $overwrite = $validated['overwrite_existing'] ?? false;

        DB::beginTransaction();
        try {
            if ($overwrite) {
                DB::table('schedules')
                    ->where(function ($q) use ($academicYearId) {
                        $q->where('academic_year_id', $academicYearId)->orWhereNull('academic_year_id');
                    })
                    ->delete();
            }

            $insertedCount = 0;
            foreach ($items as $item) {
                // Déterminer le type de séance (cm, td, tp)
                $badge = $item['session_badge'] ?? '';
                $sessionType = ($badge === 'TP Labo' || str_contains($item['session_nature'] ?? '', 'Informatique'))
                    ? 'tp'
                    : (($badge === 'TD Groupe' || str_contains($item['session_nature'] ?? '', 'Langues')) ? 'td' : 'cm');

                // Déterminer le semester_id adapté
                $groupSemesterNum = null;
                if (! empty($item['group_id'])) {
                    $groupSemesterNum = DB::table('groups')->where('id', $item['group_id'])->value('semester_number');
                }

                $semesterId = $fallbackSemesterId;
                if ($groupSemesterNum) {
                    $periodNum = ($groupSemesterNum % 2 === 1) ? 1 : 2;
                    $semesterId = DB::table('semesters')
                        ->where(function ($q) use ($academicYearId) {
                            $q->where('academic_year_id', $academicYearId)->orWhereNull('academic_year_id');
                        })
                        ->where('number', $periodNum)
                        ->value('id')
                        ?? DB::table('semesters')->where('number', $periodNum)->value('id')
                        ?? $fallbackSemesterId;
                }

                Schedule::create([
                    'institution_id' => $institutionId,
                    'academic_year_id' => $academicYearId,
                    'semester_id' => $semesterId,
                    'module_id' => $item['module_id'] ?? null,
                    'professor_id' => $item['professor_id'] ?? null,
                    'professor_type' => 'App\\Models\\Professor',
                    'group_id' => $item['group_id'] ?? null,
                    'room_id' => $item['room_id'] ?? null,
                    'day_of_week' => $item['day_of_week'] ?? 1,
                    'start_time' => $item['start_time'] ?? '08:30',
                    'end_time' => $item['end_time'] ?? '10:15',
                    'session_type' => $sessionType,
                    'recurrence' => 'weekly',
                    'is_active' => true,
                ]);
                $insertedCount++;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Emploi du temps déployé avec succès ({$insertedCount} séances enregistrées en BDD) !",
                'inserted_count' => $insertedCount,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement : '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer / Remettre à zéro les séances de l'emploi du temps.
     */
    public function clear(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_year_id' => 'nullable|integer',
            'semester_number' => 'nullable',
            'semester_period' => 'nullable|string',
            'filiere_id' => 'nullable|integer',
        ]);

        $query = DB::table('schedules');

        $semNumber = $validated['semester_number'] ?? null;
        $semPeriod = $validated['semester_period'] ?? null;

        if (! empty($validated['academic_year_id']) && ($semNumber || $semPeriod || ! empty($validated['filiere_id']))) {
            $query->where(function ($q) use ($validated) {
                $q->where('academic_year_id', $validated['academic_year_id'])
                    ->orWhereNull('academic_year_id');
            });
        }

        $semNumber = $validated['semester_number'] ?? null;
        $semPeriod = $validated['semester_period'] ?? null;

        if (! empty($semNumber) && is_numeric($semNumber)) {
            $query->whereExists(function ($q) use ($semNumber) {
                $q->select(DB::raw(1))
                    ->from('modules')
                    ->whereColumn('modules.id', 'schedules.module_id')
                    ->where('modules.semester_number', (int) $semNumber);
            });
        } elseif ($semPeriod === 'odd' || $semPeriod === 'autumn' || $semPeriod === 's1') {
            $query->whereExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('modules')
                    ->whereColumn('modules.id', 'schedules.module_id')
                    ->whereIn('modules.semester_number', [1, 3, 5, 7, 9]);
            });
        } elseif ($semPeriod === 'even' || $semPeriod === 'spring' || $semPeriod === 's2') {
            $query->whereExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('modules')
                    ->whereColumn('modules.id', 'schedules.module_id')
                    ->whereIn('modules.semester_number', [2, 4, 6, 8, 10]);
            });
        }

        if (! empty($validated['filiere_id'])) {
            $query->whereExists(function ($q) use ($validated) {
                $q->select(DB::raw(1))
                    ->from('groups')
                    ->whereColumn('groups.id', 'schedules.group_id')
                    ->where('groups.filiere_id', $validated['filiere_id']);
            });
        }

        $count = $query->count();
        $query->delete();

        return response()->json([
            'success' => true,
            'message' => "{$count} séance(s) d'emploi du temps ont été supprimées. La planification est remise à zéro.",
            'deleted_count' => $count,
        ]);
    }

    /**
     * Obtenir les ressources disponibles pour la configuration du planificateur (salles, professeurs, filières).
     */
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
