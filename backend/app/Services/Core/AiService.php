<?php

namespace App\Services\Core;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;
use App\Models\AiChatMessage;
use App\Models\Student;
use App\Models\Grade;
use App\Models\AttendanceSession;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AiService
{
    protected GeminiApiService $geminiApi;

    public function __construct(GeminiApiService $geminiApi)
    {
        $this->geminiApi = $geminiApi;
    }

    /**
     * Generate a QCM using the Gemini AI (real API call).
     */
    public function generateQuiz(string $topic, string $difficulty, int $questionsCount = 5): array
    {
        $difficultyMap = [
            'beginner'     => 'facile (niveau débutant, concepts de base)',
            'intermediate' => 'intermédiaire (niveau licence, applications pratiques)',
            'advanced'     => 'avancé (niveau Master ENCG, cas complexes)',
        ];

        $levelDesc = $difficultyMap[$difficulty] ?? $difficultyMap['intermediate'];

        $prompt = "Génère exactement {$questionsCount} questions QCM à choix unique sur le sujet : '{$topic}'.
Niveau de difficulté : {$levelDesc}.

Format obligatoire pour CHAQUE question (en JSON STRICT, sans texte d'introduction ni de conclusion) :
[
  {
    \"id\": 1,
    \"question\": \"Intitulé de la question\",
    \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],
    \"correct_answer\": 0,
    \"explanation\": \"Explication détaillée de la bonne réponse\"
  }
]";

        $systemPrompt = [
            "Vous êtes un professeur expert à l'ENCG (École Nationale de Commerce et de Gestion).",
            "Vous devez générer un QCM académique rigoureux et précis.",
            "Répondez UNIQUEMENT avec un tableau JSON valide. Aucun markdown triple-backticks autour du JSON."
        ];

        $rawResponse = $this->geminiApi->generateContent($prompt, $systemPrompt);

        if (!$rawResponse) {
            return ['error' => 'Échec de la génération par l\'IA. Veuillez réessayer.'];
        }

        // Clean potential JSON markdown wrapping
        $cleanJson = trim($rawResponse);
        $cleanJson = preg_replace('/^```json\s*/i', '', $cleanJson);
        $cleanJson = preg_replace('/^```\s*/i', '', $cleanJson);
        $cleanJson = preg_replace('/```$/i', '', $cleanJson);

        $quiz = json_decode($cleanJson, true);

        if (!is_array($quiz)) {
            Log::warning("Gemini QCM returned invalid JSON: {$rawResponse}");
            return ['error' => 'Format de réponse IA invalide.'];
        }

        return ['quiz' => $quiz];
    }

    /**
     * Transcribe an audio file using Groq Whisper.
     */
    public function transcribeAudio(UploadedFile $file): array
    {
        $apiKey = config('services.groq.api_key') ?? env('GROQ_API_KEY');

        if (!$apiKey) {
            return ['success' => false, 'text' => 'Clé API Groq non configurée.'];
        }

        try {
            $response = Http::withToken($apiKey)
                ->attach('file', file_get_contents($file->getRealPath()), $file->getClientOriginalName())
                ->post('https://api.groq.com/openai/v1/audio/transcriptions', [
                    'model' => 'whisper-large-v3',
                    'language' => 'fr',
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

    /**
     * Compute predictive analytics using real DB data + Gemini narrative.
     */
    public function getPredictiveAnalytics(): array
    {
            'generated_at'   => now()->toISOString(),
        ];
    }

    /**
     * Generate a textual narrative summary using Gemini / Groq.
     */
    private function generatePredictiveNarrative(array $atRisk, array $predictions, int $total): string
    {
        $highRisk   = count(array_filter($atRisk, fn ($s) => $s['risk_level'] === 'high'));
        $mediumRisk = count(array_filter($atRisk, fn ($s) => $s['risk_level'] === 'medium'));

        $prompt = "Tu es l'IA analytique de l'ENCG Fès. Génère un résumé exécutif concis (3-4 phrases maximum) en français pour le directeur, basé sur ces données réelles :
- Total étudiants : {$total}
- Étudiants à risque élevé de décrochage : {$highRisk}
- Étudiants à risque modéré : {$mediumRisk}
- Indicateur inscriptions : {$predictions[0]['value']} ({$predictions[0]['subtext']})
- Taux de réussite estimé : {$predictions[1]['value']}
Formule des recommandations actionnables. Sois direct, factuel et professionnel.";

        $system = ["Tu es l'analyste académique principal de l'ENCG Fès."];

        return $this->geminiApi->generateContent($prompt, $system)
            ?? "L'analyse prédictive a identifié {$highRisk} étudiant(s) à risque élevé parmi {$total} inscrits. Une intervention pédagogique ciblée est recommandée.";
    }

    public function chatWithAssistant(string $prompt, string $role = 'Étudiant', string $name = 'Utilisateur', ?int $userId = null): array
    {
        // 1. Save user message if logged in
        if ($userId) {
            AiChatMessage::create([
                'user_id' => $userId,
                'role' => 'user',
                'content' => $prompt
            ]);
        }

        $systemPrompt = [
            "Vous êtes l'Assistant IA officiel de l'ENCG Fès (École Nationale de Commerce et de Gestion).",
            "Vous parlez français et arabe.",
            "Vous êtes le conseiller personnel de {$name} (Rôle: {$role}).",
            "Soyez concis, professionnel et extrêmement serviable.",
            "Ne proposez que des informations relatives à la vie étudiante, aux cours, aux plannings, aux notes, ou aux documents de l'ENCG."
        ];

        $reply = $this->geminiApi->generateContent($prompt, $systemPrompt);

        if (!$reply) {
            $reply = "Désolé, je rencontre une difficulté temporaire. Contactez la scolarité à scolarite@encg-fes.ma";
        }

        if ($userId) {
            AiChatMessage::create([
                'user_id' => $userId,
                'role' => 'assistant',
                'content' => $reply
            ]);
        }

        return ['success' => true, 'reply' => $reply, 'context' => 'assistant'];
    }
}

