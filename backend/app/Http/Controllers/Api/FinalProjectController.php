<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\CareerService;

class FinalProjectController extends Controller
{
    protected CareerService $careerService;

    public function __construct(CareerService $careerService)
    {
        $this->careerService = $careerService;
    }

    /**
     * Display a listing of the final projects.
     */
    public function index(): JsonResponse
    {
        $projects = $this->careerService->getAllFinalProjects();
        
        return response()->json([
            'success' => true,
            'data' => $projects
        ]);
    }

    /**
     * Schedule or update the defense of a project.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'defense_date' => 'required|date',
            'room_id'      => 'nullable|integer|exists:rooms,id',
        ]);

        $project = $this->careerService->scheduleDefense((int) $id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Soutenance planifiée avec succès.',
            'data' => $project
        ]);
    }
}
