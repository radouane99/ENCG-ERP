<?php

declare(strict_types=1);

namespace App\Domain\HR\Services;

use App\Domain\HR\Models\VacataireContract;
use App\Domain\HR\Models\VacationSession;
use App\Domain\HR\Models\VacationPayment;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * VacatairePaymentCalculator
 *
 * Handles all financial calculations for vacataire (visiting lecturer) payments.
 * Formula: Hours Completed × Hourly Rate = Gross Payment
 * Applies Moroccan tax deductions and generates export files for bank payment.
 */
class VacatairePaymentCalculator
{
    // Moroccan IR (Income Tax) withholding rate for occasional income
    private const IR_RATE_OCCASIONAL = 0.17;

    // CNSS (Social Security) rate for occasional workers
    private const CNSS_RATE = 0.0448;

    /**
     * Calculate payment for a vacataire contract for a given month.
     */
    public function calculateMonthlyPayment(
        VacataireContract $contract,
        int $year,
        int $month
    ): VacationPayment {
        // Get all validated sessions for this month
        $sessions = VacationSession::where('vacation_contract_id', $contract->id)
            ->where('status', 'validated')
            ->whereYear('session_date', $year)
            ->whereMonth('session_date', $month)
            ->get();

        $totalHours = $sessions->sum('hours');
        $hourlyRate = (float) $contract->hourly_rate;
        $grossAmount = round($totalHours * $hourlyRate, 2);

        // Apply deductions
        $cnssDeduction = round($grossAmount * self::CNSS_RATE, 2);
        $taxableBase = $grossAmount - $cnssDeduction;
        $irDeduction = round($taxableBase * self::IR_RATE_OCCASIONAL, 2);
        $netAmount = round($grossAmount - $cnssDeduction - $irDeduction, 2);

        return VacationPayment::create([
            'institution_id'      => $contract->institution_id,
            'vacation_contract_id' => $contract->id,
            'reference_number'    => $this->generateReference($contract, $year, $month),
            'payment_year'        => $year,
            'payment_month'       => $month,
            'total_hours'         => $totalHours,
            'hourly_rate'         => $hourlyRate,
            'gross_amount'        => $grossAmount,
            'tax_deduction'       => $irDeduction,
            'cnss_deduction'      => $cnssDeduction,
            'net_amount'          => $netAmount,
            'status'              => 'pending',
        ]);
    }

    /**
     * Generate a batch of monthly payments for all active contracts of an institution.
     *
     * @return Collection<VacationPayment>
     */
    public function generateMonthlyBatch(int $institutionId, int $year, int $month): Collection
    {
        $contracts = VacataireContract::where('institution_id', $institutionId)
            ->where('status', 'active')
            ->get();

        return $contracts->map(fn ($contract) =>
            $this->calculateMonthlyPayment($contract, $year, $month)
        );
    }

    /**
     * Export approved payments to CSV (structured for Moroccan banks/Trésor Public).
     */
    public function exportToCsv(Collection $payments): string
    {
        $lines = [];
        $lines[] = implode(';', [
            'Référence', 'Nom', 'Prénom', 'CIN', 'RIB', 'Banque',
            'Année', 'Mois', 'Heures', 'Taux Horaire',
            'Brut (MAD)', 'CNSS', 'IR', 'Net (MAD)',
        ]);

        foreach ($payments as $payment) {
            $contract = $payment->vacataireContract;
            $lines[] = implode(';', [
                $payment->reference_number,
                mb_strtoupper($contract->last_name),
                $contract->first_name,
                $contract->cin ?? '',
                $contract->rib_number ?? '',
                $contract->bank_name ?? '',
                $payment->payment_year,
                str_pad((string) $payment->payment_month, 2, '0', STR_PAD_LEFT),
                number_format($payment->total_hours, 2, '.', ''),
                number_format($payment->hourly_rate, 2, '.', ''),
                number_format($payment->gross_amount, 2, '.', ''),
                number_format($payment->cnss_deduction, 2, '.', ''),
                number_format($payment->tax_deduction, 2, '.', ''),
                number_format($payment->net_amount, 2, '.', ''),
            ]);
        }

        return implode("\r\n", $lines);
    }

    /**
     * Export approved payments to XML (for Banque Populaire / CIH format).
     */
    public function exportToXml(Collection $payments): string
    {
        $institution = $payments->first()?->institution;

        $xml = new \DOMDocument('1.0', 'UTF-8');
        $xml->formatOutput = true;

        $root = $xml->createElement('virements');
        $xml->appendChild($root);

        $header = $xml->createElement('entete');
        $header->appendChild($xml->createElement('institution', $institution?->name ?? ''));
        $header->appendChild($xml->createElement('date', now()->format('Y-m-d')));
        $header->appendChild($xml->createElement('total_ordres', (string) $payments->count()));
        $header->appendChild($xml->createElement('total_montant', (string) $payments->sum('net_amount')));
        $root->appendChild($header);

        foreach ($payments as $payment) {
            $contract = $payment->vacataireContract;
            $order = $xml->createElement('virement');
            $order->appendChild($xml->createElement('reference', $payment->reference_number));
            $order->appendChild($xml->createElement('rib', $contract->rib_number ?? ''));
            $order->appendChild($xml->createElement('nom', mb_strtoupper($contract->last_name)));
            $order->appendChild($xml->createElement('prenom', $contract->first_name));
            $order->appendChild($xml->createElement('montant', number_format($payment->net_amount, 2, '.', '')));
            $order->appendChild($xml->createElement('motif', "Vacations {$payment->payment_year}/{$payment->payment_month}"));
            $root->appendChild($order);
        }

        return $xml->saveXML();
    }

    /**
     * Get a payment summary for reporting dashboard.
     */
    public function getPaymentSummary(int $institutionId, int $year, int $month): array
    {
        $payments = VacationPayment::where('institution_id', $institutionId)
            ->where('payment_year', $year)
            ->where('payment_month', $month)
            ->with('vacataireContract')
            ->get();

        return [
            'total_contracts'  => $payments->count(),
            'total_hours'      => $payments->sum('total_hours'),
            'total_gross'      => $payments->sum('gross_amount'),
            'total_cnss'       => $payments->sum('cnss_deduction'),
            'total_ir'         => $payments->sum('tax_deduction'),
            'total_net'        => $payments->sum('net_amount'),
            'by_status'        => $payments->groupBy('status')->map->count(),
        ];
    }

    private function generateReference(VacataireContract $contract, int $year, int $month): string
    {
        $monthPadded = str_pad((string) $month, 2, '0', STR_PAD_LEFT);
        $institutionCode = $contract->institution->code ?? 'ENCG';
        return "{$institutionCode}-VAC-{$year}{$monthPadded}-{$contract->id}";
    }
}
