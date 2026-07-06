<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use App\Http\Requests\UpdateDocumentRequestStatusRequest;
use App\Services\DocumentRequestService;
use App\Services\PdfGenerationService;
use Illuminate\Http\Request;

class AdminDocumentRequestController extends Controller
{
    protected $documentRequestService;
    protected $pdfGenerationService;

    public function __construct(DocumentRequestService $documentRequestService, PdfGenerationService $pdfGenerationService)
    {
        $this->documentRequestService = $documentRequestService;
        $this->pdfGenerationService = $pdfGenerationService;
    }

    public function index(Request $request)
    {
        $query = DocumentRequest::with(['user', 'template']);
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $requests = $query->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($requests);
    }

    public function updateStatus(UpdateDocumentRequestStatusRequest $request, $id)
    {
        $documentRequest = DocumentRequest::findOrFail($id);
        $updated = $this->documentRequestService->updateStatus($documentRequest, $request->validated());
        return response()->json($updated);
    }

    public function generate($id)
    {
        $documentRequest = DocumentRequest::findOrFail($id);
        
        $this->pdfGenerationService->generatePdf($documentRequest);
        
        $this->documentRequestService->updateStatus($documentRequest, ['status' => 'ready']);
        
        return response()->json(['message' => 'PDF generated successfully']);
    }
}
