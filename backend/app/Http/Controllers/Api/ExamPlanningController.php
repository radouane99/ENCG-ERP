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
     * Create a new exam manually
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|integer',
            'group_id' => 'required|integer',
            'room_id' => 'required|integer',
            'exam_date' => 'required|date',
            'start_time' => 'required|string',
            'duration_minutes' => 'required|integer'
        ]);

        // Normally we would insert this into the DB here:
        // $exam = Exam::create($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Examen créé avec succès.',
            'exam' => [
                'id' => rand(100, 999),
                'module_id' => $validated['module_id'],
                'group_id' => $validated['group_id']
            ]
        ]);
    }

    /**
     * Check if a room is available at a specific date and time
     */
    public function checkRoomConflict(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id' => 'required|integer',
            'exam_date' => 'required|date',
            'start_time' => 'required|string',
            'duration_minutes' => 'required|integer'
        ]);

        // Simulated logic for MVP: if room_id == 1, we pretend there's a conflict
        if ($validated['room_id'] == 1) {
            return response()->json([
                'success' => false,
                'has_conflict' => true,
                'message' => 'La salle est déjà réservée pour un autre examen (Introduction - Génie Civil).'
            ]);
        }

        return response()->json([
            'success' => true,
            'has_conflict' => false,
            'message' => 'La salle est disponible.'
        ]);
    }
}
