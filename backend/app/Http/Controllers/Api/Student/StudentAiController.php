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

        $query = strtolower($validated['query']);
        $answer = "Je suis votre assistant IA pour cet examen.";

        // Simple heuristic for simulation purposes
        if (strpos($query, 'calculatrice') !== false) {
            $answer = "La calculatrice est strictement autorisée uniquement si elle est non-programmable pour le module {$exam->module->name}.";
        } elseif (strpos($query, 'points négatifs') !== false || strpos($query, 'qcm') !== false) {
            $answer = "Il n'y a pas de points négatifs pour les mauvaises réponses au QCM. Répondez à toutes les questions !";
        } elseif (strpos($query, 'coefficient') !== false) {
            $answer = "Le coefficient du module {$exam->module->name} est de " . ($exam->module->coefficient ?? 1) . ".";
        } elseif (strpos($query, 'téléphone') !== false || strpos($query, 'portable') !== false) {
            $answer = "Tout téléphone portable doit être éteint et rangé dans votre sac. Le garder sur vous est considéré comme une tentative de fraude.";
        } else {
            $answer = "Je n'ai pas de consigne spécifique concernant : \"{$validated['query']}\". Référez-vous aux instructions sur votre convocation.";
        }

        return response()->json([
            'success' => true,
            'answer' => $answer
        ]);
    }
}
