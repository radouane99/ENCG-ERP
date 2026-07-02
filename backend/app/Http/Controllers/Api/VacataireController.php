<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\HR\VacataireService;

class VacataireController extends Controller
{
    protected VacataireService $vacataireService;

    public function __construct(VacataireService $vacataireService)
    {
        $this->vacataireService = $vacataireService;
    }

    /**
     * Display a listing of vacataires.
     */
    public function index(): JsonResponse
    {
        $vacataires = $this->vacataireService->getAllVacataires();
        return response()->json(['success' => true, 'data' => $vacataires]);
    }

    /**
     * Display the specified vacataire details.
     */
    public function show($id): JsonResponse
    {
        $vacataire = $this->vacataireService->getVacataireDetails((int) $id);
        
        if (!$vacataire) {
            return response()->json(['success' => false, 'message' => 'Vacataire non trouvé'], 404);
        }

        return response()->json(['success' => true, 'data' => $vacataire]);
    }

    /**
     * Store a newly created vacation contract.
     */
    public function storeContract(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professor_id' => 'required|integer|exists:professors,id',
            'agreed_hours' => 'required|numeric|min:1',
            'start_date'   => 'required|date',
            'end_date'     => 'required|date|after:start_date',
        ]);

        $contract = $this->vacataireService->generateContract($validated);

        return response()->json([
            'success' => true,
            'message' => 'Contrat généré avec succès',
            'data'    => $contract
        ], 201);
    }

    /**
     * Process a payment for a vacataire contract.
     */
    public function processPayment(Request $request, $contractId): JsonResponse
    {
        $validated = $request->validate([
            'hours_declared' => 'required|numeric|min:1'
        ]);

        $payment = $this->vacataireService->calculatePayments((int) $contractId, $validated['hours_declared']);

        return response()->json([
            'success' => true,
            'message' => 'Paiement calculé et enregistré',
            'data'    => $payment
        ]);
    }
}
