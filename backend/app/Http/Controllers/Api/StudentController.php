<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Filiere;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('students.view'), 403);

        $query = Student::with(['pathways' => function ($q) {
            $q->with('filiere')->latest()->limit(1);
        }]);

        // Search
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%$search%")
                  ->orWhere('last_name', 'like', "%$search%")
                  ->orWhere('student_number', 'like', "%$search%")
                  ->orWhere('cne', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%");
            });
        }

        // Status filter
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // Sort
        $sortField = in_array($request->sort, ['last_name', 'student_number', 'created_at'])
            ? $request->sort : 'last_name';
        $sortOrder = $request->order === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortField, $sortOrder);

        $perPage = min((int) $request->input('per_page', 20), 100);
        $paginated = $query->paginate($perPage);

        $students = $paginated->getCollection()->map(function ($student) {
            $latestPathway = $student->pathways->first();
            return [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'cne' => $student->cne,
                'massar_code' => $student->massar_code,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'email' => $student->email,
                'phone' => $student->phone,
                'gender' => $student->gender,
                'birth_date' => $student->birth_date,
                'status' => $student->status ?? 'active',
                'scholarship_type' => $student->scholarship_type,
                'current_filiere' => $latestPathway?->filiere?->code,
                'current_semester' => $latestPathway?->current_semester,
                'current_group' => null, // Phase 2 groups
            ];
        });

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

        // Auto-generate student number
        $year = date('Y');
        $count = Student::whereYear('created_at', $year)->count() + 1;
        $validated['student_number'] = $year . str_pad($count, 4, '0', STR_PAD_LEFT);
        $validated['institution_id'] = 1;

        $student = Student::create($validated);

        return response()->json([
            'message' => 'Étudiant créé avec succès.',
            'data' => $student
        ], 201);
    }

    public function show(Student $student): JsonResponse
    {
        abort_unless(request()->user()->can('students.view'), 403);

        return response()->json(['data' => $student->load('pathways.filiere')]);
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

        $student->update($validated);

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
