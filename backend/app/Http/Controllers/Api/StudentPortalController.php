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
    public function submitAbsence(\App\Http\Requests\Academic\SubmitAbsenceRequest $request): JsonResponse
    {
        $validated = $request->validated();

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

    /**
     * Get learning materials (Digital Library)
     */
    public function getLibraryMaterials(Request $request): JsonResponse
    {
        // For now, fetch published materials with related module and professor
        $materials = \App\Models\LearningMaterial::where('is_published', true)
            ->with(['module', 'professor'])
            ->latest()
            ->take(20)
            ->get();

        return response()->json(['success' => true, 'data' => $materials]);
    }
}
