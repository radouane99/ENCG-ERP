<?php

namespace App\Http\Controllers\Api\Student;

use App\Domain\AI\Services\GroundedAiService;
use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Student;
use App\Services\Academic\LmdJudgeService;
use App\Services\AI\GeminiApiService;
use App\Services\AI\StudentAiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentAiController extends Controller
{
    public function __construct(
        private StudentAiService $studentAiService,
        private GeminiApiService $geminiApi,
        private LmdJudgeService $lmdJudge,
        private GroundedAiService $groundedAi
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
            'data' => $result,
        ]);
    }

    /**
     * Simuler une note et compensation.
     */
    public function simulateGrade(Request $request): JsonResponse
    {
        $targetGrade = (float) $request->query('target_grade', 12.0);
        $student = $request->user()?->student;
        abort_unless($student, 403, 'Profil étudiant introuvable.');
        $result = $this->studentAiService->simulateGrade((int) $student->id, $targetGrade);

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
            'query' => 'required|string|min:2',
        ]);

        $exam = Exam::with('module')->find($validated['exam_id']);
        if (! $exam) {
            return response()->json(['success' => false, 'message' => 'Examen introuvable.'], 404);
        }

        $moduleName = $exam->module->name ?? 'Module';
        $system = [
            "Tu es l'assistant d'examen officiel de l'ENCG Fès pour l'épreuve : {$moduleName}.",
            'Donne une réponse claire, précise et bienveillante en 2-3 phrases.',
        ];

        $answer = $this->geminiApi->generateContent($validated['query'], $system)
            ?? "Pour toute question concernant l'examen {$moduleName}, veuillez consulter les consignes de votre convocation officielle.";

        return response()->json([
            'success' => true,
            'answer' => $answer,
        ]);
    }

    /**
     * Analyse de support de cours par IA.
     */
    public function analyzeCourse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_content' => 'required|string|min:10',
            'title' => 'nullable|string',
        ]);

        $result = $this->studentAiService->analyzeCourseMaterial(
            $validated['course_content'],
            $validated['title'] ?? 'Support de Cours ENCG'
        );

        return response()->json($result);
    }

    public function lmdJudge(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question' => 'nullable|string|max:2000',
            'module_id' => 'nullable|integer|exists:modules,id',
        ]);

        $student = $request->user()?->student;
        abort_unless($student instanceof Student, 403, 'Profil étudiant introuvable.');

        $payload = $this->lmdJudge->judge(
            $student,
            isset($validated['module_id']) ? (int) $validated['module_id'] : null,
            $validated['question'] ?? null
        );

        return response()->json([
            'success' => true,
            'verdict' => $payload['verdict'],
            'facts' => $payload['facts'],
            'explanation_fr' => $payload['explanation_fr'],
            'explanation_ar' => $payload['explanation_ar'],
            'text_fr' => $payload['text_fr'],
            'text_ar' => $payload['text_ar'],
        ]);
    }

    public function pfeOral(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'transcript' => 'required|string|min:20',
        ]);

        $student = $request->user()?->student;
        abort_unless($student instanceof Student, 403, 'Profil étudiant introuvable.');
        $semester = (int) ($student->latestPathway?->current_semester ?? $student->current_semester ?? 1);
        abort_unless($semester >= 9, 403, 'Oral PFE réservé aux 5A (semestre ≥ 9).');

        $copy = $this->groundedAi->explain([
            'task' => 'pfe_oral',
            'semester' => $semester,
            'transcript_length' => mb_strlen($validated['transcript']),
            'grid' => ['problematique', 'sources', 'timing', 'clarte'],
        ], 'pfe_oral');

        return response()->json([
            'success' => true,
            'text_fr' => $copy['text_fr'],
            'text_ar' => $copy['text_ar'],
            'grid' => [
                'problematique' => 'À préciser à partir du transcript (IA pédagogique).',
                'sources' => 'Vérifier les références citées.',
                'timing' => 'Viser 15–20 minutes.',
                'clarte' => 'Structure introduction / développement / conclusion.',
            ],
        ]);
    }
}
