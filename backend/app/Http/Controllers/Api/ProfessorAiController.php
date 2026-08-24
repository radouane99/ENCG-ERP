<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AI\ProfAiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfessorAiController extends Controller
{
    public function __construct(
        private ProfAiService $profAiService
    ) {}

    /**
     * Générer un sujet d'examen par IA.
     */
    public function generateExam(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|integer',
            'type' => 'nullable|string',
        ]);

        $result = $this->profAiService->generateExamSubject(
            $validated['module_id'],
            $validated['type'] ?? 'EXAMEN_FINAL'
        );

        return response()->json($result);
    }

    /**
     * Analytics de classe par IA.
     */
    public function getClassAnalytics(int $moduleId): JsonResponse
    {
        return response()->json($this->profAiService->getClassAnalytics($moduleId));
    }

    /**
     * Assistant IA pour professeurs.
     */
    public function copilotQuery(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2',
        ]);

        $result = $this->profAiService->processProfQuery($validated['query'], auth()->id() ?? 1);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Correction automatique de rapport par IA.
     */
    public function gradeReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'report_content' => 'required|string|min:10',
            'rubric' => 'nullable|string',
        ]);

        $result = $this->profAiService->gradeReport(
            $validated['report_content'],
            $validated['rubric'] ?? 'Barème standard ENCG Fès'
        );

        return response()->json($result);
    }
}
