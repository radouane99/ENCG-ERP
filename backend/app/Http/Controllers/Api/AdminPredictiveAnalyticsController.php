<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Core\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AdminPredictiveAnalyticsController extends Controller
{
    public function __construct(private AiService $aiService) {}

    /**
     * GET /api/admin/predictive-analytics
     * Returns real dropout-risk scores + AI narrative, cached for 15 min.
     */
    public function index(Request $request): JsonResponse
    {
        $data = Cache::remember('admin_predictive_analytics', 900, function () {
            return $this->aiService->getPredictiveAnalytics();
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * POST /api/admin/predictive-analytics/refresh
     * Force-refresh (invalidate cache) and re-compute.
     */
    public function refresh(): JsonResponse
    {
        Cache::forget('admin_predictive_analytics');
        $data = $this->aiService->getPredictiveAnalytics();
        Cache::put('admin_predictive_analytics', $data, 900);

        return response()->json(['success' => true, 'data' => $data]);
    }
}
