<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\AlumniService;

class AlumniController extends Controller
{
    protected AlumniService $alumniService;

    public function __construct(AlumniService $alumniService)
    {
        $this->alumniService = $alumniService;
    }

    /**
     * Get Alumni Dashboard Statistics.
     */
    public function getDashboardStats(): JsonResponse
    {
        $stats = $this->alumniService->getDashboardStats();
        
        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get the Alumni Directory list.
     */
    public function index(Request $request): JsonResponse
    {
        $directory = $this->alumniService->getAlumniDirectory($request->all());

        return response()->json([
            'success' => true,
            'data' => $directory
        ]);
    }
}
