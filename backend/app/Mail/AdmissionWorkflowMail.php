<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdmissionWorkflowMail extends Mailable
{
    use Queueable, SerializesModels;
    public function __construct(public string $reference, public string $eventType, public string $link) {}
    public function envelope(): Envelope { return new Envelope(subject: 'ENCG — Suivi de votre dossier '.$this->reference); }
    public function content(): Content { return new Content(view: 'emails.admission-workflow'); }
    public function attachments(): array { return []; }
}
