<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\AI\StudentAiService;

class StudentAiController extends Controller
{
    protected StudentAiService $studentAiService;
    protected \App\Services\AI\GeminiApiService $geminiApi;

    public function __construct(StudentAiService $studentAiService, \App\Services\AI\GeminiApiService $geminiApi)
    {
        $this->studentAiService = $studentAiService;
        $this->geminiApi = $geminiApi;
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

    public function examAssistant(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'exam_id' => 'required|integer',
            'query' => 'required|string|min:2'
        ]);

        $exam = \App\Models\Exam::with('module')->find($validated['exam_id']);
        
        if (!$exam) {
            return response()->json(['success' => false, 'message' => 'Examen introuvable'], 404);
        }

        $moduleName = $exam->module?->name ?? 'Module';
        $prompt = $validated['query'];
        $system = [
            "Tu es l'assistant d'examen officiel de l'ENCG Fès pour l'épreuve : {$moduleName}.",
            "L'examen se déroule le : " . ($exam->date ?? 'inconnue') . ".",
            "Donne une réponse claire, précise et bienveillante en 2-3 phrases."
        ];

        $answer = $this->geminiApi->generateContent($prompt, $system)
            ?? "Pour toute question concernant l'examen {$moduleName}, veuillez consulter les consignes figurant sur votre convocation officielle.";

        return response()->json([
            'success' => true,
            'answer' => $answer
        ]);
    }

    /**
     * AI Course Material Analysis (Summary, Definitions & Mermaid Mindmap).
     */
    public function analyzeCourse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_content' => 'required|string|min:10',
            'title' => 'nullable|string'
        ]);

        $result = $this->studentAiService->analyzeCourseMaterial(
            $validated['course_content'],
            $validated['title'] ?? 'Support de Cours ENCG'
        );

        return response()->json($result);
    }
}
