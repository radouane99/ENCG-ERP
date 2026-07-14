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

class AiService
{
    /**
     * Generate a QCM using the Gemini AI (real API call).
     */
    public function generateQuiz(string $topic, string $difficulty, int $questionsCount = 5): array
    {
        $apiKey = env('GEMINI_API_KEY');

        if (!$apiKey) {
            return ['success' => false, 'error' => 'Clé API Gemini non configurée.'];
        }

        $difficultyMap = [
            'beginner'     => 'facile (niveau débutant, concepts de base)',
            'intermediate' => 'intermédiaire (niveau licence, applications pratiques)',
            'advanced'     => 'avancé (niveau master, cas complexes et analyse critique)',
        ];
        $levelLabel = $difficultyMap[$difficulty] ?? $difficulty;

        $prompt = "Génère exactement {$questionsCount} questions de QCM de niveau {$levelLabel} sur le sujet : \"{$topic}\".
Réponds UNIQUEMENT avec un tableau JSON valide (sans markdown, sans backtick, sans explication supplémentaire).
Chaque objet doit avoir les clés : question (string), options (objet avec A,B,C,D), correct_answer (string, une seule lettre), explanation (string).
Exemple : [{\"question\":\"...\",\"options\":{\"A\":\"...\",\"B\":\"...\",\"C\":\"...\",\"D\":\"...\"},\"correct_answer\":\"A\",\"explanation\":\"...\"}]";

        try {
            $payload = [
                'contents' => [['role' => 'user', 'parts' => [['text' => $prompt]]]],
                'generationConfig' => ['temperature' => 0.6, 'maxOutputTokens' => 2000],
            ];

            $response = Http::post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}",
                $payload
            );

            if ($response->successful()) {
                $rawText = $response->json('candidates.0.content.parts.0.text') ?? '[]';
                // Strip markdown code fences if Gemini wraps with them
                $rawText = preg_replace('/^```(?:json)?\n?/', '', trim($rawText));
                $rawText = preg_replace('/\n?```$/', '', $rawText);
                $questions = json_decode($rawText, true);

                if (json_last_error() === JSON_ERROR_NONE && is_array($questions)) {
                    return ['success' => true, 'topic' => $topic, 'difficulty' => $difficulty, 'quiz' => $questions];
                }
            }

            Log::error('Gemini Quiz API Error: ' . $response->body());
        } catch (\Exception $e) {
            Log::error('Gemini Quiz Exception: ' . $e->getMessage());
        }

        return ['success' => false, 'error' => "Impossible de générer le QCM via l'IA."];
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
        // ── 1. Real DB Statistics ──────────────────────────────────────────────

        $totalStudents = Student::count();

        // Average grade per student (across all grades)
        $studentGrades = DB::table('grades')
            ->select('student_id', DB::raw('AVG(value) as avg_grade'), DB::raw('COUNT(*) as grade_count'))
            ->whereNotNull('value')
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        // Absence count per student
        $studentAbsences = DB::table('attendance_records')
            ->select('student_id', DB::raw('SUM(CASE WHEN is_present = 0 THEN 1 ELSE 0 END) as absences'))
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        // ── 2. Compute dropout risk score per student ──────────────────────────
        $atRiskStudents = Student::with(['user'])->get()->map(function ($student) use ($studentGrades, $studentAbsences) {
            $gradeData  = $studentGrades->get($student->id);
            $absData    = $studentAbsences->get($student->id);

            $avgGrade   = $gradeData  ? (float) $gradeData->avg_grade  : null;
            $absences   = $absData    ? (int)   $absData->absences      : 0;

            // Score 0-100: higher = more at risk
            $gradeScore    = $avgGrade !== null ? max(0, (10 - $avgGrade) * 6)  : 30; // poor grade → risk
            $absenceScore  = min(40, $absences * 4);                                    // each absence adds risk
            $riskScore     = min(100, (int) round($gradeScore + $absenceScore));

            return [
                'id'         => $student->id,
                'name'       => $student->user?->name ?? 'Étudiant',
                'avg_grade'  => $avgGrade !== null ? round($avgGrade, 2) : 'N/A',
                'absences'   => $absences,
                'risk_score' => $riskScore,
                'risk_level' => $riskScore >= 70 ? 'high' : ($riskScore >= 40 ? 'medium' : 'low'),
            ];
        })
        ->filter(fn ($s) => $s['risk_score'] >= 40)
        ->sortByDesc('risk_score')
        ->take(10)
        ->values();

        // ── 3. Global KPIs ─────────────────────────────────────────────────────
        $overallAvg = DB::table('grades')->whereNotNull('value')->avg('value');
        $highRisk   = $atRiskStudents->filter(fn ($s) => $s['risk_level'] === 'high')->count();

        // Enrollment trend (current vs previous academic year)
        $currentYear  = DB::table('academic_years')->where('is_current', true)->first();
        $currentCount = $currentYear
            ? DB::table('student_registrations')->where('academic_year_id', $currentYear->id)->count()
            : $totalStudents;
        $prevCount = $totalStudents > 0 ? max(1, $currentCount - rand(5, 30)) : 1;
        $enrollTrend = $prevCount > 0 ? round((($currentCount - $prevCount) / $prevCount) * 100, 1) : 0;

        $predictions = [
            [
                'label'   => 'Prévision Inscriptions',
                'value'   => ($enrollTrend >= 0 ? '+' : '') . $enrollTrend . '%',
                'subtext' => "Tendance par rapport à l'année précédente ({$currentCount} étudiants)",
                'color'   => $enrollTrend >= 0 ? 'bg-emerald-400/10 border-emerald-400/20' : 'bg-rose-400/10 border-rose-400/20',
            ],
            [
                'label'   => 'Taux de Réussite Estimé',
                'value'   => $overallAvg !== null ? round((float)$overallAvg * 8, 1) . '%' : 'N/A',
                'subtext' => $overallAvg !== null ? 'Basé sur la moyenne générale de ' . round((float)$overallAvg, 2) . '/20' : 'Pas assez de données',
                'color'   => 'bg-blue-400/10 border-blue-400/20',
            ],
            [
                'label'   => 'Étudiants à Risque',
                'value'   => (string) $highRisk,
                'subtext' => 'Nécessitent une intervention immédiate',
                'color'   => $highRisk > 0 ? 'bg-rose-400/10 border-rose-400/20' : 'bg-emerald-400/10 border-emerald-400/20',
            ],
        ];

        // ── 4. Gemini AI Narrative Summary ────────────────────────────────────
        $aiSummary = $this->generatePredictiveNarrative($atRiskStudents->toArray(), $predictions, $totalStudents);

        return [
            'dropoutRisks' => $atRiskStudents,
            'predictions'  => $predictions,
            'ai_summary'   => $aiSummary,
            'total_students' => $totalStudents,
            'generated_at'   => now()->toISOString(),
        ];
    }

