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
            ->paginate(15);

        return response()->json($requests);
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
                'message' => 'Error processing request: ' . $e->getMessage()
            ], 500);
        }
    }
}
