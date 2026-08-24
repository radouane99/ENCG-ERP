<?php

namespace App\Domain\AI\Contracts;

interface AiDriverInterface
{
    /**
     * Generate text using the AI model based on a prompt.
     *
     * @param  array  $context  Optional context data
     */
    public function generate(string $prompt, array $context = []): string;

    /**
     * Ask a question in an ongoing conversation context.
     */
    public function chat(string $conversationId, string $message): string;

    /**
     * Analyze a specific entity (like a student profile) for risk prediction.
     */
    public function predictRisk(array $data): array;
}
