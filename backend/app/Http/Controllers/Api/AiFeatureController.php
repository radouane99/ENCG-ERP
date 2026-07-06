<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\AI\AiTutorService;

class AiFeatureController extends Controller
{
    protected AiTutorService $tutorService;

    public function __construct(AiTutorService $tutorService)
    {
        $this->tutorService = $tutorService;
    }

    /**
     * Ask the AI Tutor a question based on module PDF content
     */
    public function tutor(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|integer|exists:modules,id',
            'group_id' => 'nullable|integer', // According to diagram but might not be strictly needed for PDF fetching
            'question' => 'required|string|max:1000',
        ]);

        $result = $this->tutorService->askTutor(
            $validated['module_id'],
            $validated['question']
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }
}
