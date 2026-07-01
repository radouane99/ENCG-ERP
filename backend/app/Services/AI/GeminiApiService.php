<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiApiService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    protected string $model = 'gemini-1.5-flash';

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY', '');
    }

    /**
     * Send a prompt to Gemini 1.5 Flash.
     */
    public function generateContent(string $prompt, array $systemInstructions = []): ?string
    {
        $url = "{$this->baseUrl}/{$this->model}:generateContent?key={$this->apiKey}";

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
            $response = Http::post($url, $payload);

            if ($response->successful()) {
                $data = $response->json();
                return $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            }

            Log::error('Gemini API Error: ' . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::error('Gemini API Exception: ' . $e->getMessage());
            return null;
        }
    }
    
    // Module 1: Chatbot Administratif
    public function chatbotResponse(string $message): string
    {
        $system = [
            "Tu es l'assistant administratif virtuel de l'ENCG.",
            "Réponds de manière concise, polie et professionnelle aux étudiants.",
            "Aide-les sur les dates d'examens, documents administratifs et absences."
        ];
        
        return $this->generateContent($message, $system) ?? "Désolé, je ne suis pas disponible pour le moment.";
    }

    // Module 2: QCM Generator
    public function generateQcm(string $topic, int $questionsCount = 5): string
    {
        $system = [
            "Tu es un professeur universitaire de l'ENCG expert en conception d'évaluations.",
            "Génère un QCM au format JSON strictement valide. Ne retourne aucun texte autour du JSON.",
            "Format attendu: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correct_index\":0}]"
        ];
        
        $prompt = "Crée un QCM de $questionsCount questions de niveau universitaire sur le sujet : $topic.";
        
        $result = $this->generateContent($prompt, $system);
        
        // Clean markdown blocks if any
        if ($result) {
            $result = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $result);
        }
        
        return $result ?? "[]";
    }

    // Module 4: PDF Summary
    public function summarizeText(string $text): string
    {
        $system = [
            "Tu es un assistant académique expert en résumé de cours universitaires."
        ];
        
        $prompt = "Résume le cours suivant en gardant les points essentiels, concepts clés et définitions importantes. Utilise Markdown pour formater le texte.\n\nCours:\n" . $text;
        return $this->generateContent($prompt, $system) ?? "Impossible de générer le résumé.";
    }

    // Module 5: Virtual Tutor
    public function virtualTutorResponse(string $question, string $contextText): string
    {
        $system = [
            "Tu es un tuteur virtuel pour un module de l'ENCG.",
            "Réponds à la question de l'étudiant UNIQUEMENT en te basant sur le contexte du cours fourni.",
            "Si la réponse n'est pas dans le cours, dis poliment que l'information n'est pas présente dans les supports actuels."
        ];
        
        $prompt = "Contexte du cours :\n$contextText\n\nQuestion de l'étudiant : $question";
        return $this->generateContent($prompt, $system) ?? "Désolé, je ne peux pas analyser ce document pour le moment.";
    }

    // Module 3: Planificateur de Révision
    public function generateRevisionPlan(string $modules): string
    {
        $system = [
            "Tu es un coach académique expert pour les étudiants de l'ENCG.",
            "Génère un plan de révision au format JSON strictement valide, sans markdown autour.",
            "Format attendu: {\"motivationMessage\":\"...\",\"plan\":[{\"day\":\"Jour 1\",\"focus\":\"Module X\",\"tasks\":[\"Tâche 1\"]}],\"tips\":[\"Conseil 1\"]}"
        ];
        
        $prompt = "Crée un plan de révision sur 7 jours pour un étudiant ayant ces modules : $modules.";
        
        $result = $this->generateContent($prompt, $system);
        if ($result) {
            $result = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $result);
        }
        return $result ?? "{}";
    }

    // Module 6: Rapport IA Étudiant
    public function generateStudentReport(string $studentData): string
    {
        $system = [
            "Tu es un conseiller pédagogique de l'ENCG analysant les performances d'un étudiant.",
            "Génère un rapport pédagogique structuré en Markdown avec des recommandations d'amélioration."
        ];
        
        $prompt = "Analyse le profil de cet étudiant et génère un rapport : \n" . $studentData;
        return $this->generateContent($prompt, $system) ?? "Impossible de générer le rapport.";
    }
}
