<?php

namespace App\Console\Commands;

use App\Domain\Core\Services\DataAnonymizationService;
use App\Models\User;
use Illuminate\Console\Command;

class EnforceDataRetention extends Command
{
    protected $signature = 'cndp:enforce-retention {--days=}';

    protected $description = 'Anonymise les comptes inactifs selon la politique de rétention Loi 09-08';

    public function handle(DataAnonymizationService $anonymizer): int
    {
        $days = (int) ($this->option('days') ?: env('DATA_RETENTION_DAYS', 3650));
        $cutoff = now()->subDays(max(1, $days));

        $users = User::query()
            ->where('is_active', false)
            ->where('email', 'not like', 'anonymized_%')
            ->where(function ($q) use ($cutoff) {
                $q->where('last_login_at', '<', $cutoff)
                    ->orWhere(function ($inner) use ($cutoff) {
                        $inner->whereNull('last_login_at')->where('created_at', '<', $cutoff);
                    });
            })
            ->limit(200)
            ->get();

        $count = 0;
        foreach ($users as $user) {
            if ($anonymizer->anonymizeUser($user->id)) {
                $count++;
            }
        }

        $this->info("Comptes anonymisés : {$count} (seuil {$days} jours).");

        return self::SUCCESS;
    }
}
