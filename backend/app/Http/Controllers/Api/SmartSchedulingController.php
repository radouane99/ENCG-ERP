<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\SmartSchedulingService;

class SmartSchedulingController extends Controller
{
    protected SmartSchedulingService $schedulingService;

    public function __construct(SmartSchedulingService $schedulingService)
    {
        $this->schedulingService = $schedulingService;
    }

    /**
     * Auto generate schedule based on semester and filiere
     */
    public function autoGenerate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'semester_id' => 'required|integer|exists:semesters,id',
            'filiere_id' => 'required|integer|exists:filieres,id',
        ]);

        $result = $this->schedulingService->generate(
            $validated['semester_id'], 
            $validated['filiere_id']
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }
}
