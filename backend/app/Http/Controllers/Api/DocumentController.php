<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Core\DocumentService;
use App\Models\Student;

class DocumentController extends Controller
{
    protected DocumentService $documentService;

    public function __construct(DocumentService $documentService)
    {
        $this->documentService = $documentService;
    }

    /**
     * Generate an attestation for a given student
     */
    public function generateAttestation(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'type' => 'required|string'
        ]);

        $student = Student::findOrFail($request->student_id);
        
        $result = $this->documentService->generateAttestation($student, $request->type);
        
        return response()->json($result);
    }

    /**
     * Verify a document's authenticity
     */
    public function verifyDocument($trackingCode): JsonResponse
    {
        $result = $this->documentService->verifyDocument($trackingCode);
        
        if ($result['valid']) {
            return response()->json([
                'success' => true,
                'data' => $result['document']
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Document invalide ou introuvable.'
        ], 404);
    }
}
