<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Services\Analytics\DashboardAnalyticsService;

class PilotageController extends Controller
{
    protected DashboardAnalyticsService $analyticsService;

    public function __construct(DashboardAnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    public function getGlobalMetrics(): JsonResponse
    {
        $result = $this->analyticsService->getGlobalMetrics();
        return response()->json($result['data']);
    }
}
