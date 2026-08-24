<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DirectionRiskDigestMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  list<array<string, mixed>>  $warnings
     */
    public function __construct(
        public array $warnings,
        public int $courseAbsences,
        public int $modulesAtRisk
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Digest risques académiques — ENCG Fès',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.direction_risk_digest',
        );
    }
}
