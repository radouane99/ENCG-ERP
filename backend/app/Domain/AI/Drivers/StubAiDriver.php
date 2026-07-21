<?php

declare(strict_types=1);

namespace App\Domain\AI\Drivers;

use App\Domain\AI\Contracts\AiServiceInterface;

/**
 * StubAiDriver — Development driver for AI services.
 * In production, set AI_DRIVER=gemini and configure GEMINI_API_KEY.
 */
class StubAiDriver implements AiServiceInterface
{
    public function chat(string $prompt, array $history = [], array $context = []): string
    {
        return "[Stub AI] Placeholder response for prompt: {$prompt}. Configure Gemini AI by setting AI_DRIVER=gemini and GEMINI_API_KEY in .env.";
    }

    public function generateMCQ(string $topic, string $level = 'intermediate', int $count = 10): array
    {
        $questions = [];
        for ($i = 1; $i <= $count; $i++) {
            $questions[] = [
                'question'    => "Placeholder question {$i} for topic: {$topic}",
                'options'     => [
                    'A' => 'Option A',
                    'B' => 'Option B',
                    'C' => 'Option C',
                    'D' => 'Option D',
                ],
                'answer'      => 'A',
                'explanation' => 'Configure a production AI driver for real question generation.',
            ];
        }
        return $questions;
    }

    public function summarize(string $content, string $language = 'fr'): string
    {
        $wordCount = str_word_count($content);
        return "Placeholder summary generated for {$wordCount} words. Configure Gemini AI in production for a real summary.";
    }

    public function predictStudentRisk(array $studentData): array
    {
        $attendanceRate = $studentData['attendance_rate'] ?? 0;
        $gradeAverage   = $studentData['grade_average'] ?? 0;

        $riskScore = max(0, min(100, 100 - ($attendanceRate * 0.4) - ($gradeAverage * 3)));

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
