<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class OperationsAlertMail extends Mailable
{
    public function __construct(public array $newAlerts, public array $resolvedAlerts, public bool $testDelivery = false) {}

    public function build(): self
    {
        return $this->subject($this->testDelivery ? 'ENCG ERP — Test du relais des alertes techniques' : 'ENCG ERP — Surveillance : '.count($this->newAlerts).' nouvelle(s), '.count($this->resolvedAlerts).' résolue(s)')
            ->view('emails.operations-alerts');
    }
}
