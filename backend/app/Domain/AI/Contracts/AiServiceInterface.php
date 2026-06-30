<?php

declare(strict_types=1);

namespace App\Domain\AI\Contracts;

interface AiServiceInterface
{
    /**
     * Generate a text response to a user prompt.
     */
    public function chat(string $prompt, array $history = [], array $context = []): string;

    /**
     * Generate Multiple-Choice Questions for a given topic.
     *
     * @param int $count Number of questions
     * @return array<int, array{question: string, options: array, answer: string, explanation: string}>
     */
    public function generateMCQ(string $topic, string $level = 'intermediate', int $count = 10): array;

    /**
     * Summarize a block of text or document content.
     */
    public function summarize(string $content, string $language = 'fr'): string;

    /**
     * Predict student at-risk score (0-100) based on academic data.
     */
    public function predictStudentRisk(array $studentData): array;

    /**
     * Return the driver name for logging purposes.
     */
    public function getDriverName(): string;
}
