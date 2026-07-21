<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Services\Academic\StudentPortalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MobileStudentController extends Controller
{
    public function __construct(protected StudentPortalService $portalService)
    {
    }

    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasRole('student')) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        $student = $user->student;
        if (! $student) {
            return response()->json(['error' => 'Profil étudiant introuvable'], 404);
        }

        $stats = $this->portalService->getDashboardStats($student->id);

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    public function schedule(Request $request): JsonResponse
    {
        $student = $request->user()?->student;
        if (! $student) {
            return response()->json(['error' => 'Profil étudiant introuvable'], 403);
        }

        $schedule = $this->portalService->getSchedule($student->id);

        return response()->json([
            'success' => true,
            'data' => $schedule,
        ]);
    }

    public function grades(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->hasRole('student') || ! $user->student) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $grades = $this->portalService->getGrades($user->student->id);

        return response()->json([
            'success' => true,
            'data' => $grades,
        ]);
    }
}
