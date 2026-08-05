<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Services\Analytics\PredictiveAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function __construct(
        private PredictiveAnalyticsService $analyticsService
    ) {}

    /**
     * Étudiants à risque de décrochage.
     */
    public function getAtRiskStudents(Request $request): JsonResponse
    {
        $academicYear = AcademicYear::where('is_current', true)->first();
        if (!$academicYear) {
            return response()->json(['success' => false, 'message' => 'Aucune année académique en cours.'], 404);
        }

        $user = $request->user();
        if (!$user?->institution_id) {
            return response()->json(['success' => false, 'message' => 'Institution non définie.'], 400);
        }

        try {
            $data = $this->analyticsService->getAtRiskStudents($user->institution_id, $academicYear->id);

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}