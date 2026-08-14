<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProfessorDocumentApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function envelope(): Envelope
    {
        $docTitle = $this->data['document_title'] ?? 'Document Officiel';
        return new Envelope(
            subject: "🎓 Votre {$docTitle} a été validé et signé électroniquement — ENCG Fès",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.professor_document_approved',
            with: ['data' => $this->data],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
