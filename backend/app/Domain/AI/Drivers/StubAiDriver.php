<?php

declare(strict_types=1);

namespace App\Domain\AI\Drivers;

use App\Domain\AI\Contracts\AiServiceInterface;

/**
 * StubAiDriver — Local development driver.
 * Returns realistic-looking fake responses so the entire UI can be
 * developed and tested without any API key.
 * Switch to GeminiAiDriver in production via AI_DRIVER=gemini.
 */
class StubAiDriver implements AiServiceInterface
{
    public function chat(string $prompt, array $history = [], array $context = []): string
    {
        return "**[Stub AI]** Réponse simulée pour: *{$prompt}*\n\n"
            . "Je suis l'assistant IA de l'ENCG Fès. En production, cette réponse sera générée par Gemini AI. "
            . "Pour activer Gemini, définissez `AI_DRIVER=gemini` et `GEMINI_API_KEY` dans votre fichier `.env`.";
    }

    public function generateMCQ(string $topic, string $level = 'intermediate', int $count = 10): array
    {
        $questions = [];
        for ($i = 1; $i <= $count; $i++) {
            $questions[] = [
                'question'    => "[Stub] Question {$i} sur le thème : {$topic}",
                'options'     => [
                    'A' => "Option A — Réponse correcte",
                    'B' => "Option B — Réponse incorrecte",
                    'C' => "Option C — Réponse incorrecte",
                    'D' => "Option D — Réponse incorrecte",
                ],
                'answer'      => 'A',
                'explanation' => "Cette option est correcte car elle représente la définition standard de {$topic}.",
            ];
        }
        return $questions;
    }

    public function summarize(string $content, string $language = 'fr'): string
    {
        $wordCount = str_word_count($content);
        return "[Stub] Résumé simulé ({$wordCount} mots analysés). "
            . "En production, Gemini AI réduira ce contenu à ses points essentiels avec "
            . "une précision optimisée pour le contexte universitaire marocain.";
    }

    public function predictStudentRisk(array $studentData): array
    {
        // Simulate a basic risk calculation based on attendance and grades
        $attendanceRate = $studentData['attendance_rate'] ?? 80;
        $gradeAverage   = $studentData['grade_average'] ?? 12;

        $riskScore = 100
            - ($attendanceRate * 0.4)
            - ($gradeAverage * 3);

        $riskScore = max(0, min(100, $riskScore));

        $level = match (true) {
            $riskScore >= 70 => 'critical',
            $riskScore >= 50 => 'high',
            $riskScore >= 30 => 'medium',
            default          => 'low',
        };

        return [
            'risk_score' => round($riskScore, 2),
            'risk_level' => $level,
            'factors'    => [
                ['factor' => 'Taux de présence', 'value' => $attendanceRate, 'weight' => 0.4],
                ['factor' => 'Moyenne générale', 'value' => $gradeAverage, 'weight' => 0.6],
            ],
            'recommendations' => $level !== 'low'
                ? ['Contacter l\'étudiant pour un entretien de suivi', 'Notifier le responsable pédagogique']
                : ['Maintenir le suivi régulier'],
        ];
    }

    public function getDriverName(): string
    {
        return 'stub';
    }
}
