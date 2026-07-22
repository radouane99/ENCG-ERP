<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProfessorConvocationEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $emailData;
    public $pdfContent;

    public function __construct($emailData, $pdfContent)
    {
        $this->emailData = $emailData;
        $this->pdfContent = $pdfContent;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Votre Planning de Surveillance - ENCG Fès',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.convocation_prof',
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->pdfContent, 'Planning_Surveillance.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
