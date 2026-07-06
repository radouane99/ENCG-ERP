<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Models\DocumentRequest;
use App\Services\DocumentRequestService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class StudentDocumentRequestController extends Controller
{
    public function __construct(
        protected DocumentRequestService $documentRequestService
    ) {}

    public function index(): JsonResponse
    {
        $student = Auth::user()->student;
        
        $requests = DocumentRequest::with(['documentType', 'media'])
            ->where('student_id', $student->id)
            ->latest()
            ->get();

        return response()->json(['data' => $requests]);
    }

    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $student = Auth::user()->student;

        try {
            $documentRequest = $this->documentRequestService->createRequest(
                $student, 
                $request->validated()
            );

            return response()->json([
                'message' => 'Document request submitted successfully.',
                'data' => $documentRequest
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
