<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DocumentRequestStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function envelope(): Envelope
    {
        $isApproved = in_array($this->data['status'] ?? '', ['ready', 'approved'], true);
        $statusText = $isApproved ? 'ACCORDÉE' : 'REFUSÉE';

        return new Envelope(
            subject: "Mise à jour de votre demande d'attestation ({$statusText}) - ENCG Fès",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.document_request_status',
            with: ['data' => $this->data],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
