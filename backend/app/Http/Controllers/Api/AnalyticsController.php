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
        // Fetch actual academic year dynamically
        $academicYear = \App\Models\AcademicYear::where('is_current', true)->first();
        if (!$academicYear) {
            return response()->json(['success' => false, 'message' => 'Aucune année académique en cours'], 404);
        }

        $institutionId = $request->user()->institution_id ?? 1; // Assuming multi-tenant, fallback to 1
        $academicYearId = $academicYear->id;

        try {
            $data = $this->analyticsService->getAtRiskStudents($institutionId, $academicYearId);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
