<?php

namespace App\Console\Commands;

use App\Services\Core\VerifiedDatabaseBackupService;
use Illuminate\Console\Command;

class VerifyDatabaseRestoreCommand extends Command
{
    protected $signature = 'db:verify-restore {archive} {database : Nouvelle base suffixée _restore_test}';

    protected $description = 'Restaurer une archive privée dans une nouvelle base isolée sans écraser de base existante';

    public function handle(VerifiedDatabaseBackupService $backup): int
    {
        try {
            $this->line(json_encode($backup->verifyRestore($this->argument('archive'), $this->argument('database')), JSON_PRETTY_PRINT));

            return self::SUCCESS;
        } catch (\Throwable $e) {
            report($e);
            $this->error($e->getMessage());

            return self::FAILURE;
        }
    }
}
