<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AI\GroqAiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiChatController extends Controller
{
    public function __construct(
        private GroqAiService $groqService
    ) {}

    /**
     * Chat avec l'IA Groq.
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string',
            'role'    => 'nullable|string',
        ]);

        $user     = $request->user();
        $userRole = $request->input('role', 'Étudiant');
        $userName = $user?->name ?? 'Utilisateur';

        $systemPrompt = "Vous êtes l'Assistant IA officiel de l'ENCG Fès.
Vous parlez français. Vous êtes professionnel, concis et serviable.
L'utilisateur s'appelle {$userName} et a le rôle de : {$userRole}.
Adaptez vos réponses à son rôle. Répondez en 3 paragraphes maximum.";

        $reply = $this->groqService->chat($systemPrompt, $request->message);

        if ($reply) {
            return response()->json([
                'success' => true,
                'reply'   => $reply,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Erreur de communication avec l\'IA.',
        ], 500);
    }
}