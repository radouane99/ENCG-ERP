<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProfessorDocumentRequest;
use App\Services\HR\ParapheurWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ParapheurController extends Controller
{
    public function __construct(
        protected ParapheurWorkflowService $parapheurService
    ) {}

    /**
     * Liste des demandes dans la boîte du Parapheur.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->only(['stage', 'department_id', 'document_type', 'search']);

        $requests = $this->parapheurService->getParapheurList($user, $filters);

        return response()->json([
            'success' => true,
            'data' => $requests,
            'count' => $requests->count(),
        ]);
    }

    /**
     * Compteurs synoptiques du Parapheur.
     */
    public function counters(Request $request): JsonResponse
    {
        $user = $request->user();
        $departmentId = $request->query('department_id') ? (int) $request->query('department_id') : null;

        $counters = $this->parapheurService->getParapheurCounters($user, $departmentId);

        return response()->json([
            'success' => true,
            'data' => $counters,
        ]);
    }

    /**
     * Détails d'une demande avec timeline complète.
     */
    public function show(int $id): JsonResponse
    {
        $item = ProfessorDocumentRequest::with(['user', 'professor', 'department', 'departmentVisaUser'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $item,
        ]);
    }

    /**
     * Soumission d'une nouvelle demande (Professeur ou Secrétariat).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'document_type' => 'required|string|in:ordre_de_mission,attestation_travail,attestation_salaire,autorisation_absence',
            'purpose' => 'required|string|min:5',
            'destination' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'transport_mode' => 'nullable|string|in:voiture_personnelle,voiture_service,train,avion,autre',
            'vehicle_registration' => 'nullable|string',
            'expense_coverage' => 'nullable|string|in:charge_ecole,charge_organisme_accueil,sans_frais',
            'mission_category' => 'nullable|string',
            'department_id' => 'nullable|integer|exists:departments,id',
        ]);

        $created = $this->parapheurService->submitRequest($request->user(), $validated);

        return response()->json([
            'success' => true,
            'message' => 'Demande transmise avec succès au Parapheur Électronique.',
            'data' => $created,
        ], 201);
    }

    /**
     * Visa du Chef de Département (Favorable / Défavorable).
     */
    public function departmentVisa(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'visa' => 'required|string|in:favorable,unfavorable',
            'notes' => 'nullable|string|max:1000',
        ]);

        $updated = $this->parapheurService->applyDepartmentVisa(
            $id,
            $request->user(),
            $validated['visa'],
            $validated['notes'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => $validated['visa'] === 'favorable'
                ? 'Avis favorable apposé avec succès. Dossier transmis à la Direction.'
                : 'Avis défavorable motivé enregistré.',
            'data' => $updated,
        ]);
    }

    /**
     * Décision et Signature Numérique Direction / SG.
     */
    public function directionSign(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'decision' => 'required|string|in:approved,rejected',
            'notes' => 'nullable|string|max:1000',
            'signatory_title' => 'nullable|string|max:255',
        ]);

        $updated = $this->parapheurService->signDirectionDecision(
            $id,
            $request->user(),
            $validated['decision'],
            $validated['notes'] ?? null,
            $validated['signatory_title'] ?? 'LE DIRECTEUR DE L\'ENCG FÈS'
        );

        return response()->json([
            'success' => true,
            'message' => $validated['decision'] === 'approved'
                ? 'Ordre de mission scellé et signé numériquement avec succès.'
                : 'Demande rejetée par la Direction.',
            'data' => $updated,
        ]);
    }

    /**
     * Signature groupée par lot (Batch Signing) pour la Direction.
     */
    public function batchSign(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'request_ids' => 'required|array|min:1',
            'request_ids.*' => 'integer|exists:professor_document_requests,id',
            'signatory_title' => 'nullable|string|max:255',
        ]);

        $result = $this->parapheurService->batchSignDirection(
            $validated['request_ids'],
            $request->user(),
            $validated['signatory_title'] ?? 'LE DIRECTEUR DE L\'ENCG FÈS'
        );

        return response()->json($result);
    }

    /**
     * Téléchargement / Visualisation du PDF Officiel de l'Ordre de Mission.
     */
    public function previewPdf(int $id): Response
    {
        $request = ProfessorDocumentRequest::with(['user', 'professor', 'department', 'departmentVisaUser'])
            ->findOrFail($id);

        $pdf = $this->parapheurService->renderMissionOrderPdf($request);

        $filename = 'Ordre_de_Mission_'.$request->tracking_code.'.pdf';

        return $pdf->stream($filename);
    }
}
