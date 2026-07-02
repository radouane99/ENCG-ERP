<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Core\AiService;
use App\Models\AiChatMessage;

class AiAssistantController extends Controller
{
    protected AiService $aiService;

    public function __construct(AiService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Generate a quiz using AI.
     */
    public function generateQuiz(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic' => 'required|string',
            'difficulty' => 'required|string|in:beginner,intermediate,advanced',
            'count' => 'nullable|integer|min:1|max:20'
        ]);

        $result = $this->aiService->generateQuiz(
            $validated['topic'], 
            $validated['difficulty'], 
            $validated['count'] ?? 5
        );

        return response()->json($result);
    }

    /**
     * Send a prompt to the AI Assistant.
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'role' => 'nullable|string'
        ]);

        $user = $request->user();
        $name = $user ? $user->name : 'Utilisateur';
        $role = $request->input('role', 'Étudiant');
        $userId = $user ? $user->id : null;

        $result = $this->aiService->chatWithAssistant($validated['message'], $role, $name, $userId);

        return response()->json($result);
    }

    /**
     * Get user's chat history
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['messages' => []]);
        }

        $messages = AiChatMessage::where('user_id', $user->id)
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($msg) {
                return [
                    'role' => $msg->role,
                    'content' => $msg->content
                ];
            });

        return response()->json(['messages' => $messages]);
    }

    /**
     * Transcribe an audio file using AI (Speech to Text)
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
