<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AI\GeminiApiService;
use App\Services\Core\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiChatController extends Controller
{
    public function __construct(
        private GeminiApiService $geminiService,
        private AiService $aiService
    ) {}

    /**
     * Chat avec l'Assistant IA de l'ENCG Fès (Gemini / Groq + fallback local).
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string',
            'role' => 'nullable|string',
        ]);

        $user = $request->user();
        $userRole = (string) $request->input('role', 'Étudiant');
        $userName = $user?->name ?? 'Utilisateur';

        $systemInstructions = [
            "Vous êtes l'Assistant IA officiel de l'ENCG Fès.",
            'Vous parlez français. Vous êtes professionnel, concis et serviable.',
            "L'utilisateur s'appelle {$userName} et a le rôle de : {$userRole}.",
            'Adaptez vos réponses à son rôle. Répondez en 3 paragraphes maximum.',
        ];

        $reply = $this->geminiService->generateContent($request->message, $systemInstructions);

        if (! $reply) {
            try {
                $assistantResult = $this->aiService->chatWithAssistant(
                    $request->message,
                    $userRole,
                    $userName,
                    null
                );
                $reply = $assistantResult['reply'] ?? null;
            } catch (\Throwable) {
                $reply = null;
            }
        }

        if ($reply) {
            return response()->json([
                'success' => true,
                'reply' => $reply,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Erreur de communication avec l\'IA.',
        ], 500);
    }
}