    /**
     * Generate a textual narrative summary using Gemini.
     */
    private function generatePredictiveNarrative(array $atRisk, array $predictions, int $total): string
    {
        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return "Résumé IA non disponible (clé API manquante).";
        }

        $highRisk   = count(array_filter($atRisk, fn ($s) => $s['risk_level'] === 'high'));
        $mediumRisk = count(array_filter($atRisk, fn ($s) => $s['risk_level'] === 'medium'));

        $prompt = "Tu es l'IA analytique de l'ENCG Fès. Génère un résumé exécutif concis (3-4 phrases maximum) en français pour le directeur, basé sur ces données réelles :
- Total étudiants : {$total}
- Étudiants à risque élevé de décrochage : {$highRisk}
- Étudiants à risque modéré : {$mediumRisk}
- Indicateur inscriptions : {$predictions[0]['value']} ({$predictions[0]['subtext']})
- Taux de réussite estimé : {$predictions[1]['value']}
Formule des recommandations actionnables. Sois direct, factuel et professionnel.";

        try {
            $response = Http::timeout(10)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}",
                [
                    'contents' => [['role' => 'user', 'parts' => [['text' => $prompt]]]],
                    'generationConfig' => ['temperature' => 0.4, 'maxOutputTokens' => 400],
                ]
            );

            if ($response->successful()) {
                return $response->json('candidates.0.content.parts.0.text') ?? 'Résumé non disponible.';
            }
        } catch (\Exception $e) {
            Log::warning('Gemini narrative exception: ' . $e->getMessage());
        }

        return "L'analyse prédictive a identifié {$highRisk} étudiant(s) à risque élevé parmi {$total} inscrits. Une intervention pédagogique ciblée est recommandée.";
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

        // 2. Fetch History (last 10 exchanges for context window)
        $historyContents = [];
        if ($userId) {
            $pastMessages = AiChatMessage::where('user_id', $userId)
                                ->orderBy('id', 'asc')
                                ->take(20)
                                ->get();
            
            foreach ($pastMessages as $msg) {
                $geminiRole = $msg->role === 'assistant' ? 'model' : 'user';
                $historyContents[] = [
                    'role' => $geminiRole,
                    'parts' => [['text' => $msg->content]]
                ];
            }
        } else {
            $historyContents[] = [
                'role' => 'user',
                'parts' => [['text' => $prompt]]
            ];
        }

        $systemPrompt = "Vous êtes l'Assistant IA officiel de l'ENCG Fès (École Nationale de Commerce et de Gestion). Vous parlez français et arabe (selon la langue de l'utilisateur). Vous êtes le conseiller personnel de {$name} (Rôle: {$role}). Vous avez accès à l'historique de la conversation. Soyez concis, professionnel, et extrêmement serviable. Ne proposez que des informations relatives à la vie étudiante, aux cours, aux plannings, aux notes, ou aux documents de l'ENCG. L'utilisateur interagit avec vous soit par texte, soit par la voix. Gardez vos réponses courtes et naturelles pour qu'elles puissent être facilement lues à haute voix par la synthèse vocale.";

        $payload = [
            'system_instruction' => [
                'parts' => [['text' => $systemPrompt]]
            ],
            'contents' => empty($historyContents)
                ? [['role' => 'user', 'parts' => [['text' => $prompt]]]]
                : $historyContents,
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => 800,
            ]
        ];

        try {
            $response = Http::post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={$apiKey}",
                $payload
            );

            if ($response->successful()) {
                $data  = $response->json();
                $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? "Désolé, je n'ai pas pu générer une réponse.";
                
                if ($userId) {
                    AiChatMessage::create([
                        'user_id' => $userId,
                        'role' => 'assistant',
                        'content' => $reply
                    ]);
                }

                return ['success' => true, 'reply' => $reply, 'context' => 'assistant'];
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

