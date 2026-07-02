<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Analytics\DashboardAnalyticsService;

class DashboardController extends Controller
{
    protected DashboardAnalyticsService $analyticsService;

    public function __construct(DashboardAnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Get real statistics for the Administration Dashboard.
     */
    public function getAdminStats(Request $request): JsonResponse
    {
        $result = $this->analyticsService->getAdminStats();
        return response()->json($result);
    }

    public function getExecutiveStats(Request $request): JsonResponse
    {
        // For demonstration, returning the global metrics since it has similar KPIs
        $result = $this->analyticsService->getGlobalMetrics();
        return response()->json($result);
    }

    public function getStudentStats(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $result = $this->analyticsService->getStudentStats($userId);
        
        if (isset($result['success']) && !$result['success']) {
            return response()->json($result, 404);
        }
        
        return response()->json($result);
    }

    public function getProfessorStats(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $result = $this->analyticsService->getProfessorStats($userId);
        
        if (isset($result['success']) && !$result['success']) {
            return response()->json($result, 404);
        }
        
        return response()->json($result);
    }
}
