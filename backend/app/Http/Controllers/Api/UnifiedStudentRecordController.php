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
    public function show(Request $request, Student|string|int $student): JsonResponse
    {
        $user = $request->user();

        $isAuthorized = ($user && method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['admin', 'super-admin', 'institution-admin', 'professor']))
            || ($user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('professor')))
            || in_array($user?->role, ['admin', 'professor']);

        abort_unless($isAuthorized, 403, 'Accès non autorisé.');

        $studentModel = $student instanceof Student
            ? $student
            : (is_numeric($student)
                ? Student::where('id', (int) $student)->firstOrFail()
                : (\Illuminate\Support\Str::isUuid((string) $student)
                    ? Student::where('uuid', (string) $student)->firstOrFail()
                    : Student::where('student_number', (string) $student)->firstOrFail()
                  )
              );

        return $this->buildDossierResponse($studentModel, $request, $user && method_exists($user, 'hasRole') && $user->hasRole('professor'));
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
            'grades' => function ($q) {
                $q->with('assessment.module');
            },
            'attendances' => function ($q) {
                $q->with('attendanceSession.module');
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