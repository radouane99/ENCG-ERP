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
            $request->only(['group_id', 'professor_id', 'room_id', 'academic_year_id'])
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

        $result = app(\App\Services\Academic\TimetableCampaignService::class)->generateDraft($validated['filiere_id']);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Valider un déplacement Drag & Drop.
     */
    public function checkConflict(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'schedule_id' => 'required|integer',
            'new_day' => 'required|integer|min:1|max:7',
            'new_start_time' => 'required|date_format:H:i',
            'new_end_time' => 'required|date_format:H:i|after:new_start_time',
            'new_room_id' => 'required|integer',
        ]);

        $schedule = app(\App\Actions\Academic\SaveTimetableSessionAction::class)->execute([
            'day_of_week' => $validated['new_day'], 'start_time' => $validated['new_start_time'],
            'end_time' => $validated['new_end_time'], 'room_id' => $validated['new_room_id'],
        ], $validated['schedule_id']);
        $result = ['success' => true, 'message' => 'Séance déplacée.', 'data' => $schedule];
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

        $versionIds = Schedule::where('institution_id', $request->user()->institution_id)->where('academic_year_id', $validated['academic_year_id'])
            ->where('semester_id', $validated['semester_id'])
            ->whereIn('group_id', $groupIds)
            ->whereNotNull('schedule_version_id')->distinct()->pluck('schedule_version_id');
        abort_if($versionIds->isEmpty(), 422, 'Aucune proposition à publier. Utiliser la campagne semestrielle.');
        $updated = \Illuminate\Support\Facades\DB::transaction(function () use ($versionIds) {
            foreach ($versionIds as $versionId) {
                $result = app(\App\Services\Academic\TimetableCampaignService::class)->publish($versionId);
                abort_unless($result['success'], 422, $result['message']);
            }
            return $versionIds->count();
        });

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
            'session_type' => 'required|in:cm,td,tp',
            'recurrence' => 'nullable|string',
        ]);

        $schedule = app(\App\Actions\Academic\SaveTimetableSessionAction::class)->execute($validated);

        return response()->json([
            'success' => true,
            'message' => 'Séance créée avec succès.',
            'data' => $schedule,
        ], 201);
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
            'end_time' => 'nullable|date_format:H:i',
            'session_type' => 'sometimes|in:cm,td,tp',
            'version' => 'sometimes|integer|min:1',
        ]);

        $schedule = app(\App\Actions\Academic\SaveTimetableSessionAction::class)->execute($validated, $id);

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
        \Illuminate\Support\Facades\DB::transaction(function () use ($id) {
            $year = \App\Models\AcademicYear::where('institution_id', auth()->user()->institution_id)->lockForUpdate()->findOrFail(\App\Services\Academic\AcademicContext::yearId());
            abort_if($year->is_locked, 409, 'Année universitaire verrouillée.');
            $schedule = Schedule::where('institution_id', $year->institution_id)->where('academic_year_id', $year->id)->findOrFail($id);
            abort_if($schedule->schedule_version_id, 409, 'Utiliser le brouillon de la campagne.');
            $schedule->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Séance supprimée avec succès.',
        ]);
    }
}
