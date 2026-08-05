<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Services\Academic\ScheduleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class ScheduleController extends Controller
{
    public function __construct(
        private ScheduleService $scheduleService
    ) {}

    /**
     * Liste des séances planifiées.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Schedule::with(['module', 'professor.user', 'room', 'group']);

        if ($request->has('group_id')) {
            $query->where('group_id', (int) $request->group_id);
        }

        if ($request->has('professor_id')) {
            $query->where('professor_id', (int) $request->professor_id);
        }

        return response()->json(['data' => $query->get()]);
    }

    /**
     * Créer une nouvelle séance.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id'    => 'required|exists:modules,id',
            'professor_id' => 'required|exists:professors,id',
            'room_id'      => 'required|exists:rooms,id',
            'group_id'     => 'nullable|exists:groups,id',
            'date'         => 'required|date',
            'start_time'   => 'required|date_format:H:i',
            'end_time'     => 'required|date_format:H:i|after:start_time',
            'type'         => 'nullable|string',
        ]);

        try {
            $schedule = $this->scheduleService->createSchedule($validated);

            return response()->json([
                'success' => true,
                'message' => 'Séance planifiée avec succès.',
                'data'    => $schedule->load(['module', 'professor.user', 'room', 'group']),
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Supprimer une séance.
     */
    public function destroy(Schedule $schedule): JsonResponse
    {
        $schedule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Séance annulée avec succès.',
        ]);
    }

    /**
     * Générer une simulation d'emploi du temps par IA.
     */
    public function generateAiSimulation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'filiere_id'      => 'required|integer',
            'semester_number' => 'nullable|integer',
        ]);

        $result = $this->scheduleService->generateAiCourseTimetable(
            $validated['filiere_id'],
            $validated['semester_number'] ?? null
        );

        return response()->json($result);
    }
}