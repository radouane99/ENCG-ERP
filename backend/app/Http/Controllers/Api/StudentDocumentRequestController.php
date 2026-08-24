<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Models\DocumentRequest;
use App\Services\DocumentRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class StudentDocumentRequestController extends Controller
{
    public function __construct(
        private DocumentRequestService $documentRequestService
    ) {}

    /**
     * Liste des demandes de documents de l'étudiant connecté.
     */
    public function index(): JsonResponse
    {
        $student = Auth::user()->student;

        $requests = DocumentRequest::with(['documentType', 'media'])
            ->where('student_id', $student->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    /**
     * Créer une demande de document.
     */
    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $student = Auth::user()->student;

        try {
            $documentRequest = $this->documentRequestService->createRequest(
                $student,
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Demande de document soumise avec succès.',
                'data' => $documentRequest,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
