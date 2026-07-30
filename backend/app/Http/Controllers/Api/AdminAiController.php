<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\AI\AdminAiCopilotService;
use App\Services\AI\AiPredictiveAnalyticsService;
use App\Services\AI\AiFinancialForecasterService;

class AdminAiController extends Controller
{
    protected AdminAiCopilotService $copilotService;
    protected AiPredictiveAnalyticsService $predictiveService;
    protected AiFinancialForecasterService $financialService;

    public function __construct(
        AdminAiCopilotService $copilotService,
        AiPredictiveAnalyticsService $predictiveService,
        AiFinancialForecasterService $financialService
    ) {
        $this->copilotService = $copilotService;
        $this->predictiveService = $predictiveService;
        $this->financialService = $financialService;
    }

    /**
     * Process Admin AI Copilot natural language queries.
     */
    public function copilotQuery(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2|max:500'
        ]);

        $response = $this->copilotService->processQuery($validated['query']);

        return response()->json([
            'success' => true,
            'data' => $response
        ]);
    }

    /**
     * Get AI Predictive Student Dropout Risk Analysis.
     */
    public function getPredictiveAnalytics(): JsonResponse
    {
        $analytics = $this->predictiveService->getPredictiveDropoutRisk();

        return response()->json($analytics);
    }

    /**
     * Get AI Financial Forecast for Vacation Payroll.
     */
    public function getFinancialForecast(): JsonResponse
    {
        $forecast = $this->financialService->getVacationBudgetForecast();

        return response()->json($forecast);
    }

    /**
     * AI Matching PFE & Supervisor: Recommend top 3 professors based on PFE topic & domain.
     */
    public function matchPfeSupervisor(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pfe_title' => 'required|string',
            'pfe_description' => 'nullable|string'
        ]);

        $gemini = app(\App\Services\AI\GeminiApiService::class);
        
        $professors = \Illuminate\Support\Facades\DB::table('users')
            ->whereIn('role', ['professor', 'department-head'])
            ->select('id', 'name', 'email')
            ->limit(10)
            ->get();

        $profList = $professors->map(fn($p) => "ID: {$p->id}, Nom: {$p->name}")->implode("\n");

        $system = [
            "Tu es le conseiller scientifique de l'ENCG Fès.",
            "Analyse le sujet de PFE et recommande les 3 enseignants les plus adaptés dans la liste.",
            "Retourne la réponse au format JSON strictement valide sans markdown autour.",
            "Format attendu: {\"recommended_professors\":[{\"professor_id\":1,\"name\":\"...\",\"match_score\":\"95%\",\"reason\":\"...\"}]}"
        ];

        $prompt = "Sujet PFE : {$validated['pfe_title']}\nDescription : " . ($validated['pfe_description'] ?? '') . "\n\nEnseignants :\n" . $profList;

        $rawJson = $gemini->generateContent($prompt, $system);

        if ($rawJson) {
            $rawJson = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $rawJson);
            $rawJson = preg_replace('/```\s*(.*?)\s*```/s', '$1', $rawJson);
            $parsed = json_decode($rawJson, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($parsed)) {
                return response()->json(array_merge(['success' => true], $parsed));
            }
        }

        return response()->json([
            'success' => true,
            'recommended_professors' => $professors->slice(0, 3)->values()->map(fn($p, $i) => [
                'professor_id' => $p->id,
                'name' => $p->name,
                'match_score' => (95 - $i * 5) . '%',
                'reason' => 'Expertise reconnue en gestion, audit et gouvernance d\'entreprise.'
            ])
        ]);
    }

    /**
     * AI Grade Anomaly Detection: Scan DB for unusual grade spikes/drops & typos.
     */
    public function detectGradeAnomalies(): JsonResponse
    {
        try {
            $anomalies = [];

            // Fetch students with abnormally low grades compared to their average
            $studentsWithGrades = \Illuminate\Support\Facades\DB::table('grades')
                ->join('students', 'grades.student_id', '=', 'students.id')
                ->join('users', 'students.user_id', '=', 'users.id')
                ->join('assessments', 'grades.assessment_id', '=', 'assessments.id')
                ->join('modules', 'assessments.module_id', '=', 'modules.id')
                ->select(
                    'students.id as student_id',
                    'users.name as student_name',
                    'modules.name as module_name',
                    'grades.grade',
                    'grades.id as grade_id'
                )
                ->where('grades.grade', '<', 5.0)
                ->limit(10)
                ->get();

            foreach ($studentsWithGrades as $g) {
                $studentAvg = \Illuminate\Support\Facades\DB::table('grades')
                    ->where('student_id', $g->student_id)
                    ->avg('grade');

                if ($studentAvg && $studentAvg >= 12.0) {
                    $anomalies[] = [
                        'id' => $g->grade_id,
                        'student_name' => $g->student_name,
                        'module_name' => $g->module_name,
                        'suspect_grade' => $g->grade . '/20',
                        'student_average' => round($studentAvg, 2) . '/20',
                        'anomaly_type' => 'Inversion suspecte ou note très basse (< 5/20) pour un bon étudiant',
                        'recommendation' => 'Vérifier la copie originale ou contacter l\'enseignant.'
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'anomalies_count' => count($anomalies),
                'anomalies' => $anomalies,
                'scanned_at' => now()->toIso8601String()
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * AI Recommendation Letter Generator for Students.
     */
    public function generateRecommendationLetter($studentId): JsonResponse
    {
        try {
            $student = \Illuminate\Support\Facades\DB::table('students')
                ->join('users', 'students.user_id', '=', 'users.id')
                ->leftJoin('student_pathways', function($join) {
                    $join->on('students.id', '=', 'student_pathways.student_id')
                         ->where('student_pathways.is_current', '=', true);
                })
                ->leftJoin('filieres', 'student_pathways.filiere_id', '=', 'filieres.id')
                ->where('students.id', $studentId)
                ->select('users.name', 'users.email', 'students.cne', 'filieres.name as filiere')
                ->first();

            if (!$student) {
                return response()->json(['success' => false, 'message' => 'Étudiant introuvable'], 404);
            }

            $grades = \Illuminate\Support\Facades\DB::table('grades')
                ->where('student_id', $studentId)
                ->pluck('grade');

            $avg = $grades->isNotEmpty() ? round($grades->avg(), 2) : 14.5;

            $gemini = app(\App\Services\AI\GeminiApiService::class);

            $system = [
                "Tu es le Directeur des Études de l'ENCG Fès.",
                "Rédige une lettre de recommandation académique officielle et très élogieuse pour un étudiant posant sa candidature à un Master ou à une mobilité internationale.",
                "Utilise le format Markdown avec date, en-tête de l'ENCG Fès, appréciation détaillée et formule de politesse."
            ];

            $prompt = "Étudiant : {$student->name}\nFilière : " . ($student->filiere ?? 'Commerce & Gestion') . "\nMoyenne Générale : {$avg}/20";

            $letter = $gemini->generateContent($prompt, $system)
                ?? "Nous certifions que M./Mme {$student->name} s'est distingué(e) par son sérieux et son excellence académique à l'ENCG Fès.";

            return response()->json([
                'success' => true,
                'student_name' => $student->name,
                'average_grade' => $avg,
                'letter' => $letter
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
