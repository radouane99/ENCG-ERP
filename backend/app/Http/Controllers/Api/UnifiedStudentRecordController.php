<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Http\Resources\UnifiedStudentRecordResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class UnifiedStudentRecordController extends Controller
{
    /**
     * Display the unified dossier for the currently authenticated student.
     */
    public function myDossier(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = Student::where('user_id', $user->id)->firstOrFail();

        return $this->buildDossierResponse($student, $request);
    }

    /**
     * Display the unified dossier for a specific student (for admins/professors).
     */
    public function show(Request $request, Student $student): JsonResponse
    {
        $user = $request->user();
        
        $isAdmin = (method_exists($user, 'hasRole') && $user->hasRole('admin')) || $user->role === 'admin';
        $isProf = (method_exists($user, 'hasRole') && $user->hasRole('professor')) || $user->role === 'professor';

        if (!$isAdmin && !$isProf) {
            abort(403, 'Unauthorized action. Only admins or professors can access this.');
        }

        return $this->buildDossierResponse($student, $request, $isProf);
    }

    /**
     * Build the eager-loaded dossier response.
     */
    private function buildDossierResponse(Student $student, Request $request, bool $isProfessor = false): JsonResponse
    {
        $year = $request->input('year');

        $query = $student->newQuery()
            ->with(['user', 'latestPathway.filiere', 'latestPathway.group']);

        $query->with([
            'grades' => function ($q) use ($isProfessor, $request, $year) {
                if ($year) {
                    $q->whereHas('assessment.module', function($query) use ($year) {
                        $query->where('academic_year_id', $year); // Ensure this field exists or adapt logic
                    });
                }
                $q->with('assessment.module');
            },
            'attendances' => function ($q) use ($isProfessor, $request) {
                // Future enhancement: apply isProfessor filter to attendances here
                $q->with('attendanceSession.module', 'absenceJustification');
            },
            'documentRequests' => function ($q) {
                $q->with('documentType');
            },
            'internships'
        ]);

        $loadedStudent = $query->findOrFail($student->id);

        return response()->json([
            'data' => new UnifiedStudentRecordResource($loadedStudent)
        ]);
    }
}
