<?php

namespace App\Services\HR;

use App\Models\User;
use App\Models\VacationContract;
use App\Models\VacationPayment;
use App\Models\VacationSession;
use App\Services\Academic\AcademicContext;

class VacationPaymentTrackerService
{
    public function summary(User $user, ?array $simulation = null): array
    {
        $prof = $user->professor()->first();
        abort_unless($prof && ($prof->contract_type === 'vacataire' || $user->hasRole('vacataire')), 403);
        $contracts = VacationContract::where('institution_id', $user->institution_id)->where('professor_id', $prof->id)
            ->when(AcademicContext::yearId(), fn ($q, $year) => $q->where('academic_year_id', $year))->where('status', '!=', 'cancelled')->get();
        $payments = VacationPayment::where('institution_id', $user->institution_id)->whereIn('vacation_contract_id', $contracts->pluck('id'))->where('status', '!=', 'cancelled')->get();
        $hours = (float) $payments->sum('total_hours');
        $gross = (float) $payments->sum('gross_amount');
        $tax = (float) $payments->sum('tax_deduction');
        $net = (float) $payments->sum('net_amount');
        $rate = $hours > 0 ? round($gross / $hours, 2) : 0;
        $igr = $gross > 0 ? round($tax * 100 / $gross, 2) : 17;
        if ($simulation !== null) {
            $hours = (float) $simulation['hours'];
            $rate = (float) $simulation['rate'];
            $gross = round($hours * $rate, 2);
            $tax = round($gross * 0.17, 2);
            $net = round($gross - $tax, 2);
            $igr = 17;
        }
        $step = fn ($rows, $predicate) => $rows->isEmpty() ? 'pending' : ($rows->every($predicate) ? 'completed' : ($rows->contains($predicate) ? 'in_progress' : 'pending'));

        return [
            'mode' => $simulation !== null ? 'simulation' : 'recorded_payments',
            'is_official_document' => false, 'reference_code' => null, 'signature_code' => null,
            'total_hours' => $hours, 'hourly_rate_mad' => $rate, 'gross_amount_mad' => $gross,
            'igr_rate_pct' => $igr, 'expected_igr_rate_pct' => 17, 'igr_withholding_mad' => $tax, 'net_payable_mad' => $net,
            'requires_financial_review' => $simulation === null && $payments->isNotEmpty() && abs($igr - 17) > 0.01,
            'contracts_count' => $contracts->count(), 'payments_count' => $payments->count(),
            'validated_service_hours' => (float) VacationSession::whereIn('vacation_contract_id', $contracts->pluck('id'))->where('status', 'validated')->sum('hours'),
            'pipeline_steps' => [
                ['step' => 1, 'label' => 'Certification du Service Fait (Chef de Département)', 'status' => $step($contracts, fn ($c) => $c->approved_by_dept_at !== null)],
                ['step' => 2, 'label' => 'Validation administrative du contrat', 'status' => $step($contracts, fn ($c) => $c->approved_by_hr_at !== null)],
                ['step' => 3, 'label' => 'Approbation financière du décompte', 'status' => $step($payments, fn ($p) => $p->approved_at !== null && in_array($p->status, ['approved', 'paid'], true))],
                ['step' => 4, 'label' => 'Paiement enregistré', 'status' => $step($payments, fn ($p) => $p->status === 'paid' && $p->paid_at !== null)],
            ],
        ];
    }
}
