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

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('students.create'), 403);

        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'email'      => 'required|email|unique:students,email',
            'cne'        => 'required|string|max:20|unique:students,cne',
            'massar_code'=> 'nullable|string|max:30',
            'phone'      => 'nullable|string|max:20',
            'gender'     => 'required|in:male,female',
            'birth_date' => 'nullable|date',
            'status'     => 'required|in:active,suspended,graduated,withdrawn',
            'scholarship_type' => 'nullable|string|max:50',
        ]);

        $student = $this->studentService->createStudent($validated, 1); // Default institution_id

        return response()->json([
            'message' => 'Étudiant créé avec succès.',
            'data' => $student
        ], 201);
    }

    public function show(Student $student): JsonResponse
    {
        abort_unless(request()->user()->can('students.view'), 403);

        return response()->json(['data' => $student->load('latestPathway.filiere')]);
    }

    public function update(Request $request, Student $student): JsonResponse
    {
        abort_unless($request->user()->can('students.edit'), 403);

        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:100',
            'last_name'  => 'sometimes|required|string|max:100',
            'email'      => 'sometimes|required|email|unique:students,email,' . $student->id,
            'cne'        => 'sometimes|required|string|max:20|unique:students,cne,' . $student->id,
            'massar_code'=> 'nullable|string|max:30',
            'phone'      => 'nullable|string|max:20',
            'gender'     => 'sometimes|required|in:male,female',
            'birth_date' => 'nullable|date',
            'status'     => 'sometimes|required|in:active,suspended,graduated,withdrawn',
            'scholarship_type' => 'nullable|string|max:50',
        ]);

        $student = $this->studentService->updateStudent($student, $validated);

        return response()->json([
            'message' => 'Étudiant mis à jour avec succès.',
            'data' => $student
        ]);
    }

    public function destroy(Student $student): JsonResponse
    {
        abort_unless(request()->user()->can('students.delete'), 403);

        $student->delete(); // Uses SoftDelete

        return response()->json([
            'message' => 'Étudiant supprimé avec succès.'
        ]);
    }
}
