<?php

namespace App\Services\AI;

use App\Models\Student;
use App\Models\Professor;
use App\Models\Grade;
use App\Models\Schedule;
use App\Models\DisciplineCase;
use App\Models\VacationContract;
use App\Services\AI\GeminiApiService;

class AdminAiCopilotService
{
    protected GeminiApiService $geminiApi;

    public function __construct(GeminiApiService $geminiApi)
    {
        $this->geminiApi = $geminiApi;
    }

    /**
     * Process natural language query from Admin Copilot using REAL Google Gemini AI + live MySQL DB metrics.
     */
    public function processQuery(string $query): array
    {
        $queryLower = mb_strtolower($query);

        // Fetch real aggregated database statistics
        $totalStudents = Student::count();
        $admittedCount = Student::where('status', 'active')->count();
        $totalProfs = Professor::count();
        $totalSchedules = Schedule::count();
        $casesCount = DisciplineCase::count();
        $totalAbsences = \App\Models\AttendanceRecord::where('status', 'absent')->count();

        $contracts = VacationContract::with('sessions')->get();
        $totalBudget = 0;
        $totalHours = 0;
        foreach ($contracts as $contract) {
            $h = $contract->sessions ? $contract->sessions->sum('hours') : ($contract->agreed_hours ?? 0);
            $r = $contract->hourly_rate ?? 350;
            $totalBudget += ($h * $r);
            $totalHours += $h;
        }

        // Build rich database context for Gemini 1.5 Flash
        $dbContext = "DONNÉES EN TEMPS RÉEL MYSQL DE L'ENCG FÈS :\n" .
            "- Total Étudiants Inscrits: {$totalStudents}\n" .
            "- Étudiants Actifs / Admis: {$admittedCount}\n" .
            "- Corps Enseignant: {$totalProfs}\n" .
            "- Séances de Cours au Planning: {$totalSchedules}\n" .
            "- Absences Enregistrées au Scanner: {$totalAbsences}\n" .
            "- Dossiers Disciplinaires: {$casesCount}\n" .
            "- Masse Salariale Vacations: " . number_format($totalBudget, 2) . " MAD ({$totalHours}h émargées).\n";

        $systemPrompt = [
            "Tu es le Copilote IA Administratif officiel de l'École Nationale de Commerce et de Gestion (ENCG) de Fès.",
            "Réponds avec une haute précision professionnelle en te basant sur les données MySQL fournies ci-dessous.",
            "Sois concis, clair, élégant et structuré en Markdown.",
            $dbContext
        ];

        // Call Real Google Gemini 1.5 Flash API
        $aiResponseText = $this->geminiApi->generateContent($query, $systemPrompt);

        if (!$aiResponseText) {
            $aiResponseText = "D'après les données MySQL réelles de l'ENCG Fès : {$totalStudents} étudiants sont enregistrés, avec un budget de vacations de " . number_format($totalBudget, 2) . " MAD pour {$totalHours}h d'enseignement.";
        }

        return [
            'type' => 'gemini_ai_response',
            'answer' => $aiResponseText,
            'kpis' => [
                ['label' => 'Étudiants Inscrits (DB)', 'value' => number_format($totalStudents), 'trend' => 'MySQL Live'],
                ['label' => 'Total Vacations (DB)', 'value' => number_format($totalBudget, 2) . ' MAD', 'trend' => 'Contrats DB'],
                ['label' => 'Moteur IA Active', 'value' => 'Google Gemini 1.5 Flash', 'trend' => 'Gemini API']
            ],
            'action_suggestion' => 'Consulter le rapport officiel ou exécuter la simulation de délibération.'
        ];
    }
}
