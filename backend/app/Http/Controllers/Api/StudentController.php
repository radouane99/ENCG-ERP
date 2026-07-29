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

        try {
            $paginated = $this->studentService->getPaginatedStudents(
                $request->only(['search', 'status', 'filiere_id', 'semester', 'group_id']),
                $perPage,
                $sortField,
                $sortOrder
            );

            return response()->json([
                'data' => StudentResource::collection($paginated->getCollection()),
                'meta' => [
                    'total'        => $paginated->total(),
                    'per_page'     => $paginated->perPage(),
                    'current_page' => $paginated->currentPage(),
                    'last_page'    => $paginated->lastPage(),
                ],
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Erreur StudentController index: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Erreur serveur: ' . $e->getMessage(),
                'file' => basename($e->getFile()),
                'line' => $e->getLine()
            ], 500);
        }
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

    public function getDocuments(Student $student): JsonResponse
    {
        $documents = \Illuminate\Support\Facades\DB::table('student_documents')
            ->where('student_id', $student->id)
            ->get();

        return response()->json([
            'data' => $documents
        ]);
    }

    public function uploadDocument(Request $request, Student $student): JsonResponse
    {
        $request->validate([
            'type' => 'required|string',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $file = $request->file('file');
        $type = $request->input('type');
        
        $path = $file->store("student_documents/{$student->id}", 'public');
        $fileUrl = "/storage/" . $path;

        \Illuminate\Support\Facades\DB::table('student_documents')->updateOrInsert(
            ['student_id' => $student->id, 'type' => $type],
            [
                'file_path' => $fileUrl,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
                'status' => 'verified',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Document numérisé enregistré avec succès.',
            'file_path' => $fileUrl,
            'type' => $type
        ]);
    }

    /**
     * Export Excel/CSV File for USMBA Academic Account Creation.
     */
    public function exportUsmbaAcademicAccountsCsv(Request $request)
    {
        $students = \App\Domain\Student\Models\Student::with(['user', 'latestPathway.filiere'])->take(500)->get();

        $filename = 'Export_Comptes_Academiques_USMBA_' . date('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($students) {
            $file = fopen('php://output', 'w');
            // Add UTF-8 BOM for Excel compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // CSV Header Row matching USMBA schema
            fputcsv($file, [
                'ID Etudiant',
                'CNE / Code Massar',
                'CNIE',
                'Nom',
                'Prénom',
                'Année Inscription',
                'Filière',
                'Email Personnel (Gmail)',
                'Email Académique Suggéré (@usmba.ac.ma)'
            ]);

            foreach ($students as $student) {
                $firstName = $student->first_name;
                $lastName = $student->last_name;
                $cleanFirst = strtolower(preg_replace('/[^a-zA-Z]/', '', $firstName));
                $cleanLast = strtolower(preg_replace('/[^a-zA-Z]/', '', $lastName));
                $academicEmail = "{$cleanFirst}.{$cleanLast}@usmba.ac.ma";

                fputcsv($file, [
                    $student->id,
                    $student->cne ?? 'M145092428',
                    $student->cin ?? 'UB121643',
                    strtoupper($lastName),
                    ucfirst($firstName),
                    '2026-2027',
                    $student->latestPathway?->filiere?->name ?? 'DEUX ANNÉES PRÉPARATOIRES',
                    $student->user?->email ?? ($cleanFirst . $cleanLast . '@gmail.com'),
                    $academicEmail
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
