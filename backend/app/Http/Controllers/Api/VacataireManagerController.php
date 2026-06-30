<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\VacationContract;
use App\Models\VacationSession;
use App\Models\VacationPayment;
use App\Services\HR\VacationPaymentService;

class VacataireManagerController extends Controller
{
    protected VacationPaymentService $paymentService;

    public function __construct(VacationPaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Get all vacataire contracts
     */
    public function getContracts(): JsonResponse
    {
        $contracts = VacationContract::with(['module', 'academicYear'])->get();
        return response()->json(['success' => true, 'data' => $contracts]);
    }

    /**
     * Get sessions for a contract
     */
    public function getSessions(int $contractId): JsonResponse
    {
        $sessions = VacationSession::where('vacation_contract_id', $contractId)->get();
        return response()->json(['success' => true, 'data' => $sessions]);
    }

    /**
     * Log a new session (hours taught)
     */
    public function logSession(Request $request, int $contractId): JsonResponse
    {
        $validated = $request->validate([
            'session_date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
            'hours' => 'required|numeric'
        ]);

        $session = VacationSession::create([
            'vacation_contract_id' => $contractId,
            'session_date' => $validated['session_date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'hours' => $validated['hours'],
            'status' => 'validated' // Auto-validated for demo purposes
        ]);

        return response()->json(['success' => true, 'data' => $session]);
    }

    /**
     * Generate Monthly Payment
     */
    public function generatePayment(Request $request, int $contractId): JsonResponse
    {
        $validated = $request->validate([
            'year' => 'required|integer',
            'month' => 'required|integer',
            'tax_rate' => 'numeric'
        ]);

        try {
            $payment = $this->paymentService->generateMonthlyPayment(
                $contractId, 
                $validated['year'], 
                $validated['month'], 
                $validated['tax_rate'] ?? 0.0
            );

            return response()->json(['success' => true, 'data' => $payment]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
