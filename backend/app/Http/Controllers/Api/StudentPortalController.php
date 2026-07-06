<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\StudentPortalService;

class StudentPortalController extends Controller
{
    protected StudentPortalService $portalService;

    public function __construct(StudentPortalService $portalService)
    {
        $this->portalService = $portalService;
    }

    /**
     * Get validated and published grades for the student
     */
    public function getGrades(Request $request): JsonResponse
    {
        // In a real app: $studentId = $request->user()->student->id;
        $studentId = $request->input('student_id', 1);

        $grades = $this->portalService->getGrades($studentId);

        return response()->json(['success' => true, 'data' => $grades]);
    }

    /**
     * Submit a medical certificate for an absence
     */
    public function submitAbsence(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|integer',
            'attendance_id' => 'required|integer',
            'reason' => 'required|string',
            'description' => 'nullable|string',
            // 'document' => 'nullable|file|mimes:pdf,jpg,png'
        ]);

        $result = $this->portalService->submitAbsenceJustification(
            $validated, 
            $request->file('document')
        );

        return response()->json($result);
    }

    /**
     * Get student schedule
     */
    public function getSchedule(Request $request): JsonResponse
    {
        $studentId = $request->input('student_id', 1);

        $schedule = $this->portalService->getSchedule($studentId);

        return response()->json(['success' => true, 'data' => $schedule]);
    }

    /**
     * Get dashboard stats for the student
     */
    public function getDashboardStats(Request $request): JsonResponse
    {
        // In a real app: $studentId = $request->user()->student->id;
        $studentId = $request->input('student_id', 1);

        $stats = $this->portalService->getDashboardStats($studentId);

        return response()->json(['success' => true, 'data' => $stats]);
    }
}
