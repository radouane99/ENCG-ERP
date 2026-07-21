<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Analytics\DashboardAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(protected DashboardAnalyticsService $analyticsService)
    {
    }

    public function getStats(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasAnyRole(['super-admin', 'institution-admin', 'director', 'department-head'])) {
            return response()->json($this->analyticsService->getAdminStats());
        }

        if ($user->hasAnyRole(['professor', 'vacataire'])) {
            $result = $this->analyticsService->getProfessorStats($user->id);

            return response()->json($result, isset($result['success']) && ! $result['success'] ? 404 : 200);
        }

        $result = $this->analyticsService->getStudentStats($user->id);

        return response()->json($result, isset($result['success']) && ! $result['success'] ? 404 : 200);
    }

    public function getAdminStats(Request $request): JsonResponse
    {
        return response()->json($this->analyticsService->getAdminStats());
    }

    public function getExecutiveStats(Request $request): JsonResponse
    {
        return response()->json($this->analyticsService->getGlobalMetrics());
    }

    public function getStudentStats(Request $request): JsonResponse
    {
        $result = $this->analyticsService->getStudentStats($request->user()->id);

        return response()->json($result, isset($result['success']) && ! $result['success'] ? 404 : 200);
    }

    public function getProfessorStats(Request $request): JsonResponse
    {
        $result = $this->analyticsService->getProfessorStats($request->user()->id);

        return response()->json($result, isset($result['success']) && ! $result['success'] ? 404 : 200);
    }
}
