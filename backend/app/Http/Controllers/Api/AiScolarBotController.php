<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domain\AI\Services\GeminiAiDriver;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * AiScolarBotController — Assistant Virtuel Génératif IA avec Google Gemini LLM API
 */
class AiScolarBotController extends Controller
{
    protected GeminiAiDriver $gemini;

    public function __construct()
    {
        $this->gemini = new GeminiAiDriver();
    }

    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:500',
        ]);

        $userMsg = trim($request->input('message'));

        $systemPrompt = <<<SYSTEM
Tu es ScolarBot, l'Assistant Virtuel IA officiel de l'ENCG Fès (École Nationale de Commerce et de Gestion de Fès - Université Sidi Mohamed Ben Abdellah).
Tu réponds de manière intelligente, chaleureuse et très concise aux questions des étudiants en DARIJA MAROCAINE (أهلاً، شنو بغيتي تعرف...) ou en FRANÇAIS.

Règles de réponse :
1. Réponds dans la même langue utilisée par l'étudiant (Darija si la question est en arabe/darija, Français si en français).
2. Pour les documents requis : mentionne l'original du Baccalauréat, la CNIE, le relevé de notes, l'extrait de naissance et les photos 35x45/CR80.
3. Pour les cartes étudiant : indique que la carte plastifiée CR80 Evolis est imprimée dès la validation du dossier.
4. Pour le suivi : indique d'entrer le CNE sur la page MonInscription.
5. Garde la réponse sous 4 à 5 lignes avec des émojis clairs et professionnels.
SYSTEM;

        try {
            if ($this->gemini->isConfigured()) {
                $fullPrompt = "{$systemPrompt}\n\nQuestion de l'étudiant : {$userMsg}";
                $reply = $this->gemini->generate($fullPrompt);

                if (!empty($reply)) {
                    return response()->json([
                        'reply'     => $reply,
                        'language'  => preg_match('/[\x{0600}-\x{06FF}]/u', $userMsg) ? 'ar_ma' : 'fr',
                        'category'  => 'gemini_llm',
                        'actions'   => [
                            ['label' => '🔍 Suivre mon Dossier (CNE)', 'action' => 'track_status'],
                        ],
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::warning("Gemini ScolarBot LLM Exception: " . $e->getMessage());
        }

        // Graceful fallback
        return response()->json([
            'reply'    => "📋 **ScolarBot ENCG Fès (Gemini AI) :**\n\n1. 📜 **أصل شهادة البكالوريا** + 4 نسخ مصادق عليها.\n2. 🪪 **نسختان من CNIE**.\n3. 📊 **أصل بيان النقط**.\n4. 🖼️ **4 صور شمسية** لبطاقة CR80.",
            'language' => 'ar_ma',
            'category' => 'fallback',
            'actions'  => [
                ['label' => '🔍 Suivre mon Dossier (CNE)', 'action' => 'track_status'],
            ],
        ]);
    }
}
