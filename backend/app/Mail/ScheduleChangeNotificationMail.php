<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ScheduleChangeNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $changeData;

    /**
     * Create a new message instance.
     */
    public function __construct(array $changeData)
    {
        $this->changeData = $changeData;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'ENCG Fès - Modification d\'Emploi du Temps / Séance de Rattrapage',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.schedule_change_notification',
            with: $this->changeData,
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
