<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
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
        ];

        $result = $this->scheduler->generateSchedule($academicYearId, $semesterSelection, $options);

        return response()->json([
            'success' => true,
            'data' => $result,
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
                Schedule::create([
                    'academic_year_id' => $academicYearId,
                    'module_id' => $item['module_id'] ?? null,
                    'professor_id' => $item['professor_id'] ?? null,
                    'group_id' => $item['group_id'] ?? null,
                    'room_id' => $item['room_id'] ?? null,
                    'day_of_week' => $item['day_of_week'] ?? 1,
                    'start_time' => $item['start_time'] ?? '08:30',
                    'end_time' => $item['end_time'] ?? '10:15',
                    'session_type' => 'cours',
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
}
