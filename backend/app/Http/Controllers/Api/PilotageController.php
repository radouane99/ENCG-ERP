<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Analytics\DashboardAnalyticsService;
use Illuminate\Http\JsonResponse;

class PilotageController extends Controller
{
    public function __construct(
        private DashboardAnalyticsService $analyticsService
    ) {}

    /**
     * Métriques globales de pilotage.
     */
    public function getGlobalMetrics(): JsonResponse
    {
        $result = $this->analyticsService->getGlobalMetrics();

        return response()->json([
            'success' => true,
            'data'    => $result['data'] ?? $result,
        ]);
    }
}