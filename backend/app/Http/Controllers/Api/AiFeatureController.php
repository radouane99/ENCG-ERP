<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AI\AiTutorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiFeatureController extends Controller
{
    public function __construct(
        private AiTutorService $tutorService
    ) {}

    /**
     * Tuteur IA : poser une question sur un module.
     */
    public function tutor(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|integer|exists:modules,id',
            'group_id' => 'nullable|integer',
            'question' => 'required|string|max:1000',
        ]);

        $result = $this->tutorService->askTutor(
            $validated['module_id'],
            $validated['question']
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }
}
