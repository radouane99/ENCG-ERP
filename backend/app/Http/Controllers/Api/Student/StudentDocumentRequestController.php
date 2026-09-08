<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Models\DocumentRequest;
use App\Services\AcademicCalendarService;
use App\Services\DocumentRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class StudentDocumentRequestController extends Controller
{
    public function __construct(
        private DocumentRequestService $documentRequestService
    ) {}

    /**
     * Demandes de documents de l'étudiant.
     */
    public function index(Request $request): JsonResponse
    {
        $student = $request->user()?->student;
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 403);
        }

        $requests = DocumentRequest::with(['student.user', 'documentType'])
            ->where('student_id', $student->id)
            ->latest()
            ->get()
            ->map(function (DocumentRequest $docRequest) {
                $generatedDocument = $this->documentRequestService->getGeneratedDocument($docRequest);
                $isReady = in_array($docRequest->status, ['ready', 'approved', 'collected', 'withdrawn'], true);

                return [
                    'id' => $docRequest->id,
                    'status' => $docRequest->status,
                    'requested_at' => $docRequest->requested_at,
                    'processed_at' => $docRequest->processed_at,
                    'document_type' => $docRequest->documentType?->name,
                    'document_type_id' => $docRequest->document_type_id,
                    'download_url' => $isReady ? url("/api/v1/student-portal/document-requests/{$docRequest->id}/download") : null,
                    'preview_url' => $isReady ? url("/api/v1/student-portal/document-requests/{$docRequest->id}/preview") : null,
                    'hash' => $generatedDocument?->verification_token ?? null,
                    'admin_notes' => $docRequest->admin_notes,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    /**
     * Créer une demande de document.
     */
    public function store(StoreDocumentRequest $request, AcademicCalendarService $calendarService): JsonResponse
    {
        $student = $request->user()?->student;
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 403);
        }

        if (! $calendarService->isDocumentSubmissionOpen()) {
            return response()->json([
                'success' => false,
                'message' => 'La période de dépôt des documents est actuellement fermée.',
            ], 403);
        }

        $documentRequest = $this->documentRequestService->createRequest($student, $request->validated());

        return response()->json([
            'success' => true,
            'data' => $documentRequest,
        ], 201);
    }

    /**
     * Prévisualiser le document officiel (exactement identique à l'administration).
     */
    public function preview(Request $request, int $id)
    {
        $student = $request->user()?->student;
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 403);
        }

        $documentRequest = DocumentRequest::with(['student.user', 'documentType'])->findOrFail($id);

        if ((int) $documentRequest->student_id !== (int) $student->id) {
            abort(403, 'Accès non autorisé.');
        }

        try {
            // Toujours régénérer ou générer avec le service canonique pour garantir la fidélité avec l'administration
            $generatedDocument = $this->documentRequestService->generateDocumentPdf($documentRequest);
        } catch (\Throwable $e) {
            Log::error('Student document preview generation failed', [
                'document_request_id' => $documentRequest->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Impossible de générer le document : '.$e->getMessage(),
            ], 500);
        }

        if ($generatedDocument && Storage::disk('private')->exists($generatedDocument->file_path)) {
            return response()->file(Storage::disk('private')->path($generatedDocument->file_path), [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.basename($generatedDocument->file_path).'"',
            ]);
        }

        return response()->json(['success' => false, 'message' => 'Aperçu indisponible.'], 404);
    }

    /**
     * Télécharger un document généré officiel.
     */
    public function download(Request $request, int $id)
    {
        $student = $request->user()?->student;
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 403);
        }

        $documentRequest = DocumentRequest::with(['student.user', 'documentType'])->findOrFail($id);

        if ((int) $documentRequest->student_id !== (int) $student->id) {
            abort(403, 'Accès non autorisé.');
        }

        try {
            $generatedDocument = $this->documentRequestService->generateDocumentPdf($documentRequest);
        } catch (\Throwable $e) {
            Log::error('Student document download generation failed', [
                'document_request_id' => $documentRequest->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Impossible de générer le document : '.$e->getMessage(),
            ], 500);
        }

        if ($generatedDocument && Storage::disk('private')->exists($generatedDocument->file_path)) {
            return Storage::disk('private')->download(
                $generatedDocument->file_path,
                basename($generatedDocument->file_path)
            );
        }

        return response()->json(['success' => false, 'message' => 'Document introuvable.'], 404);
    }
}
