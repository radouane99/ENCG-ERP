<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VacationContract;
use App\Domain\HR\Services\VacatairePaymentCalculator;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class VacationController extends Controller
{
    private VacatairePaymentCalculator $paymentCalculator;

    public function __construct(VacatairePaymentCalculator $paymentCalculator)
    {
        $this->paymentCalculator = $paymentCalculator;
    }

    /**
     * Generate a monthly payment for a specific vacataire contract.
     */
    public function generatePayment(Request $request, VacationContract $contract): JsonResponse
    {
        if (!$request->user()->can('manage hr')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'year' => 'required|integer|min:2020|max:2099',
            'month' => 'required|integer|min:1|max:12',
        ]);

        try {
            $payment = $this->paymentCalculator->generateMonthlyPayment(
                $contract,
                $validated['year'],
                $validated['month']
            );

            return response()->json([
                'message' => 'Payment generated successfully',
                'payment' => $payment
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate payment',
                'error' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Generate bank export for a list of approved payments.
     */
    public function exportBankFile(Request $request): JsonResponse
    {
        if (!$request->user()->can('manage finance')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'payment_ids' => 'required|array',
            'payment_ids.*' => 'integer|exists:vacation_payments,id'
        ]);

        try {
            $csvData = $this->paymentCalculator->generateBankExport($validated['payment_ids']);
            
            // In a real API, you might return the file directly or a signed URL
            return response()->json([
                'message' => 'Export generated',
                'csv_content' => base64_encode($csvData)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate export',
                'error' => $e->getMessage()
            ], 422);
        }
    }
}
