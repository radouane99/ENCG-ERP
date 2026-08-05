<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Services\Academic\StudentPortalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MobileStudentController extends Controller
{
    public function __construct(
        private StudentPortalService $portalService
    ) {}

    /**
     * Profil et statistiques de l'étudiant.
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->hasRole('student')) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé.'], 403);
        }

        $student = $user->student;
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 404);
        }

        $stats = $this->portalService->getDashboardStats($student->id);

        return response()->json([
            'success' => true,
            'data'    => $stats,
        ]);
    }

    /**
     * Emploi du temps de l'étudiant.
     */
    public function schedule(Request $request): JsonResponse
    {
        $student = $request->user()?->student;
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 403);
        }

        $schedule = $this->portalService->getSchedule($student->id);

        return response()->json([
            'success' => true,
            'data'    => $schedule,
        ]);
    }

    /**
     * Notes de l'étudiant.
     */
    public function grades(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasRole('student') || !$user->student) {
            return response()->json(['success' => false, 'message' => 'Non autorisé.'], 403);
        }

        $grades = $this->portalService->getGrades($user->student->id);

        return response()->json([
            'success' => true,
            'data'    => $grades,
        ]);
    }
}