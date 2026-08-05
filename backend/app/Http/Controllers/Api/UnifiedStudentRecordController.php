<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UnifiedStudentRecordResource;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UnifiedStudentRecordController extends Controller
{
    /**
     * Dossier de l'étudiant connecté.
     */
    public function myDossier(Request $request): JsonResponse
    {
        $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        return $this->buildDossierResponse($student, $request);
    }

    /**
     * Dossier d'un étudiant spécifique (admin/professeur).
     */
    public function show(Request $request, Student $student): JsonResponse
    {
        $user = $request->user();

        $isAuthorized = $user->hasRole(['admin', 'professor']) || in_array($user->role, ['admin', 'professor']);

        abort_unless($isAuthorized, 403, 'Accès non autorisé.');

        return $this->buildDossierResponse($student, $request, $user->hasRole('professor'));
    }

    /**
     * Construit la réponse dossier avec eager loading.
     */
    private function buildDossierResponse(Student $student, Request $request, bool $isProfessor = false): JsonResponse
    {
        $year = $request->input('year');

        $query = Student::with([
            'user',
            'latestPathway.filiere',
            'latestPathway.group',
            'grades' => function ($q) use ($year) {
                if ($year) {
                    $q->whereHas('assessment.module', fn($query) => $query->where('academic_year_id', $year));
                }
                $q->with('assessment.module');
            },
            'attendances' => function ($q) {
                $q->with('attendanceSession.module', 'absenceJustification');
            },
            'documentRequests' => function ($q) {
                $q->with('documentType');
            },
            'internships',
        ]);

        $loadedStudent = $query->findOrFail($student->id);

        return response()->json([
            'success' => true,
            'data'    => new UnifiedStudentRecordResource($loadedStudent),
        ]);
    }
}