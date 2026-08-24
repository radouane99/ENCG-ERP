<?php

namespace App\Services\HR;

use App\Models\User;
use App\Models\VacationContract;
use App\Models\VacationSession;
use Symfony\Component\HttpKernel\Exception\HttpException;

class VacataireContractWorkflow
{
    public const MAX_HOURS_PER_MODULE = 45;

    public function approveByDepartment(VacationContract $contract, User $user): void
    {
        abort_unless($user->hasAnyRole(['department-head', 'filiere-head', 'super-admin', 'institution-admin']), 403);
        $contract->update([
            'status' => 'chef_dept',
            'approved_by_dept_id' => $user->id,
            'approved_by_dept_at' => now(),
        ]);
    }

    public function approveByHr(VacationContract $contract, User $user): void
    {
        abort_unless($user->hasAnyRole(['hr-officer', 'super-admin', 'institution-admin']), 403);
        if (! $contract->approved_by_dept_at) {
            throw new HttpException(403, 'Visa chef de département requis avant RH.');
        }
        $contract->update([
            'status' => 'active',
            'approved_by_hr_id' => $user->id,
            'approved_by_hr_at' => now(),
        ]);
    }

    public function assertHoursWithinCap(VacationContract $contract, float $additionalHours): void
    {
        $max = (int) ($contract->max_hours_per_module ?: self::MAX_HOURS_PER_MODULE);
        $done = (float) VacationSession::where('vacation_contract_id', $contract->id)->sum('hours');
        if (($done + $additionalHours) > $max) {
            $copy = app(\App\Domain\AI\Services\GroundedAiService::class)->explain([
                'done' => $done,
                'additional' => $additionalHours,
                'max' => $max,
            ], 'vacataire_cap');
            throw new HttpException(422, "{$done}h + {$additionalHours}h = dépassement (plafond {$max}h). ".$copy['text_fr']);
        }
    }
}
