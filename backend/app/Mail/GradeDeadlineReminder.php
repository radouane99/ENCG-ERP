<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GradeDeadlineReminder extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $professorName,
        public string $endDate,
        public string $sessionLabel = 'Saisie des Notes'
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '⚠️ Rappel : Clôture de la saisie des notes — ENCG Fès',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.grade-deadline-reminder',
            with: [
                'professorName' => $this->professorName,
                'endDate'       => $this->endDate,
                'sessionLabel'  => $this->sessionLabel,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
