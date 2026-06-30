<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\AI\GeminiApiService;

class AiFeatureController extends Controller
{
    protected GeminiApiService $aiService;

    public function __construct(GeminiApiService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Module 1: Chatbot Administratif
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $reply = $this->aiService->chatbotResponse($validated['message']);

        return response()->json([
            'success' => true,
            'data' => [
                'reply' => $reply,
                'timestamp' => now()->toIso8601String()
            ]
        ]);
    }

    /**
     * Module 2: Générateur de QCM
     */
    public function generateQcm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic' => 'required|string|max:500',
            'count' => 'nullable|integer|min:1|max:20'
        ]);

        $count = $validated['count'] ?? 5;
        $qcmJson = $this->aiService->generateQcm($validated['topic'], $count);
        
        $qcmArray = json_decode($qcmJson, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du format QCM.'
            ], 500);
        }

        return response()->json([
            'success' => true,
            'data' => $qcmArray
        ]);
    }

    /**
     * Module 4: Résumé automatique de cours PDF (Texte extrait requis)
     */
    public function summarizePdf(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => 'required|string'
        ]);

        $summary = $this->aiService->summarizeText($validated['text']);

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary
            ]
        ]);
    }

    /**
     * Module 5: Tuteur virtuel par module
     */
    public function virtualTutor(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question' => 'required|string|max:1000',
            'context_text' => 'required|string'
        ]);

        $reply = $this->aiService->virtualTutorResponse(
            $validated['question'], 
            $validated['context_text']
        );

        return response()->json([
            'success' => true,
            'data' => [
                'reply' => $reply,
                'timestamp' => now()->toIso8601String()
            ]
        ]);
    }
}
