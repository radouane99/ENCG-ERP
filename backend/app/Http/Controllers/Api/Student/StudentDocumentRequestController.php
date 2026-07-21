<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Models\DocumentRequest;
use App\Services\DocumentRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class StudentDocumentRequestController extends Controller
{
    public function __construct(private DocumentRequestService $documentRequestService)
    {
    }

    public function index(): JsonResponse
    {
        $student = request()->user()?->student;

        if (! $student) {
            return response()->json(['message' => 'Profil étudiant introuvable.'], 403);
        }

        $requests = DocumentRequest::with(['student.user', 'documentType'])
            ->where('student_id', $student->id)
            ->latest()
            ->get()
            ->map(function (DocumentRequest $request) {
                $generatedDocument = $this->documentRequestService->getGeneratedDocument($request);

                return [
                    'id' => $request->id,
                    'status' => $request->status,
                    'requested_at' => $request->requested_at,
                    'processed_at' => $request->processed_at,
                    'document_type' => $request->documentType?->name,
                    'document_type_id' => $request->document_type_id,
                    'download_url' => $generatedDocument ? url("/api/v1/student-portal/document-requests/{$request->id}/download") : null,
                    'admin_notes' => $request->admin_notes,
                ];
            });

        return response()->json(['data' => $requests]);
    }

    public function store(StoreDocumentRequest $request, \App\Services\AcademicCalendarService $calendarService): JsonResponse
    {
        $student = $request->user()?->student;

        if (! $student) {
            return response()->json(['message' => 'Profil étudiant introuvable.'], 403);
        }

        if (! $calendarService->isDocumentSubmissionOpen()) {
            return response()->json([
                'message' => 'La période de dépôt des justificatifs et documents est actuellement fermée selon le calendrier académique.'
            ], 403);
        }

        $documentRequest = $this->documentRequestService->createRequest($student, $request->validated());

        return response()->json(['data' => $documentRequest], 201);
    }

    public function download(int $id)
    {
        $student = request()->user()?->student;

        if (! $student) {
            return response()->json(['message' => 'Profil étudiant introuvable.'], 403);
        }

        $documentRequest = DocumentRequest::where('student_id', $student->id)->findOrFail($id);
        $generatedDocument = $this->documentRequestService->getGeneratedDocument($documentRequest);

        if (! $generatedDocument || ! Storage::disk('private')->exists($generatedDocument->file_path)) {
            return response()->json(['message' => 'Document not ready or not found'], 404);
        }

        return Storage::disk('private')->download(
            $generatedDocument->file_path,
            basename($generatedDocument->file_path)
        );
    }
}
