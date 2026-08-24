<?php

namespace App\Console\Commands;

use App\Mail\DirectionRiskDigestMail;
use App\Models\User;
use App\Services\Academic\EarlyWarningService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendAiRiskDigest extends Command
{
    protected $signature = 'encg:ai-risk-digest';

    protected $description = 'Envoie le digest hebdomadaire des alertes pédagogiques à la direction (sans notes brutes à Gemini).';

    public function handle(EarlyWarningService $warnings): int
    {
        $list = $warnings->list();
        $courseAbsences = collect($list)->sum('course_absences');
        $modulesAtRisk = count($list);

        $recipients = User::query()
            ->whereHas('roles', fn ($q) => $q->whereIn('name', ['institution-admin', 'super-admin', 'direction']))
            ->pluck('email')
            ->filter()
            ->unique();

        if ($recipients->isEmpty()) {
            $this->warn('Aucun destinataire direction.');

            return self::SUCCESS;
        }

        foreach ($recipients as $email) {
            Mail::to($email)->queue(new DirectionRiskDigestMail($list, (int) $courseAbsences, $modulesAtRisk));
        }

        $this->info('Digest envoyé ('.$recipients->count().' destinataire(s)).');

        return self::SUCCESS;
    }
}
