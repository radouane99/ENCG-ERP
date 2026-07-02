<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Core\AiService;

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
            'message' => 'required|string'
        ]);

        $result = $this->aiService->chatWithAssistant($validated['message']);

        return response()->json($result);
    }
}
