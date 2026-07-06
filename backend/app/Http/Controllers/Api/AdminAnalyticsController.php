<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AdminAnalyticsService;
use Illuminate\Http\JsonResponse;

class AdminAnalyticsController extends Controller
{
    public function __construct(
        protected AdminAnalyticsService $analyticsService
    ) {}

    public function index(): JsonResponse
    {
        try {
            $data = $this->analyticsService->getDashboardMetrics();
            return response()->json(['data' => $data]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching analytics data.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
