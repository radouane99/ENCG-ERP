<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ModuleResultMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $studentName, public string $moduleName, public string $year, private string $pdfBytes) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Résultats du module '.$this->moduleName.' — '.$this->year);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.module_result');
    }

    public function attachments(): array
    {
        return [Attachment::fromData(fn () => $this->pdfBytes, 'Resultats_Module.pdf')->withMime('application/pdf')];
    }
}
