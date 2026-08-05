<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Services\AdminAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class AdminAnalyticsController extends Controller
{
    public function __construct(
        private AdminAnalyticsService $analyticsService
    ) {}

    /**
     * Tableau de bord analytique administrateur.
     */
    public function index(): JsonResponse
    {
        try {
            $documentStats = $this->analyticsService->getDocumentRequestStats();
            $projectStats  = $this->analyticsService->getAcademicProjectStats();
            $studentStats  = $this->analyticsService->getStudentActivityStats();

            return response()->json([
                'success' => true,
                'data'    => [
                    'document_requests' => $documentStats,
                    'academic_projects' => $projectStats,
                    'student_activity'  => $studentStats,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Analytics API Error: ' . $e->getMessage());

            $studentsCount = Student::count();

            return response()->json([
                'success' => true,
                'data'    => [
                    'document_requests' => [
                        'total'            => 0,
                        'pending_count'    => 0,
                        'status_breakdown' => [],
                        'monthly_trend'    => [],
                    ],
                    'academic_projects' => [
                        'total'              => 0,
                        'active_count'       => 0,
                        'completion_rate'    => 0,
                        'type_distribution'  => [],
                    ],
                    'student_activity' => [
                        'total_active'      => $studentsCount,
                        'filiere_breakdown' => [],
                    ],
                ],
            ]);
        }
    }
}