<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateDocumentRequestStatus;
use App\Models\DocumentRequest;
use App\Services\DocumentRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminDocumentRequestController extends Controller
{
    public function __construct(private DocumentRequestService $documentRequestService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = DocumentRequest::with(['student.user', 'documentType']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $requests = $query->latest()->get()->map(function (DocumentRequest $documentRequest) {
            $generatedDocument = $this->documentRequestService->getGeneratedDocument($documentRequest);
            $status = in_array($documentRequest->status, ['ready', 'processing'], true) ? 'approved' : $documentRequest->status;
            $adminNotes = $documentRequest->admin_notes ?? [];

            return [
                'id' => $documentRequest->id,
                'person' => $documentRequest->student?->user?->name ?? 'Inconnu',
                'role' => 'Étudiant',
                'type' => $documentRequest->documentType?->name ?? 'Document',
                'motif' => 'Demande de document administratif',
                'time' => $documentRequest->requested_at?->diffForHumans() ?? $documentRequest->created_at?->diffForHumans(),
                'status' => $status,
                'reason' => $adminNotes['reason'] ?? $adminNotes['rejection_reason'] ?? null,
                'email_sent' => $adminNotes['email_sent'] ?? false,
                'email_sent_at' => $adminNotes['email_sent_at'] ?? null,
                'email_recipient' => $adminNotes['email_recipient'] ?? $documentRequest->student?->user?->email ?? null,
                'email_error' => $adminNotes['email_error'] ?? null,
                'url' => url("/api/admin/document-requests/{$documentRequest->id}/download"),
                'preview_url' => url("/api/admin/document-requests/{$documentRequest->id}/preview"),
            ];
        });

        return response()->json([
            'data' => $requests,
            'stats' => [
                'pending' => $requests->where('status', 'pending')->count(),
                'approved' => $requests->where('status', 'approved')->count(),
                'rejected' => $requests->where('status', 'rejected')->count(),
            ],
        ]);
    }

    public function updateStatus(UpdateDocumentRequestStatus $request, DocumentRequest $documentRequest): JsonResponse
    {
        $updatedRequest = $this->documentRequestService->processRequest(
            $documentRequest,
            $request->validated('status'),
            $request->validated('admin_notes')
        );

        return response()->json([
            'message' => 'Status updated successfully.',
            'data' => $updatedRequest,
        ]);
    }

    public function generate(Request $request, DocumentRequest $documentRequest): JsonResponse
    {
        $adminNotes = $documentRequest->admin_notes ?? [];

        if ($request->filled('signatory_title')) {
            $adminNotes['signatory_title'] = $request->string('signatory_title')->toString();
        }

        $updatedRequest = $this->documentRequestService->processRequest($documentRequest, 'ready', $adminNotes);

        return response()->json([
            'message' => 'PDF generated successfully.',
            'data' => $updatedRequest,
        ]);
    }

    public function download(DocumentRequest $documentRequest)
    {
        $generatedDocument = $this->documentRequestService->getGeneratedDocument($documentRequest);

        if (! $generatedDocument || ! Storage::disk('private')->exists($generatedDocument->file_path)) {
            $documentRequest = $this->documentRequestService->processRequest($documentRequest, 'ready');
            $generatedDocument = $this->documentRequestService->getGeneratedDocument($documentRequest);
        }

        if ($generatedDocument && Storage::disk('private')->exists($generatedDocument->file_path)) {
            return Storage::disk('private')->download(
                $generatedDocument->file_path,
                basename($generatedDocument->file_path)
            );
        }

        return response()->json(['message' => 'Document not ready or not found'], 404);
    }

    public function preview(DocumentRequest $documentRequest)
    {
        $generatedDocument = $this->documentRequestService->getGeneratedDocument($documentRequest);

        if (! $generatedDocument || ! Storage::disk('private')->exists($generatedDocument->file_path)) {
            try {
                $documentRequest = $this->documentRequestService->processRequest($documentRequest, 'ready');
                $generatedDocument = $this->documentRequestService->getGeneratedDocument($documentRequest);
            } catch (\Throwable $e) {
                // Return json error or fallback
            }
        }

        if ($generatedDocument && Storage::disk('private')->exists($generatedDocument->file_path)) {
            return response()->file(
                Storage::disk('private')->path($generatedDocument->file_path),
                [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="' . basename($generatedDocument->file_path) . '"',
                ]
            );
        }

        return response()->json(['message' => 'Document preview unavailable'], 404);
    }

    public function sendEmailNotification(DocumentRequest $documentRequest): JsonResponse
    {
        $documentRequest->loadMissing(['student.user', 'documentType']);
        $studentUser = $documentRequest->student?->user;

        if (! $studentUser || ! $studentUser->email) {
            return response()->json([
                'success' => false,
                'message' => "L'étudiant n'a pas d'adresse e-mail valide enregistrée."
            ], 422);
        }

        $emailData = [
            'student_name' => $studentUser->name,
            'document_type' => $documentRequest->documentType?->name ?? 'Document Administratif',
            'request_id' => $documentRequest->id,
            'status' => $documentRequest->status,
            'rejection_reason' => $documentRequest->admin_notes['reason'] ?? $documentRequest->admin_notes['rejection_reason'] ?? null,
        ];

        try {
            \Illuminate\Support\Facades\Mail::to($studentUser->email)->send(new \App\Mail\DocumentRequestStatusMail($emailData));

            $adminNotes = is_array($documentRequest->admin_notes) ? $documentRequest->admin_notes : [];
            $adminNotes['email_sent'] = true;
            $adminNotes['email_sent_at'] = now()->toIso8601String();
            $adminNotes['email_recipient'] = $studentUser->email;
            $documentRequest->update(['admin_notes' => $adminNotes]);

            \App\Models\NotificationLog::create([
                'user_id' => $studentUser->id,
                'type' => 'email',
                'recipient' => $studentUser->email,
                'message' => "Notification email envoyée avec succès à {$studentUser->email}.",
                'status' => 'sent',
            ]);

            return response()->json([
                'success' => true,
                'message' => "Notification e-mail envoyée avec succès à {$studentUser->email} !",
                'email_sent' => true,
                'email_sent_at' => $adminNotes['email_sent_at'],
                'email_recipient' => $studentUser->email,
            ]);
        } catch (\Throwable $e) {
            logger()->error('Failed sending manual email notification: ' . $e->getMessage());

            $adminNotes = is_array($documentRequest->admin_notes) ? $documentRequest->admin_notes : [];
            $adminNotes['email_sent'] = false;
            $adminNotes['email_error'] = $e->getMessage();
            $documentRequest->update(['admin_notes' => $adminNotes]);

            return response()->json([
                'success' => false,
                'message' => "Erreur lors de l'envoi de l'e-mail : " . $e->getMessage(),
            ], 500);
        }
    }
}
