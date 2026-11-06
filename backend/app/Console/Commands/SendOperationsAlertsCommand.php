<?php

namespace App\Console\Commands;

use App\Services\Monitoring\OperationsAlertService;
use Illuminate\Console\Command;

class SendOperationsAlertsCommand extends Command
{
    protected $signature = 'operations:send-alerts {--test : Envoyer un test au seul destinataire configuré}';

    protected $description = 'Notifier uniquement les changements des alertes techniques au destinataire configuré';

    public function handle(OperationsAlertService $alerts): int
    {
        try {
            $this->line(json_encode($this->option('test') ? $alerts->sendTest() : $alerts->sendChanges()));

            return self::SUCCESS;
        } catch (\Throwable $exception) {
            // No provider exception payloads, credentials or recipient lists in console output.
            $this->error('Envoi du changement non confirmé; une prochaine exécution réessaiera.');

            return self::FAILURE;
        }
    }
}
