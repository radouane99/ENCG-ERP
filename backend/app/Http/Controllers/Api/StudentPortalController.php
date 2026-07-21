<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\SubmitAbsenceRequest;
use App\Services\Academic\StudentPortalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentPortalController extends Controller
{
    public function __construct(protected StudentPortalService $portalService)
    {
    }

    public function getGrades(Request $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);
        $grades = $this->portalService->getGrades($studentId);

        return response()->json(['success' => true, 'data' => $grades]);
    }

    public function submitAbsence(SubmitAbsenceRequest $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);
        $result = $this->portalService->submitAbsenceJustification(
            $request->validated(),
            $request->file('document'),
            $studentId
        );

        return response()->json($result, 201);
    }

    public function submitAbsenceJustification(SubmitAbsenceRequest $request): JsonResponse
    {
        return $this->submitAbsence($request);
    }

    public function getSchedule(Request $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);
        $schedule = $this->portalService->getSchedule($studentId);

        return response()->json(['success' => true, 'data' => $schedule]);
    }

    public function getDashboardStats(Request $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);
        $stats = $this->portalService->getDashboardStats($studentId);

        return response()->json(['success' => true, 'data' => $stats]);
    }

    public function getLibraryMaterials(Request $request): JsonResponse
    {
        $this->resolveAuthenticatedStudentId($request);

        $materials = \App\Models\LearningMaterial::where('is_published', true)
            ->with(['module', 'professor'])
            ->latest()
            ->take(20)
            ->get();

        return response()->json(['success' => true, 'data' => $materials]);
    }

    private function resolveAuthenticatedStudentId(Request $request): int
    {
        $student = $request->user()?->student;

        abort_unless($student, 403, 'Profil étudiant introuvable.');

        return $student->id;
    }
}
