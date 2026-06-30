<?php

declare(strict_types=1);

namespace App\Domain\AI\Drivers;

use App\Domain\AI\Contracts\AiServiceInterface;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * GeminiAiDriver — Production driver using Google Gemini API.
 * Activate via: AI_DRIVER=gemini, GEMINI_API_KEY=your_key
 */
class GeminiAiDriver implements AiServiceInterface
{
    private const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
    private const SYSTEM_PROMPT = <<<PROMPT
        Tu es un assistant universitaire expert pour l'ENCG Fès (École Nationale de Commerce et de Gestion de Fès).
        Tu aides les étudiants, enseignants et personnel administratif avec des questions académiques,
        pédagogiques et administratives. Tu réponds en français ou en arabe selon la langue de l'utilisateur.
        Tu respectes les règles de confidentialité conformément à la loi marocaine 09-08.
        PROMPT;

    public function __construct(
        private readonly string $apiKey,
        private readonly string $model,
        private readonly float $temperature,
        private readonly int $maxTokens,
    ) {}

    public function chat(string $prompt, array $history = [], array $context = []): string
    {
        $contents = [];

        // Add conversation history
        foreach ($history as $message) {
            $contents[] = [
                'role'  => $message['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $message['content']]],
            ];
        }

        // Add current prompt with optional context
        $fullPrompt = $prompt;
        if (!empty($context)) {
            $contextStr = implode("\n", array_map(
                fn($k, $v) => "{$k}: {$v}",
                array_keys($context),
                $context
            ));
            $fullPrompt = "Contexte:\n{$contextStr}\n\nQuestion: {$prompt}";
        }

        $contents[] = ['role' => 'user', 'parts' => [['text' => $fullPrompt]]];

        $response = $this->client()->post("/{$this->model}:generateContent?key={$this->apiKey}", [
            'system_instruction' => ['parts' => [['text' => self::SYSTEM_PROMPT]]],
            'contents'           => $contents,
            'generationConfig'   => [
                'temperature'     => $this->temperature,
                'maxOutputTokens' => $this->maxTokens,
            ],
        ]);

        if ($response->failed()) {
            Log::error('Gemini API error', ['status' => $response->status(), 'body' => $response->body()]);
            throw new RuntimeException('Gemini API request failed: ' . $response->status());
        }

        return $response->json('candidates.0.content.parts.0.text', '');
    }

    public function generateMCQ(string $topic, string $level = 'intermediate', int $count = 10): array
    {
        $levelMap = ['beginner' => 'débutant', 'intermediate' => 'intermédiaire', 'advanced' => 'avancé'];
        $levelFr = $levelMap[$level] ?? 'intermédiaire';

        $prompt = <<<PROMPT
            Génère exactement {$count} questions QCM sur le thème "{$topic}" de niveau {$levelFr}.
            Format de réponse JSON strict :
            [
              {
                "question": "...",
                "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
                "answer": "A",
                "explanation": "..."
              }
            ]
            Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.
            PROMPT;

        $response = $this->chat($prompt);

        // Extract JSON from response
        preg_match('/\[.*\]/s', $response, $matches);
        if (empty($matches)) {
            throw new RuntimeException('Gemini returned invalid MCQ format');
        }

        return json_decode($matches[0], true) ?? [];
    }

    public function summarize(string $content, string $language = 'fr'): string
    {
        $langInstruction = $language === 'ar' ? 'en arabe' : 'en français';
        $prompt = "Résume le texte suivant {$langInstruction} en 3-5 points essentiels :\n\n{$content}";
        return $this->chat($prompt);
    }

    public function predictStudentRisk(array $studentData): array
    {
        $dataStr = json_encode($studentData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $prompt = <<<PROMPT
            Analyse les données académiques suivantes d'un étudiant et prédit son niveau de risque d'échec.
            Données: {$dataStr}
            
            Réponds en JSON strict:
            {
              "risk_score": 45,
              "risk_level": "medium",
              "factors": [{"factor": "...", "value": "...", "weight": 0.4}],
              "recommendations": ["..."]
            }
            PROMPT;

        $response = $this->chat($prompt);
        preg_match('/\{.*\}/s', $response, $matches);
        return json_decode($matches[0] ?? '{}', true) ?? [];
    }

    public function getDriverName(): string
    {
        return 'gemini';
    }

    private function client(): PendingRequest
    {
        return Http::baseUrl(self::API_BASE)
            ->timeout(30)
            ->retry(2, 1000)
            ->acceptJson()
            ->asJson();
    }
}
