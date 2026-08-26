<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Internship\ApplyInternshipRequest;
use App\Http\Requests\Internship\UploadInternshipDocumentRequest;
use App\Models\Internship;
use App\Services\Academic\InternshipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentInternshipController extends Controller
{
    public function __construct(
        private InternshipService $internshipService
    ) {}

    /**
     * Stages de l'étudiant.
     */
    public function index(Request $request): JsonResponse
    {
        $student = $request->user()?->student;
        abort_unless($student, 403, 'Profil étudiant introuvable.');

        $perPage = min((int) $request->input('per_page', 20), 100);
        $internships = Internship::where('student_id', $student->id)
            ->with(['internshipDocuments'])
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'internships' => $internships->items(),
            'data' => $internships->items(),
            'meta' => [
                'total' => $internships->total(),
                'per_page' => $internships->perPage(),
                'current_page' => $internships->currentPage(),
                'last_page' => $internships->lastPage(),
            ],
        ]);
    }

    /**
     * Postuler à un stage.
     */
    public function store(ApplyInternshipRequest $request): JsonResponse
    {
        $student = $request->user()?->student;
        abort_unless($student, 403, 'Profil étudiant introuvable.');

        $internship = $this->internshipService->submitApplication(
            $request->validated(),
            $student->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Candidature au stage soumise avec succès.',
            'internship' => $internship,
        ], 201);
    }

    /**
     * Uploader un document de stage.
     */
    public function uploadDocument(int $internshipId, UploadInternshipDocumentRequest $request): JsonResponse
    {
        $document = $this->internshipService->uploadDocument(
            $internshipId,
            $request->validated('document_type'),
            $request->file('file')
        );

        return response()->json([
            'success' => true,
            'message' => 'Document uploadé avec succès.',
            'document' => $document,
        ], 201);
    }
}
