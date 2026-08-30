<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
            'semester_number' => 'nullable|integer|between:1,10',
            'filiere_id' => 'nullable|integer',
            'avoid_saturday_afternoon' => 'nullable|boolean',
            'prefer_morning_lectures' => 'nullable|boolean',
        ]);

        $academicYearId = (int) ($validated['academic_year_id'] ?? 1);
        $semesterNumber = (int) ($validated['semester_number'] ?? 2);

        $options = [
            'filiere_id' => $validated['filiere_id'] ?? null,
            'avoid_saturday_afternoon' => $validated['avoid_saturday_afternoon'] ?? true,
            'prefer_morning_lectures' => $validated['prefer_morning_lectures'] ?? true,
        ];

        $result = $this->scheduler->generateSchedule($academicYearId, $semesterNumber, $options);

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
        $academicYearId = (int) ($request->query('academic_year_id', 1));
        $scan = $this->scheduler->scanConflicts($academicYearId);

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
        $academicYearId = (int) ($request->input('academic_year_id', 1));
        $res = $this->scheduler->autoResolveAllConflicts($academicYearId);

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

        $academicYearId = (int) ($validated['academic_year_id'] ?? 1);
        $items = $validated['scheduled_items'];
        $overwrite = $validated['overwrite_existing'] ?? false;

        DB::beginTransaction();
        try {
            if ($overwrite) {
                DB::table('schedules')
                    ->where('academic_year_id', $academicYearId)
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
}
