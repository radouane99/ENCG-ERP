<?php

namespace App\Domain\AI\Services;

use App\Domain\AI\Contracts\AiDriverInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiAiDriver implements AiDriverInterface
{
    private string $apiKey;
    private string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key', env('GEMINI_API_KEY', ''));
    }

    public function generate(string $prompt, array $context = []): string
    {
        $fullPrompt = $prompt;
        if (!empty($context)) {
            $fullPrompt .= "\n\nContext:\n" . json_encode($context, JSON_PRETTY_PRINT);
        }

        $response = Http::post($this->baseUrl . '?key=' . $this->apiKey, [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $fullPrompt]
                    ]
                ]
            ]
        ]);

        if ($response->successful()) {
            return $response->json('candidates.0.content.parts.0.text') ?? 'No response generated.';
        }

        Log::error('Gemini API Error', ['response' => $response->body()]);
        return "Error communicating with AI service.";
    }

    public function chat(string $conversationId, string $message): string
    {
        // In a real implementation, you would load previous conversation context
        // and append it to the prompt.
        return $this->generate($message);
    }

    public function predictRisk(array $data): array
    {
        $prompt = "You are an AI trained to analyze student data and predict academic risk. Analyze the following data and return ONLY a JSON object with 'risk_level' (High, Medium, Low), 'confidence' (float between 0 and 1), and 'recommendation' (string).";
        $response = $this->generate($prompt, $data);

        try {
            // Attempt to parse JSON response. Sometimes models add markdown ```json
            $cleanResponse = str_replace(['```json', '```'], '', $response);
            return json_decode($cleanResponse, true, 512, JSON_THROW_ON_ERROR);
        } catch (\Exception $e) {
            Log::error('AI Risk Prediction Parse Error', ['response' => $response]);
            return [
                'risk_level' => 'Unknown',
                'confidence' => 0.0,
                'recommendation' => 'AI failed to analyze data correctly.',
            ];
        }
    }
}
