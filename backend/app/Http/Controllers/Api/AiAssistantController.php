<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiChatMessage;
use App\Services\Core\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiAssistantController extends Controller
{
    public function __construct(
        private AiService $aiService
    ) {}

    /**
     * Générer un quiz par IA.
     */
    public function generateQuiz(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic' => 'required|string',
            'difficulty' => 'required|string|in:beginner,intermediate,advanced',
            'count' => 'nullable|integer|min:1|max:20',
        ]);

        $result = $this->aiService->generateQuiz(
            $validated['topic'],
            $validated['difficulty'],
            $validated['count'] ?? 5
        );

        return response()->json($result);
    }

    /**
     * Chatter avec l'assistant IA.
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'role' => 'nullable|string',
        ]);

        $user = $request->user();
        $name = $user?->name ?? 'Utilisateur';
        $role = $request->input('role', 'Étudiant');
        $userId = $user?->id;

        $result = $this->aiService->chatWithAssistant($validated['message'], $role, $name, $userId);

        return response()->json($result);
    }

    /**
     * Historique des conversations.
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['success' => true, 'messages' => []]);
        }

        $messages = AiChatMessage::where('user_id', $user->id)
            ->orderBy('id')
            ->get()
            ->map(fn ($msg) => [
                'role' => $msg->role,
                'content' => $msg->content,
            ]);

        return response()->json([
            'success' => true,
            'messages' => $messages,
        ]);
    }

    /**
     * Transcription audio (Speech-to-Text).
     */
    public function transcribe(Request $request): JsonResponse
    {
        $request->validate([
            'audio' => 'required|file|mimes:wav,webm,mp3,ogg|max:10240',
        ]);

        $result = $this->aiService->transcribeAudio($request->file('audio'));

        return response()->json($result);
    }
}
