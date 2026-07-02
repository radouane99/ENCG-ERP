<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\CareerService;

class InternshipController extends Controller
{
    protected CareerService $careerService;

    public function __construct(CareerService $careerService)
    {
        $this->careerService = $careerService;
    }

    /**
     * Display a listing of the internships.
     */
    public function index(): JsonResponse
    {
        $internships = $this->careerService->getAllInternships();
        
        return response()->json([
            'success' => true,
            'data' => $internships
        ]);
    }

    /**
     * Validate the specified internship.
     */
    public function update(Request $request, $id): JsonResponse
    {
        // Simple update wrapper (e.g. status validation)
        if ($request->input('action') === 'validate') {
            $internship = $this->careerService->validateInternship((int) $id);
            return response()->json(['success' => true, 'data' => $internship]);
        }

        if ($request->has('supervisor_id')) {
            $internship = $this->careerService->assignSupervisor((int) $id, $request->supervisor_id);
            return response()->json(['success' => true, 'data' => $internship]);
        }

        return response()->json(['success' => false, 'message' => 'Action non supportée.'], 400);
    }
}
