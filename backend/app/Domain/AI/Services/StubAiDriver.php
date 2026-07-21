<?php

namespace App\Domain\AI\Services;

use App\Domain\AI\Contracts\AiDriverInterface;

class StubAiDriver implements AiDriverInterface
{
    public function generate(string $prompt, array $context = []): string
    {
        return "Local stub AI response for prompt: '{$prompt}'. Configure a production AI driver by setting AI_DRIVER=gemini in .env.";
    }

    public function chat(string $conversationId, string $message): string
    {
        return "Local stub chat response for message: '{$message}' in conversation: '{$conversationId}'.";
    }

    public function predictRisk(array $data): array
    {
        // Simple stub logic: if absence rate > 20%, high risk
        $absences = $data['absence_rate'] ?? 0;
        
        return [
            'risk_level' => $absences > 20 ? 'High' : 'Low',
            'confidence' => 0.85,
            'recommendation' => $absences > 20 ? 'Schedule a meeting with the student' : 'No immediate action required.',
        ];
    }
}
