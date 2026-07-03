<?php

namespace App\Services\HR;

use Illuminate\Support\Facades\DB;
use App\Models\Professor;
use App\Models\VacationContract;
use App\Models\VacationPayment;
use Illuminate\Database\Eloquent\Collection;

class VacataireService
{
    /**
     * Get all vacataires with eager loading to prevent N+1 queries.
     */
    public function getAllVacataires(): Collection
    {
        return Professor::with(['department', 'vacationContracts' => function($query) {
                // Load only active/latest contracts to reduce payload
                $query->with('module')->latest()->limit(1);
            }])
            ->where('contract_type', 'visiting')
            ->get();
    }

    /**
     * Get details of a specific vacataire including contract history and payments.
     */
    public function getVacataireDetails(int $id): ?Professor
    {
        return Professor::with([
                'department', 
                'vacationContracts.payments',
                'modules' // Modules taught
            ])
            ->where('contract_type', 'visiting')
            ->find($id);
    }

    /**
     * Generate a new vacation contract for a professor.
     */
    public function generateContract(array $data): VacationContract
    {
        return DB::transaction(function () use ($data) {
            $professor = Professor::findOrFail($data['professor_id']);
            
            $contract = VacationContract::create([
                'professor_id'  => $data['professor_id'],
                'first_name'    => $professor->first_name,
                'last_name'     => $professor->last_name,
                'email'         => $professor->email,
                'phone'         => $professor->phone,
                'institution_id' => $professor->institution_id,
                'academic_year_id' => 1, // Fallback default
                'module_id'     => $data['module_id'] ?? null,
                'agreed_hours'  => $data['agreed_hours'],
                'hourly_rate'   => $data['hourly_rate'] ?? 400.00, // Standard rate MAD
                'contract_start'=> $data['start_date'],
                'contract_end'  => $data['end_date'],
                'status'        => $data['status'] ?? 'pending'
            ]);

            return $contract;
        });
    }

    /**
     * Calculate and generate a payment based on declared hours.
     */
    public function calculatePayments(int $contractId, float $hoursDeclared): VacationPayment
    {
        return DB::transaction(function () use ($contractId, $hoursDeclared) {
            $contract = VacationContract::findOrFail($contractId);
            
            $totalAmount = $hoursDeclared * $contract->hourly_rate;

            $payment = VacationPayment::create([
                'vacation_contract_id' => $contract->id,
                'hours_paid'           => $hoursDeclared,
                'amount'               => $totalAmount,
                'payment_date'         => now(),
                'status'               => 'pending'
            ]);

            return $payment;
        });
    }
}
