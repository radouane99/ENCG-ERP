<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Analytics\PredictiveAnalyticsService;

class AnalyticsController extends Controller
{
    protected PredictiveAnalyticsService $analyticsService;

    public function __construct(PredictiveAnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Get the At-Risk Students Dashboard Data
     */
    public function getAtRiskStudents(Request $request): JsonResponse
    {
        // Mocking institution_id and academic_year_id for demo
        $institutionId = $request->input('institution_id', 1);
        $academicYearId = $request->input('academic_year_id', 1);

        try {
            $data = $this->analyticsService->getAtRiskStudents($institutionId, $academicYearId);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
