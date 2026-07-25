<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiApiService
{
    protected string $geminiApiKey;
    protected string $groqApiKey;
    protected string $geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    protected string $geminiModel = 'gemini-1.5-flash';

    public function __construct()
    {
        $this->geminiApiKey = env('GEMINI_API_KEY', '');
        $this->groqApiKey = env('GROQ_API_KEY', '');
    }

    /**
     * Send a prompt to Gemini 1.5 Flash (Primary AI Engine) with automatic failover to Groq (Llama-3.3-70b).
     */
    public function generateContent(string $prompt, array $systemInstructions = []): ?string
    {
        // 1. Try Primary Engine: Google Gemini 1.5 Flash
        if (!empty($this->geminiApiKey)) {
            $geminiResult = $this->callGeminiApi($prompt, $systemInstructions);
            if (!empty($geminiResult)) {
                return $geminiResult;
            }
        }

        // 2. Try Secondary Failover Engine: Groq Llama-3.3-70b
        if (!empty($this->groqApiKey)) {
            $groqResult = $this->callGroqApi($prompt, $systemInstructions);
            if (!empty($groqResult)) {
                return $groqResult;
            }
        }

        Log::error('AI Engine Exception: Both Gemini and Groq API calls failed or returned empty results.');
        return null;
    }

    /**
     * Call Google Gemini API (gemini-1.5-flash / gemini-2.0-flash).
     */
    protected function callGeminiApi(string $prompt, array $systemInstructions = []): ?string
    {
        $url = "{$this->geminiBaseUrl}/{$this->geminiModel}:generateContent?key={$this->geminiApiKey}";

        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => 2048,
            ]
        ];

        if (!empty($systemInstructions)) {
            $payload['systemInstruction'] = [
                'parts' => array_map(fn($instruction) => ['text' => $instruction], $systemInstructions)
            ];
        }

        try {
            $response = Http::timeout(10)->post($url, $payload);

            if ($response->successful()) {
                $data = $response->json();
                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                if (!empty($text)) {
                    return trim($text);
                }
            }

            Log::warning('Gemini API Non-200 Response: ' . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::warning('Gemini API Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Failover: Call Groq API (llama-3.3-70b-versatile).
     */
    protected function callGroqApi(string $prompt, array $systemInstructions = []): ?string
    {
        $url = 'https://api.groq.com/openai/v1/chat/completions';

        $messages = [];

        if (!empty($systemInstructions)) {
            $messages[] = [
                'role' => 'system',
                'content' => implode("\n", $systemInstructions)
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $prompt
        ];

        $payload = [
            'model' => 'llama-3.3-70b-versatile',
            'messages' => $messages,
            'temperature' => 0.7,
            'max_tokens' => 2048,
        ];

        try {
            $response = Http::timeout(10)
                ->withToken($this->groqApiKey)
                ->post($url, $payload);

            if ($response->successful()) {
                $data = $response->json();
                $text = $data['choices'][0]['message']['content'] ?? null;
                if (!empty($text)) {
                    return trim($text);
                }
            }

            Log::warning('Groq API Non-200 Response: ' . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::warning('Groq API Exception: ' . $e->getMessage());
            return null;
        }
    }

    // Module 1: Chatbot Virtuel
    public function chatbotResponse(string $message): string
    {
        $system = [
            "Tu es l'assistant virtuel officiel de l'ENCG Fès (École Nationale de Commerce et de Gestion de Fès).",
            "Réponds de manière concrète, polie et très précise aux étudiants et professeurs.",
            "Aide-les sur les dates d'examens, documents administratifs, absences et stages."
        ];

        return $this->generateContent($message, $system) ?? "Je suis disponible pour vous aider avec les procédures de l'ENCG Fès.";
    }

    // Module 2: QCM Generator (IA)
    public function generateQcm(string $topic, int $questionsCount = 5): string
    {
        $system = [
            "Tu es un professeur titulaire de l'ENCG Fès expert en élaboration d'épreuves d'évaluation.",
            "Génère un QCM de niveau universitaire au format JSON strictement valide sans aucun texte autour ni bloc markdown.",
            "Format attendu: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correct_index\":0}]"
        ];

        $prompt = "Conçois un QCM de $questionsCount questions de niveau universitaire sur le thème : $topic.";

        $result = $this->generateContent($prompt, $system);

        if ($result) {
            $result = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $result);
            $result = preg_replace('/```\s*(.*?)\s*```/s', '$1', $result);
        }

        return $result ?? "[]";
    }

    // Module 3: Résumé de Cours
    public function summarizeText(string $text): string
    {
        $system = [
            "Tu es un professeur agrégé de l'ENCG Fès expert en synthèse académique."
        ];

        $prompt = "Résume le cours suivant en mettant en valeur les concepts clés, formules et définitions fondamentales :\n\n" . $text;
        return $this->generateContent($prompt, $system) ?? "Impossible de résumer ce texte actuellement.";
    }

    // Module 4: Tuteur Virtuel
    public function virtualTutorResponse(string $question, string $contextText): string
    {
        $system = [
            "Tu es un tuteur pédagogique de l'ENCG Fès.",
            "Réponds à l'étudiant en te basant exclusivement sur le cours fourni."
        ];

        $prompt = "Contexte du cours :\n$contextText\n\nQuestion de l'étudiant : $question";
        return $this->generateContent($prompt, $system) ?? "Désolé, je ne peux pas traiter cette demande pour le moment.";
    }

    // Module 5: Planificateur de Révision
    public function generateRevisionPlan(string $modules): string
    {
        $system = [
            "Tu es un coach académique expert pour les étudiants de l'ENCG Fès.",
            "Génère un plan de révision au format JSON strictement valide sans aucun bloc markdown autour.",
            "Format attendu: {\"motivationMessage\":\"...\",\"plan\":[{\"day\":\"Jour 1\",\"focus\":\"...\",\"tasks\":[\"...\"]}],\"tips\":[\"...\"]}"
        ];

        $prompt = "Élabore un programme de révision sur 7 jours pour ces modules : $modules.";

        $result = $this->generateContent($prompt, $system);
        if ($result) {
            $result = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $result);
            $result = preg_replace('/```\s*(.*?)\s*```/s', '$1', $result);
        }
        return $result ?? "{}";
    }

    // Module 6: Rapport Pédagogique Étudiant
    public function generateStudentReport(string $studentData): string
    {
        $system = [
            "Tu es un conseiller pédagogique principal de l'ENCG Fès.",
            "Analyse le profil de l'étudiant et formule un rapport structuré avec conseils personnalisés."
        ];

        $prompt = "Données de l'étudiant :\n" . $studentData;
        return $this->generateContent($prompt, $system) ?? "Rapport non disponible.";
    }
}
