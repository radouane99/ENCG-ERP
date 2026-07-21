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
                'url' => $generatedDocument ? url("/api/admin/document-requests/{$documentRequest->id}/download") : null,
                'preview_url' => $generatedDocument ? url("/api/admin/document-requests/{$documentRequest->id}/download") : null,
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
            return response()->json(['message' => 'Document not ready or not found'], 404);
        }

        return Storage::disk('private')->download(
            $generatedDocument->file_path,
            basename($generatedDocument->file_path)
        );
    }
}
