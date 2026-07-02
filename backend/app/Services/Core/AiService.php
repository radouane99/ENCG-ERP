<?php

namespace App\Services\Core;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;
use App\Models\AiChatMessage;

class AiService
{
    /**
     * Generate a QCM based on a given topic.
     * In a real-world app, this would make an API call to OpenAI/Anthropic/Gemini.
     */
    public function generateQuiz(string $topic, string $difficulty, int $questionsCount = 5): array
    {
        // Mocked AI Response
        $questions = [];
        for ($i = 1; $i <= $questionsCount; $i++) {
            $questions[] = [
                'question' => "Question {$i} générée par l'IA sur le sujet : {$topic} (Niveau: {$difficulty})",
                'options' => [
                    'A' => "Première option plausible",
                    'B' => "Deuxième option plausible",
                    'C' => "La bonne réponse détaillée",
                    'D' => "Une option erronée"
                ],
                'correct_answer' => 'C',
                'explanation' => "L'explication pédagogique générée par l'IA pour cette question."
            ];
        }

        return [
            'success' => true,
            'topic' => $topic,
            'difficulty' => $difficulty,
            'quiz' => $questions
        ];
    }

    /**
     * Transcribe an audio file using Groq Whisper.
     */
    public function transcribeAudio(UploadedFile $file): array
    {
        $groqApiKey = env('GROQ_API_KEY');
        if (!$groqApiKey) {
            return ['success' => false, 'text' => 'Clé API GROQ manquante.'];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$groqApiKey}"
            ])->attach(
                'file',
                file_get_contents($file->getRealPath()),
                $file->getClientOriginalName()
            )->post('https://api.groq.com/openai/v1/audio/transcriptions', [
                'model' => 'whisper-large-v3',
                'language' => 'fr', // Can be auto, but sticking to fr as base
            ]);

            if ($response->successful()) {
                return ['success' => true, 'text' => $response->json('text')];
            }

            Log::error('Groq Whisper API Error: ' . $response->body());
            return ['success' => false, 'text' => 'Erreur de transcription audio.'];
        } catch (\Exception $e) {
            Log::error('Groq Whisper Exception: ' . $e->getMessage());
            return ['success' => false, 'text' => 'Une erreur est survenue lors de la transcription.'];
        }
    }

    public function chatWithAssistant(string $prompt, string $role = 'Étudiant', string $name = 'Utilisateur', ?int $userId = null): array
    {
        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return [
                'success' => false,
                'reply' => "Clé API Gemini non configurée sur le serveur.",
                'context' => 'assistant'
            ];
        }

        // 1. Save user message if logged in
        if ($userId) {
            AiChatMessage::create([
                'user_id' => $userId,
                'role' => 'user',
                'content' => $prompt
            ]);
        }

        // 2. Fetch History
        $historyContents = [];
        if ($userId) {
            // Get last 10 messages for context
            $pastMessages = AiChatMessage::where('user_id', $userId)
                                ->orderBy('id', 'asc')
                                ->take(10)
                                ->get();
            
            foreach ($pastMessages as $msg) {
                // Gemini expects role to be 'user' or 'model'
                $geminiRole = $msg->role === 'assistant' ? 'model' : 'user';
                $historyContents[] = [
                    'role' => $geminiRole,
                    'parts' => [['text' => $msg->content]]
                ];
            }
        } else {
            // No history if not logged in
            $historyContents[] = [
                'role' => 'user',
                'parts' => [['text' => $prompt]]
            ];
        }

        $systemPrompt = "Vous êtes l'Assistant IA officiel de l'ENCG Fès (École Nationale de Commerce et de Gestion). Vous parlez français et arabe (selon la langue de l'utilisateur). Vous êtes le conseiller personnel de {$name} (Rôle: {$role}). Vous avez accès à l'historique de la conversation. Soyez concis, professionnel, et extrêmement serviable. Ne proposez que des informations relatives à la vie étudiante, aux cours, aux plannings, aux notes, ou aux documents de l'ENCG. L'utilisateur interagit avec vous soit par texte, soit par la voix. Gardez vos réponses courtes et naturelles pour qu'elles puissent être facilement lues à haute voix par la synthèse vocale.";

        // Build the contents array
        $contents = [];
        
        // Add System prompt disguised as a user/model interaction (Gemini 1.5 doesn't fully support system instructions in the same way in v1beta without specific system_instruction field)
        // Actually, we can use the `system_instruction` field for Gemini 1.5 Pro
        $payload = [
            'system_instruction' => [
                'parts' => [
                    ['text' => $systemPrompt]
                ]
            ],
            'contents' => empty($historyContents) ? [['role' => 'user', 'parts' => [['text' => $prompt]]]] : $historyContents,
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => 800,
            ]
        ];

        try {
            $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={$apiKey}", $payload);

            if ($response->successful()) {
                $data = $response->json();
                $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? "Désolé, je n'ai pas pu générer une réponse.";
                
                // 3. Save Assistant Reply
                if ($userId) {
                    AiChatMessage::create([
                        'user_id' => $userId,
                        'role' => 'assistant',
                        'content' => $reply
                    ]);
                }

                return [
                    'success' => true,
                    'reply' => $reply,
                    'context' => 'assistant'
                ];
            }

            Log::error('Gemini API Error: ' . $response->body());
            
            return [
                'success' => false,
                'reply' => "Erreur de communication avec l'IA. " . $response->status(),
                'context' => 'assistant'
            ];

        } catch (\Exception $e) {
            Log::error('Gemini API Exception: ' . $e->getMessage());
            return [
                'success' => false,
                'reply' => "Une erreur s'est produite lors de l'appel à l'IA.",
                'context' => 'assistant'
            ];
        }
    }
}
