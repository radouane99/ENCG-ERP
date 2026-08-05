<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\SubmitAbsenceRequest;
use App\Models\LearningMaterial;
use App\Services\Academic\StudentPortalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentPortalController extends Controller
{
    public function __construct(
        private StudentPortalService $portalService
    ) {}

    /**
     * Notes de l'étudiant connecté.
     */
    public function getGrades(Request $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);

        return response()->json([
            'success' => true,
            'data'    => $this->portalService->getGrades($studentId),
        ]);
    }

    /**
     * Tableau de bord étudiant.
     */
    public function getDashboardStats(Request $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);

        return response()->json([
            'success' => true,
            'data'    => $this->portalService->getDashboardStats($studentId),
        ]);
    }

    /**
     * Emploi du temps de l'étudiant connecté.
     */
    public function getSchedule(Request $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);

        return response()->json([
            'success' => true,
            'data'    => $this->portalService->getSchedule($studentId),
        ]);
    }

    /**
     * Justifier une absence.
     */
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

    /**
     * Ressources de la bibliothèque numérique.
     */
    public function getLibraryMaterials(Request $request): JsonResponse
    {
        $this->resolveAuthenticatedStudentId($request);

        $materials = LearningMaterial::where('is_published', true)
            ->with(['module', 'professor'])
            ->latest()
            ->take(20)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $materials,
        ]);
    }

    /**
     * Résout l'ID de l'étudiant authentifié.
     */
    private function resolveAuthenticatedStudentId(Request $request): int
    {
        $student = $request->user()?->student;

        abort_unless($student, 403, 'Profil étudiant introuvable.');

        return $student->id;
    }
}