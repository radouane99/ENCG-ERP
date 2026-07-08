<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\StudentPortalService;

class MobileStudentController extends Controller
{
    protected StudentPortalService $portalService;

    public function __construct(StudentPortalService $portalService)
    {
        $this->portalService = $portalService;
    }

    /**
     * Get the student's dashboard profile overview for the mobile app
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Ensure user is actually a student
        if (!$user->hasRole('student')) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        $student = $user->student;

        if (!$student) {
            return response()->json(['error' => 'Profil étudiant introuvable'], 404);
        }

        $studentId = $student->id;
        $stats = $this->portalService->getDashboardStats($studentId);

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get the student's schedule for today/week for the mobile app
     */
    public function schedule(Request $request): JsonResponse
    {
        $studentId = $request->user()->student->id ?? 1;
        $schedule = $this->portalService->getSchedule($studentId);

        return response()->json([
            'success' => true,
            'data' => $schedule
        ]);
    }

    /**
     * Get the student's recent grades
     */
    public function grades(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasRole('student') || !$user->student) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $studentId = $user->student->id;
        
        $grades = $this->portalService->getGrades($studentId);

        return response()->json([
            'success' => true,
            'data' => $grades
        ]);
    }
}
