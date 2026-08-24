<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Academic\AlumniService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlumniController extends Controller
{
    public function __construct(
        private AlumniService $alumniService
    ) {}

    /**
     * Statistiques du tableau de bord Alumni.
     */
    public function getDashboardStats(): JsonResponse
    {
        $stats = $this->alumniService->getDashboardStats();

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Annuaire des Alumni.
     */
    public function index(Request $request): JsonResponse
    {
        $directory = $this->alumniService->getAlumniDirectory($request->all());

        return response()->json([
            'success' => true,
            'data' => $directory,
        ]);
    }
}
