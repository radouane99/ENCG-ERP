<?php

namespace App\Console\Commands;

use App\Services\Core\VerifiedDatabaseBackupService;
use Illuminate\Console\Command;

class BackupDatabaseDailyCommand extends Command
{
    protected $signature = 'db:backup-daily {--silent : Ne pas afficher le manifeste}';

    protected $description = 'Créer une archive PostgreSQL privée avec empreinte et contrôle de lisibilité';

    public function handle(VerifiedDatabaseBackupService $backup): int
    {
        try {
            $manifest = $backup->create();
            if (! $this->option('silent')) {
                $this->line(json_encode($manifest, JSON_PRETTY_PRINT));
            }

            return self::SUCCESS;
        } catch (\Throwable $e) {
            report($e);
            $this->error($e->getMessage());

            return self::FAILURE;
        }
    }
}
