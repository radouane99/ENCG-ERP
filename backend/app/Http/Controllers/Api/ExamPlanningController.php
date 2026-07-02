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
}
