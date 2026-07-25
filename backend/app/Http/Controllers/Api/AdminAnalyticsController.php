<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AdminAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AdminAnalyticsController extends Controller
{
    public function __construct(
        protected AdminAnalyticsService $analyticsService
    ) {}

    public function index(): JsonResponse
    {
        try {
            // Force clear old cached analytics so real DB data is immediately fetched
            Cache::forget('admin.analytics.document_requests');
            Cache::forget('admin.analytics.academic_projects');
            Cache::forget('admin.analytics.student_activity');

            $documentStats = $this->analyticsService->getDocumentRequestStats();
            $projectStats = $this->analyticsService->getAcademicProjectStats();
            $studentStats = $this->analyticsService->getStudentActivityStats();

            return response()->json([
                'success' => true,
                'data' => [
                    'document_requests' => $documentStats,
                    'academic_projects' => $projectStats,
                    'student_activity' => $studentStats,
                ]
            ]);
        } catch (\Throwable $e) {
            Log::error("Analytics API Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching analytics data.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
