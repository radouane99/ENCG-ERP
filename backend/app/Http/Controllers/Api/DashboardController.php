<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Analytics\DashboardAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardAnalyticsService $analyticsService
    ) {}

    /**
     * Statistiques selon le rôle.
     */
    public function getStats(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasAnyRole(['super-admin', 'institution-admin', 'director', 'department-head', 'filiere-head'])) {
            return response()->json($this->analyticsService->getAdminStats());
        }

        if ($user->hasAnyRole(['professor', 'vacataire'])) {
            return response()->json($this->analyticsService->getProfessorStats($user->id));
        }

        return response()->json($this->analyticsService->getStudentStats($user->id));
    }

    /**
     * Stats admin.
     */
    public function getAdminStats(): JsonResponse
    {
        return response()->json($this->analyticsService->getAdminStats());
    }

    /**
     * Stats direction.
     */
    public function getExecutiveStats(): JsonResponse
    {
        return response()->json($this->analyticsService->getGlobalMetrics());
    }

    /**
     * Stats étudiant.
     */
    public function getStudentStats(Request $request): JsonResponse
    {
        return response()->json($this->analyticsService->getStudentStats($request->user()->id));
    }

    /**
     * Stats professeur.
     */
    public function getProfessorStats(Request $request): JsonResponse
    {
        return response()->json($this->analyticsService->getProfessorStats($request->user()->id));
    }
}