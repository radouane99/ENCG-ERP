<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiChatController extends Controller
{
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'role' => 'nullable|string'
        ]);

        $user = $request->user();
        $userRole = $request->input('role', 'Étudiant');
        $userName = $user ? $user->name : 'Utilisateur';

        $systemPrompt = "Vous êtes l'Assistant IA officiel de l'ENCG Fès (École Nationale de Commerce et de Gestion).
Vous parlez français. Vous êtes professionnel, concis et serviable.
L'utilisateur avec qui vous parlez s'appelle $userName et a le rôle de : $userRole.
Adaptez vos réponses à son rôle. Ne proposez que des solutions ou des informations pertinentes au système ERP de l'ENCG.
Répondez de manière courte (maximum 3 paragraphes).";

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . env('GROQ_API_KEY'),
            'Content-Type' => 'application/json',
        ])->post('https://api.groq.com/openai/v1/chat/completions', [
            'model' => 'llama-3.3-70b-versatile',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $request->message]
            ],
            'temperature' => 0.7,
            'max_tokens' => 800,
        ]);

        if ($response->successful()) {
            $data = $response->json();
            $reply = $data['choices'][0]['message']['content'] ?? "Désolé, je n'ai pas pu générer une réponse.";
            return response()->json(['reply' => $reply]);
        }

        return response()->json(['error' => 'Erreur lors de la communication avec l\'IA.', 'details' => $response->body()], 500);
    }
}
