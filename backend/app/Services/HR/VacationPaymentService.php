<?php

namespace App\Services\HR;

use App\Models\VacationContract;
use App\Models\VacationPayment;
use App\Models\VacationSession;
use Carbon\Carbon;
use Exception;

class VacationPaymentService
{
    /**
     * Generate a monthly payment slip for a vacataire contract.
     * 
     * @param int $contractId
     * @param int $year
     * @param int $month
     * @param float $taxRate Deductions (e.g. 17% or 30%)
     */
    public function generateMonthlyPayment(int $contractId, int $year, int $month, float $taxRate = 0.0): VacationPayment
    {
        $contract = VacationContract::findOrFail($contractId);

        // Fetch all validated sessions for this month and year
        $sessions = VacationSession::where('vacation_contract_id', $contractId)
            ->where('status', 'validated')
            ->whereYear('session_date', $year)
            ->whereMonth('session_date', $month)
            ->get();

        if ($sessions->isEmpty()) {
            throw new Exception("Aucune session validée pour ce mois.");
        }

        $totalHours = $sessions->sum('hours');
        $grossAmount = $totalHours * $contract->hourly_rate;
        
        $taxDeduction = $grossAmount * ($taxRate / 100);
        $netAmount = $grossAmount - $taxDeduction;

        $reference = 'VAC-' . $year . '-' . str_pad((string)$month, 2, '0', STR_PAD_LEFT) . '-' . $contractId;

        return VacationPayment::updateOrCreate(
            [
                'vacation_contract_id' => $contractId,
                'payment_year' => $year,
                'payment_month' => $month,
            ],
            [
                'institution_id' => $contract->institution_id,
                'reference_number' => $reference,
                'total_hours' => $totalHours,
                'hourly_rate' => $contract->hourly_rate,
                'gross_amount' => $grossAmount,
                'tax_deduction' => $taxDeduction,
                'net_amount' => $netAmount,
                'status' => 'pending'
            ]
        );
    }
}
