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
            ->with([
                'internshipDocuments',
                'soutenance.room',
                'soutenance.president.user',
                'soutenance.examiner.user',
                'supervisor.user',
                'student.user',
            ])
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

        $data = $request->validated();
        $data['type'] = $data['type'] ?? $data['internship_type'] ?? 'pfe';
        $data['supervisor_email'] = $data['supervisor_email'] ?? $data['company_mentor_email'] ?? null;
        $data['company_mentor_name'] = $data['company_mentor_name'] ?? $data['supervisor_name'] ?? null;
        $internship = app(\App\Actions\Internship\ManageConventionAction::class)->create($student, $data);
        return response()->json([
            'success' => true,
            'message' => 'Candidature au stage soumise avec succès.',
            'internship' => $internship,
            'data' => $internship,
        ], 201);
    }

    /**
     * Uploader un document de stage.
     */
    public function uploadDocument(int $internshipId, UploadInternshipDocumentRequest $request): JsonResponse
    {
        $student = $request->user()?->student;
        abort_unless($student, 403, 'Profil étudiant introuvable.');

        // Vérification d'appartenance du stage à l'étudiant connecté
        Internship::where('id', $internshipId)
            ->where('student_id', $student->id)
            ->firstOrFail();

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
