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
        $updated = $this->documentRequestService->processRequest($documentRequest, $request->validated('status'), ['admin_notes' => 'Updated via Admin UI']);
        return response()->json($updated);
    }

    public function generate(Request $request, $id)
    {
        $documentRequest = DocumentRequest::findOrFail($id);
        
        $options = [
            'admin_notes' => 'Generated via API',
            'signatory_title' => $request->input('signatory_title')
        ];
        
        // processRequest 'ready' will trigger generateDocumentPdf automatically
        $this->documentRequestService->processRequest($documentRequest, 'ready', $options);
        
        return response()->json(['message' => 'PDF generated successfully']);
    }
}
