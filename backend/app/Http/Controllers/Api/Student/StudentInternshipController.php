<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Internship\ApplyInternshipRequest;
use App\Http\Requests\Internship\UploadInternshipDocumentRequest;
use App\Models\Internship;
use App\Services\Academic\InternshipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
        $data['institution_id'] = $data['institution_id'] ?? $student->institution_id ?? 1;
        $data['academic_year_id'] = $data['academic_year_id'] ?? $student->academic_year_id ?? 1;
        $data['type'] = $data['type'] ?? $data['internship_type'] ?? 'pfe';
        $data['company_city'] = $data['company_city'] ?? 'Fès';
        $data['company_address'] = $data['company_address'] ?? $data['company_city'];
        $data['company_mentor_name'] = $data['company_mentor_name'] ?? $data['supervisor_name'] ?? 'Tuteur Entreprise';
        $data['supervisor_name'] = $data['supervisor_name'] ?? $data['company_mentor_name'];
        $data['company_mentor_email'] = $data['company_mentor_email'] ?? $data['supervisor_email'] ?? 'tuteur@entreprise.ma';
        $data['supervisor_email'] = $data['supervisor_email'] ?? $data['company_mentor_email'];
        $data['supervisor_phone'] = $data['supervisor_phone'] ?? '0600000000';
        $data['convention_ref'] = 'CONV-ENCG-'.date('Y').'-'.strtoupper(Str::random(6));
        $data['convention_status'] = 'school_signed';
        $data['insurance_company'] = $data['insurance_company'] ?? 'MAMDA-MCMA / Assurance Scolaire';
        $data['insurance_policy_number'] = $data['insurance_policy_number'] ?? ('POL-ENCG-'.date('Y').'-'.$student->id);

        $internship = $this->internshipService->submitApplication(
            $data,
            $student->id
        );

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
