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
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching analytics data.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
