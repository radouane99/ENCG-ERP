<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Services\StudentService;
use App\Http\Resources\StudentResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StudentController extends Controller
{
    protected StudentService $studentService;

    public function __construct(StudentService $studentService)
    {
        $this->studentService = $studentService;
    }

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('students.view'), 403);

        $perPage  = min((int) $request->input('per_page', 20), 100);
        $sortField = $request->input('sort', 'last_name');
        $sortOrder = $request->input('order', 'asc');

        $paginated = $this->studentService->getPaginatedStudents(
            $request->only(['search', 'status', 'filiere_id', 'semester', 'group_id']),
            $perPage,
            $sortField,
            $sortOrder
        );

        // [Phase 8] Return StudentResource collection — frontend already expects response.data
        return response()->json([
            'data' => StudentResource::collection($paginated->getCollection()),
            'meta' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

    public function store(\App\Http\Requests\Student\StoreStudentRequest $request, \App\Actions\Student\CreateStudentAction $action): JsonResponse
    {
        // [AUDIT FE-03] Authorization guard was missing from store()
        abort_unless($request->user()->can('students.create'), 403);

        try {
            $student = $action->execute($request->validated());

            return response()->json([
                'message' => 'Étudiant créé avec succès.',
                // [Phase 8] Wrap in Resource
                'data'    => new StudentResource($student->load(['latestPathway.filiere', 'user'])),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de l\'étudiant.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Student $student): JsonResponse
    {
        abort_unless(request()->user()->can('students.view'), 403);

        // [Phase 8] Wrap in StudentResource — also adds eager-loaded user to prevent N+1
        return response()->json([
            'data' => new StudentResource($student->load(['latestPathway.filiere', 'user'])),
        ]);
    }

    public function update(\App\Http\Requests\Student\UpdateStudentRequest $request, Student $student, \App\Actions\Student\UpdateStudentAction $action): JsonResponse
    {
        try {
            $updated = $action->execute($student, $request->validated());

            return response()->json([
                'message' => 'Étudiant mis à jour avec succès.',
                // [Phase 8] Wrap in Resource
                'data'    => new StudentResource($updated->load(['latestPathway.filiere', 'user'])),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de l\'étudiant.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Student $student, \App\Actions\Student\DeleteStudentAction $action): JsonResponse
    {
        abort_unless(request()->user()->can('students.delete'), 403);

        try {
            $action->execute($student);

            return response()->json(['message' => 'Étudiant supprimé avec succès.']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de l\'étudiant.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
