<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\AI\StudentAiService;

class StudentAiController extends Controller
{
    protected StudentAiService $studentAiService;

    public function __construct(StudentAiService $studentAiService)
    {
        $this->studentAiService = $studentAiService;
    }

    /**
     * Virtual AI Tutor for Students.
     */
    public function tutorQuery(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2'
        ]);

        $studentId = auth()->id() ?? 1;
        $result = $this->studentAiService->processTutorQuery($validated['query'], $studentId);

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    /**
     * Real Grade & Semester Compensation Simulator.
     */
    public function simulateGrade(Request $request): JsonResponse
    {
        $targetGrade = (float) $request->query('target_grade', 12.0);
        $studentId = auth()->id() ?? 1;

        $result = $this->studentAiService->simulateGrade($studentId, $targetGrade);

        return response()->json($result);
    }

    /**
     * AI Career & Internship Recommender.
     */
    public function getCareerRecommendations(): JsonResponse
    {
        $studentId = auth()->id() ?? 1;
        $result = $this->studentAiService->getCareerRecommendations($studentId);

        return response()->json($result);
    }
}
