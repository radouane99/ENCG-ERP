<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Academic\SmartSchedulingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmartSchedulingController extends Controller
{
    public function __construct(
        private SmartSchedulingService $schedulingService
    ) {}

    /**
     * Génération automatique de l'emploi du temps.
     */
    public function autoGenerate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'semester_id' => 'required|integer|exists:semesters,id',
            'filiere_id'  => 'required|integer|exists:filieres,id',
        ]);

        $result = $this->schedulingService->generate(
            $validated['semester_id'],
            $validated['filiere_id']
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }
}