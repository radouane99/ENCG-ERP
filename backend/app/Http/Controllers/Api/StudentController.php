<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Services\StudentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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

        $perPage = min((int) $request->input('per_page', 20), 100);
        $sortField = $request->input('sort', 'last_name');
        $sortOrder = $request->input('order', 'asc');

        $paginated = $this->studentService->getPaginatedStudents(
            $request->only(['search', 'status']),
            $perPage,
            $sortField,
            $sortOrder
        );

        $students = $this->studentService->mapStudentCollection($paginated);

        return response()->json([
            'data' => $students,
            'meta' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ]
        ]);
    }

    public function store(\App\Http\Requests\Student\StoreStudentRequest $request, \App\Actions\Student\CreateStudentAction $action): JsonResponse
    {
        try {
            $student = $action->execute($request->validated());

            return response()->json([
                'message' => 'Étudiant créé avec succès.',
                'data' => $student
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de l\'étudiant.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Student $student): JsonResponse
    {
        abort_unless(request()->user()->can('students.view'), 403);

        return response()->json(['data' => $student->load('latestPathway.filiere')]);
    }

    public function update(\App\Http\Requests\Student\UpdateStudentRequest $request, Student $student, \App\Actions\Student\UpdateStudentAction $action): JsonResponse
    {
        try {
            $student = $action->execute($student, $request->validated());

            return response()->json([
                'message' => 'Étudiant mis à jour avec succès.',
                'data' => $student
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de l\'étudiant.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Student $student, \App\Actions\Student\DeleteStudentAction $action): JsonResponse
    {
        abort_unless(request()->user()->can('students.delete'), 403);

        try {
            $action->execute($student);

            return response()->json([
                'message' => 'Étudiant supprimé avec succès.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de l\'étudiant.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
