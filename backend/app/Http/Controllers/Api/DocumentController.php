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
    public function generateAttestation(Request $request, \App\Services\DocumentRequestService $reqService): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'type' => 'required|string'
        ]);

        $student = Student::findOrFail($request->student_id);
        
        // Map frontend type to document_type_id
        $typeMap = [
            'scolarite' => 1,
            'releve' => 2,
        ];
        
        $typeId = $typeMap[$request->type] ?? 1;

        // Create the request
        $docReq = $reqService->createRequest($student, ['document_type_id' => $typeId]);
        
        // Process it (generates PDF and marks as ready)
        $docReq = $reqService->processRequest($docReq, 'ready', ['reason' => 'Généré via Édition Rapide par Admin']);
        
        // Return same structure as before so frontend toast works
        $media = $docReq->getFirstMedia('generated_documents');
        $pdfUrl = $media ? parse_url($media->getUrl(), PHP_URL_PATH) : null;
        return response()->json([
            'success' => true,
            'url' => $pdfUrl,
            'message' => 'Document PDF sécurisé généré avec succès.'
        ]);
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
