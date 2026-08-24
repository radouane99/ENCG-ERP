<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\Schedule;
use App\Services\Academic\ConflictResolutionService;
use App\Services\Academic\SmartSchedulingEngine;
use App\Services\Academic\TimetableService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    public function __construct(
        private TimetableService $timetableService,
        private SmartSchedulingEngine $engine,
        private ConflictResolutionService $resolver
    ) {}

    /**
     * Récupérer l'emploi du temps.
     */
    public function index(Request $request): JsonResponse
    {
        $schedules = $this->timetableService->getSchedules(
            $request->only(['group_id', 'professor_id', 'room_id'])
        );

        return response()->json(['success' => true, 'data' => $schedules]);
    }

    /**
     * Génération automatique de l'emploi du temps.
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'institution_id' => 'required|integer',
            'academic_year_id' => 'required|integer',
            'semester_id' => 'required|integer',
            'filiere_id' => 'required|integer',
        ]);

        $result = $this->engine->generateSemesterTimetable(
            $validated['institution_id'],
            $validated['academic_year_id'],
            $validated['semester_id'],
            $validated['filiere_id']
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Valider un déplacement Drag & Drop.
     */
    public function checkConflict(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'schedule_id' => 'required|integer',
            'new_day' => 'required|integer',
            'new_start_time' => 'required',
            'new_end_time' => 'required',
            'new_room_id' => 'required|integer',
        ]);

        $result = $this->resolver->validateAndSuggestMove(
            $validated['schedule_id'],
            $validated['new_day'],
            $validated['new_start_time'],
            $validated['new_end_time'],
            $validated['new_room_id']
        );

        if ($result['success']) {
            Schedule::where('id', $validated['schedule_id'])->update([
                'day_of_week' => $validated['new_day'],
                'start_time' => $validated['new_start_time'],
                'end_time' => $validated['new_end_time'],
                'room_id' => $validated['new_room_id'],
            ]);
        }

        return response()->json($result);
    }

    /**
     * Publier les emplois du temps d'une filière.
     */
    public function publish(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|integer',
            'semester_id' => 'required|integer',
            'filiere_id' => 'required|integer',
        ]);

        $groupIds = Group::where('filiere_id', $validated['filiere_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->pluck('id');

        $updated = Schedule::where('academic_year_id', $validated['academic_year_id'])
            ->where('semester_id', $validated['semester_id'])
            ->whereIn('group_id', $groupIds)
            ->where('is_active', false)
            ->update(['is_active' => true]);

        return response()->json([
            'success' => true,
            'message' => "{$updated} emplois du temps publiés avec succès.",
        ]);
    }

    /**
     * Créer une nouvelle séance.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'institution_id' => 'required|integer',
            'academic_year_id' => 'required|integer',
            'semester_id' => 'required|integer',
            'group_id' => 'required|integer',
            'module_id' => 'required|integer',
            'room_id' => 'nullable|integer',
            'professor_id' => 'required|integer',
            'professor_type' => 'nullable|string',
            'day_of_week' => 'required|integer|min:1|max:7',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'session_type' => 'required|string',
            'recurrence' => 'nullable|string',
        ]);

        $schedule = Schedule::create([
            'institution_id' => $validated['institution_id'],
            'academic_year_id' => $validated['academic_year_id'],
            'semester_id' => $validated['semester_id'],
            'group_id' => $validated['group_id'],
            'module_id' => $validated['module_id'],
            'room_id' => $validated['room_id'] ?? null,
            'professor_id' => $validated['professor_id'],
            'professor_type' => $validated['professor_type'] ?? 'App\\Models\\User',
            'day_of_week' => $validated['day_of_week'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'session_type' => $validated['session_type'],
            'recurrence' => $validated['recurrence'] ?? 'weekly',
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Séance créée avec succès.',
            'data' => $schedule,
        ]);
    }

    /**
     * Mettre à jour une séance.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $schedule = Schedule::findOrFail($id);

        $validated = $request->validate([
            'room_id' => 'nullable|integer',
            'professor_id' => 'nullable|integer',
            'day_of_week' => 'nullable|integer|min:1|max:7',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
            'session_type' => 'nullable|string',
        ]);

        $schedule->update(array_filter($validated, fn ($v) => $v !== null));

        return response()->json([
            'success' => true,
            'message' => 'Séance mise à jour avec succès.',
            'data' => $schedule->fresh(),
        ]);
    }

    /**
     * Supprimer une séance.
     */
    public function destroy(int $id): JsonResponse
    {
        Schedule::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Séance supprimée avec succès.',
        ]);
    }
}
