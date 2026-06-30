<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\AI\AiAssistantService;

class AiAssistantController extends Controller
{
    protected AiAssistantService $aiService;

    public function __construct(AiAssistantService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Handle chat messages from students
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
            'student_id' => 'required|integer' // Would be Auth::id() in reality
        ]);

        try {
            // Simulate AI thinking delay
            usleep(1500000); // 1.5 seconds

            $responseMessage = $this->aiService->generateResponse(
                $validated['message'],
                $validated['student_id']
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'reply' => $responseMessage,
                    'timestamp' => now()->toIso8601String()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de connexion au serveur IA.'
            ], 500);
        }
    }
}
