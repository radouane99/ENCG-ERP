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
        return response()->json([
            'success' => true,
            'data' => [
                'gpa'                 => 0,
                'attendance'          => 0,
                'upcoming_exams'      => 0,
                'pending_assignments' => 0
            ]
        ]);
    }

    public function getProfessorStats(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_students' => 0,
                'total_modules'  => 0,
                'pending_grades' => 0,
                'next_class'     => null
            ]
        ]);
    }
}
