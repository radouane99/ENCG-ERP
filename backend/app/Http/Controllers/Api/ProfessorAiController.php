<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\AI\ProfAiService;

class ProfessorAiController extends Controller
{
    protected ProfAiService $profAiService;

    public function __construct(ProfAiService $profAiService)
    {
        $this->profAiService = $profAiService;
    }

    /**
     * AI Exam Generator for Professors.
     */
    public function generateExam(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|integer',
            'type' => 'nullable|string'
        ]);

        $result = $this->profAiService->generateExamSubject(
            $validated['module_id'],
            $validated['type'] ?? 'EXAMEN_FINAL'
        );

        return response()->json($result);
    }

    /**
     * AI Class Analytics for Professors.
     */
    public function getClassAnalytics(int $moduleId): JsonResponse
    {
        $result = $this->profAiService->getClassAnalytics($moduleId);

        return response()->json($result);
    }

    /**
     * Professor AI Copilot Natural Language Query.
     */
    public function copilotQuery(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2'
        ]);

        $profId = auth()->id() ?? 1;
        $result = $this->profAiService->processProfQuery($validated['query'], $profId);

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }
}
