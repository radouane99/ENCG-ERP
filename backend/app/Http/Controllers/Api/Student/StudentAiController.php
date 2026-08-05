<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Services\AI\GeminiApiService;
use App\Services\AI\StudentAiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentAiController extends Controller
{
    public function __construct(
        private StudentAiService $studentAiService,
        private GeminiApiService $geminiApi
    ) {}

    /**
     * Tuteur IA pour étudiants.
     */
    public function tutorQuery(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2',
        ]);

        $result = $this->studentAiService->processTutorQuery($validated['query'], auth()->id() ?? 1);

        return response()->json([
            'success' => true,
            'data'    => $result,
        ]);
    }

    /**
     * Simuler une note et compensation.
     */
    public function simulateGrade(Request $request): JsonResponse
    {
        $targetGrade = (float) $request->query('target_grade', 12.0);
        $result      = $this->studentAiService->simulateGrade(auth()->id() ?? 1, $targetGrade);

        return response()->json($result);
    }

    /**
     * Recommandations de carrière par IA.
     */
    public function getCareerRecommendations(): JsonResponse
    {
        $result = $this->studentAiService->getCareerRecommendations(auth()->id() ?? 1);

        return response()->json($result);
    }

    /**
     * Assistant d'examen par IA.
     */
    public function examAssistant(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'exam_id' => 'required|integer',
            'query'   => 'required|string|min:2',
        ]);

        $exam = Exam::with('module')->find($validated['exam_id']);
        if (!$exam) {
            return response()->json(['success' => false, 'message' => 'Examen introuvable.'], 404);
        }

        $moduleName = $exam->module->name ?? 'Module';
        $system = [
            "Tu es l'assistant d'examen officiel de l'ENCG Fès pour l'épreuve : {$moduleName}.",
            "Donne une réponse claire, précise et bienveillante en 2-3 phrases.",
        ];

        $answer = $this->geminiApi->generateContent($validated['query'], $system)
            ?? "Pour toute question concernant l'examen {$moduleName}, veuillez consulter les consignes de votre convocation officielle.";

        return response()->json([
            'success' => true,
            'answer'  => $answer,
        ]);
    }

    /**
     * Analyse de support de cours par IA.
     */
    public function analyzeCourse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_content' => 'required|string|min:10',
            'title'          => 'nullable|string',
        ]);

        $result = $this->studentAiService->analyzeCourseMaterial(
            $validated['course_content'],
            $validated['title'] ?? 'Support de Cours ENCG'
        );

        return response()->json($result);
    }
}