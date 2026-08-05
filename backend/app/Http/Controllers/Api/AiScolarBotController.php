<?php

namespace App\Http\Controllers\Api;

use App\Domain\AI\Services\GeminiAiDriver;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AiScolarBotController extends Controller
{
    public function __construct(
        private GeminiAiDriver $gemini
    ) {}

    /**
     * Chat avec ScolarBot (Gemini AI).
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:500',
        ]);

        $userMsg = trim($request->input('message'));

        $systemPrompt = <<<SYSTEM
Tu es ScolarBot, l'Assistant Virtuel IA officiel de l'ENCG Fès (École Nationale de Commerce et de Gestion de Fès - Université Sidi Mohamed Ben Abdellah).
Tu réponds de manière intelligente, chaleureuse et très concise aux questions des étudiants en DARIJA MAROCAINE ou en FRANÇAIS.

Règles de réponse :
1. Réponds dans la même langue utilisée par l'étudiant.
2. Pour les documents requis : mentionne l'original du Bac, CNIE, relevé de notes, extrait de naissance, photos.
3. Pour les cartes étudiant : indique que la carte CR80 Evolis est imprimée dès validation du dossier.
4. Pour le suivi : indique d'entrer le CNE sur la page MonInscription.
5. Garde la réponse sous 4 à 5 lignes avec des émojis.
SYSTEM;

        try {
            if ($this->gemini->isConfigured()) {
                $reply = $this->gemini->generate("{$systemPrompt}\n\nQuestion : {$userMsg}");

                if (!empty($reply)) {
                    return response()->json([
                        'success'  => true,
                        'reply'    => $reply,
                        'language' => preg_match('/[\x{0600}-\x{06FF}]/u', $userMsg) ? 'ar_ma' : 'fr',
                        'category' => 'gemini_llm',
                        'actions'  => [
                            ['label' => '🔍 Suivre mon Dossier (CNE)', 'action' => 'track_status'],
                        ],
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::warning('Gemini ScolarBot erreur: ' . $e->getMessage());
        }

        // Fallback
        return response()->json([
            'success'  => true,
            'reply'    => "📋 **ScolarBot ENCG Fès :**\n\n1. 📜 Original Bac + copies certifiées.\n2. 🪪 Copie CNIE.\n3. 📊 Relevé de notes.\n4. 🖼️ 4 photos d'identité pour carte CR80.",
            'language' => 'ar_ma',
            'category' => 'fallback',
            'actions'  => [
                ['label' => '🔍 Suivre mon Dossier (CNE)', 'action' => 'track_status'],
            ],
        ]);
    }
}