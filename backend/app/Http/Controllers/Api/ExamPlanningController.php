<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\ExamPlanningEngine;
use App\Services\Academic\ExamConvocationService;

class ExamPlanningController extends Controller
{
    protected ExamPlanningEngine $engine;
    protected ExamConvocationService $convocationService;

    public function __construct(ExamPlanningEngine $engine, ExamConvocationService $convocationService)
    {
        $this->engine = $engine;
        $this->convocationService = $convocationService;
    }

    /**
     * Generate an exam plan (Seatings + Surveillance)
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'exam_id' => 'required|integer',
            'room_ids' => 'required|array',
            'room_ids.*' => 'integer',
            'professor_ids' => 'required|array',
            'professor_ids.*' => 'integer'
        ]);

        $result = $this->engine->generatePlan(
            $validated['exam_id'],
            $validated['room_ids'],
            $validated['professor_ids']
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Get details of an exam's seating and surveillance
     */
    public function getDetails(int $examId): JsonResponse
    {
        $result = $this->convocationService->getExamDetails($examId);
        return response()->json($result);
    }

    /**
     * Create a new exam manually with database persistence
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|integer',
            'group_id' => 'nullable|integer',
            'room_id' => 'nullable|integer',
            'exam_date' => 'required|date',
            'start_time' => 'required|string',
            'duration_minutes' => 'required|integer',
            'session_type' => 'nullable|string'
        ]);

        $exam = \App\Models\Exam::create([
            'module_id' => $validated['module_id'],
            'group_id' => $validated['group_id'] ?? null,
            'room_id' => $validated['room_id'] ?? null,
            'exam_date' => $validated['exam_date'],
            'start_time' => $validated['start_time'],
            'duration_minutes' => $validated['duration_minutes'],
            'session_type' => $validated['session_type'] ?? 'normale',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Examen créé avec succès.',
            'exam' => $exam->load(['module', 'group', 'room'])
        ]);
    }

    /**
     * Check room availability and same-day group collision detection
     */
    public function checkRoomConflict(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id' => 'required|integer',
            'group_id' => 'nullable|integer',
            'exam_date' => 'required|date',
            'start_time' => 'required|string',
            'duration_minutes' => 'required|integer'
        ]);

        // 1. Check room collision at date and start_time
        $roomConflict = \App\Models\Exam::where('room_id', $validated['room_id'])
            ->where('exam_date', $validated['exam_date'])
            ->where('start_time', $validated['start_time'])
            ->with(['module', 'room'])
            ->first();

        if ($roomConflict) {
            $modName = $roomConflict->module->name ?? 'Autre module';
            $roomName = $roomConflict->room->name ?? 'La salle';
            return response()->json([
                'success' => false,
                'has_conflict' => true,
                'message' => "{$roomName} est déjà réservée le {$validated['exam_date']} à {$validated['start_time']} pour l'examen ({$modName})."
            ]);
        }

        // 2. Check same-day student group collision
        if (!empty($validated['group_id'])) {
            $groupConflict = \App\Models\Exam::where('group_id', $validated['group_id'])
                ->where('exam_date', $validated['exam_date'])
                ->with(['module'])
                ->first();

            if ($groupConflict) {
                $modName = $groupConflict->module->name ?? 'un autre examen';
                return response()->json([
                    'success' => true,
                    'has_conflict' => false,
                    'warning' => "Attention: Ce groupe a déjà un examen prévu le même jour ({$modName})."
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'has_conflict' => false,
            'message' => 'La salle est disponible et aucun chevauchement n\'est détecté.'
        ]);
    }
}
