<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateDocumentRequestStatus;
use App\Models\DocumentRequest;
use App\Services\DocumentRequestService;
use Illuminate\Http\JsonResponse;

class AdminDocumentRequestController extends Controller
{
    public function __construct(
        protected DocumentRequestService $documentRequestService
    ) {}

    public function index(): JsonResponse
    {
        $requests = DocumentRequest::with(['student.user', 'documentType', 'media'])
            ->latest()
            ->get()
            ->map(function ($req) {
                $status = $req->status;
                if ($status === 'ready' || $status === 'processing') {
                    $status = 'approved';
                }

                $media = $req->getFirstMedia('generated_documents');
                
                $adminNotes = $req->admin_notes ?? [];
                
                $pdfUrl = null;
                if ($media) {
                    // Use a relative path so the frontend (Vite) can correctly proxy
                    // the request to the backend via its /storage proxy rule.
                    $fullUrl = $media->getUrl();
                    $pdfUrl = parse_url($fullUrl, PHP_URL_PATH);
                }

                return [
                    'id' => $req->id,
                    'person' => $req->student?->user?->name ?? 'Inconnu',
                    'role' => 'Étudiant',
                    'type' => $req->documentType?->name ?? 'Document',
                    'motif' => 'Demande de document administratif',
                    'time' => $req->requested_at?->diffForHumans() ?? $req->created_at?->diffForHumans(),
                    'status' => $status,
                    'reason' => $adminNotes['rejection_reason'] ?? null,
                    'url' => $pdfUrl,
                    'preview_url' => $pdfUrl,
                ];
            });

        return response()->json([
            'data' => $requests,
            'stats' => [
                'pending' => $requests->where('status', 'pending')->count(),
                'approved' => $requests->where('status', 'approved')->count(),
                'rejected' => $requests->where('status', 'rejected')->count(),
            ]
        ]);
    }

    public function updateStatus(UpdateDocumentRequestStatus $request, DocumentRequest $documentRequest): JsonResponse
    {
        try {
            $updatedRequest = $this->documentRequestService->processRequest(
                $documentRequest,
                $request->validated('status'),
                $request->validated('admin_notes')
            );

            return response()->json([
                'message' => 'Status updated successfully.',
                'data' => $updatedRequest->load('media')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error processing request: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine()
            ], 500);
        }
    }
}
