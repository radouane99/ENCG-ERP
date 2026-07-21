<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use App\Models\GeneratedDocument;
use App\Models\Student;
use App\Services\Core\DocumentService;
use App\Services\DocumentRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function __construct(protected DocumentService $documentService)
    {
    }

    /**
     * Generate an attestation for a given student.
     */
    public function generateAttestation(Request $request, DocumentRequestService $reqService): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'type' => 'required|string',
        ]);

        $student = Student::findOrFail($request->integer('student_id'));

        $typeMap = [
            'scolarite' => 1,
            'releve' => 2,
        ];

        $typeId = $typeMap[$request->string('type')->toString()] ?? 1;
        $docReq = $reqService->createRequest($student, ['document_type_id' => $typeId]);
        $docReq = $reqService->processRequest($docReq, 'ready', ['reason' => 'Généré via Édition Rapide par Admin']);
        $generatedDocument = $reqService->getGeneratedDocument($docReq);

        return response()->json([
            'success' => true,
            'url' => $generatedDocument ? url("/api/admin/document-requests/{$docReq->id}/download") : null,
            'message' => 'Document PDF sécurisé généré avec succès.',
        ]);
    }

    public function generate(Request $request, DocumentRequestService $documentRequestService): JsonResponse
    {
        $validated = $request->validate([
            'document_request_id' => 'nullable|integer|exists:document_requests,id',
            'student_id' => 'required_without:document_request_id|integer|exists:students,id',
            'document_type_id' => 'required_without:document_request_id|integer|exists:document_types,id',
            'signatory_title' => 'nullable|string|max:255',
        ]);

        if (! empty($validated['document_request_id'])) {
            $documentRequest = DocumentRequest::findOrFail($validated['document_request_id']);
        } else {
            $student = Student::findOrFail($validated['student_id']);
            $documentRequest = $documentRequestService->createRequest($student, [
                'document_type_id' => $validated['document_type_id'],
            ]);
        }

        $adminNotes = $documentRequest->admin_notes ?? [];
        if (! empty($validated['signatory_title'])) {
            $adminNotes['signatory_title'] = $validated['signatory_title'];
        }

        $documentRequest = $documentRequestService->processRequest($documentRequest, 'ready', $adminNotes);
        $generatedDocument = $documentRequestService->getGeneratedDocument($documentRequest);

        return response()->json([
            'success' => true,
            'data' => [
                'request_id' => $documentRequest->id,
                'verification_token' => $generatedDocument?->verification_token,
                'download_url' => $generatedDocument ? url("/api/admin/document-requests/{$documentRequest->id}/download") : null,
            ],
        ], 201);
    }

    /**
     * Verify a document's authenticity.
     */
    public function verifyDocument(string $trackingCode): JsonResponse
    {
        $result = $this->documentService->verifyDocument($trackingCode);

        if ($result['valid']) {
            return response()->json([
                'success' => true,
                'data' => $result['document'],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Document invalide ou introuvable.',
        ], 404);
    }

    public function verify(string $token): JsonResponse
    {
        $document = GeneratedDocument::with(['student.user'])
            ->where('verification_token', $token)
            ->first();

        if (! $document || ($document->expires_at && now()->greaterThan($document->expires_at))) {
            return response()->json([
                'success' => false,
                'message' => 'Document invalide ou expiré.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'document_type' => $document->document_type,
                'student_name' => $document->student?->user?->name,
                'issued_at' => $document->created_at,
                'expires_at' => $document->expires_at,
                'status' => 'Authentique',
            ],
        ]);
    }
}
