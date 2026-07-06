<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use App\Http\Requests\StoreDocumentRequest;
use App\Services\DocumentRequestService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class StudentDocumentRequestController extends Controller
{
    protected $documentRequestService;

    public function __construct(DocumentRequestService $documentRequestService)
    {
        $this->documentRequestService = $documentRequestService;
    }

    public function index()
    {
        $requests = DocumentRequest::with('template')
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($requests);
    }

    public function store(StoreDocumentRequest $request)
    {
        $documentRequest = $this->documentRequestService->createRequest($request->validated());
        return response()->json($documentRequest, 201);
    }

    public function download($id)
    {
        $documentRequest = DocumentRequest::where('user_id', Auth::id())->findOrFail($id);
        
        $file = $documentRequest->additional_data['generated_file'] ?? null;
        
        if (!$file || !Storage::disk('public')->exists($file)) {
            return response()->json(['message' => 'Document not ready or not found'], 404);
        }
        
        return Storage::disk('public')->download($file);
    }
}
