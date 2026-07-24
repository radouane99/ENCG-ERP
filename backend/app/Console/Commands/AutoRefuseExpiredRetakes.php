<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ResitEligibility;
use App\Mail\RattrapageDecisionMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * #5 — Auto-refuse expired retake justification requests.
 *
 * Schedule: run daily via Kernel or task scheduler.
 * Usage: php artisan retakes:auto-refuse-expired
 */
class AutoRefuseExpiredRetakes extends Command
{
    protected $signature   = 'retakes:auto-refuse-expired';
    protected $description = 'Auto-refuse all pending retake requests whose justification deadline has passed.';

    public function handle(): int
    {
        // Read deadline from institution settings (key: retake_justification_deadline)
        $deadline = \App\Models\InstitutionSetting::where('key', 'retake_justification_deadline')->value('value');

        if (!$deadline) {
            $this->warn('No retake justification deadline configured. Set it in institution settings.');
            return self::SUCCESS;
        }

        $deadlineDate = \Carbon\Carbon::parse($deadline)->endOfDay();

        if (now()->lessThanOrEqualTo($deadlineDate)) {
            $this->info("Deadline not yet reached ({$deadline}). No action taken.");
            return self::SUCCESS;
        }

        // Get all pending eligibilities
        $pending = ResitEligibility::where('status', 'En attente')
            ->with(['student.user', 'module.filiere'])
            ->get();

        $count = 0;
        foreach ($pending as $retake) {
            $retake->status      = 'Refusé';
            $retake->is_eligible = false;
            $retake->decided_by  = null; // System decision
            $retake->decided_at  = now();
            $retake->admin_note  = 'Délai de justification dépassé — refus automatique';
            $retake->save();

            // Send email
            try {
                $email = $retake->student?->user?->email;
                if ($email) {
                    $studentName = $retake->student->user->name
                        ?? trim(($retake->student->last_name ?? '') . ' ' . ($retake->student->first_name ?? ''));
                    Mail::to($email)->send(new RattrapageDecisionMail(
                        studentName:  $studentName,
                        moduleName:   $retake->module?->name ?? 'Module inconnu',
                        filiereName:  $retake->module?->filiere?->name ?? 'Filière inconnue',
                        decision:     'Refusé',
                        reason:       $retake->reason ?? 'Absence non justifiée',
                        decisionNote: 'Délai de soumission de justificatif dépassé le ' . $deadlineDate->format('d/m/Y'),
                    ));
                }
            } catch (\Throwable $e) {
                Log::warning('AutoRefuse email failed: ' . $e->getMessage());
            }

            $count++;
        }

        $this->info("{$count} dossier(s) en attente refusés automatiquement (délai expiré le {$deadline}).");
        return self::SUCCESS;
    }
}
