<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class StudentTranscriptMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $studentName;
    public string $sessionName;
    public ?string $pdfPath;

    public function __construct(string $studentName, string $sessionName = 'Session Automne 2025/2026', ?string $pdfPath = null)
    {
        $this->studentName = $studentName;
        $this->sessionName = $sessionName;
        $this->pdfPath = $pdfPath;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Relevé de Notes Officiel — ENCG Fès (' . $this->sessionName . ')',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.student_transcript',
            with: [
                'studentName' => $this->studentName,
                'sessionName' => $this->sessionName,
            ],
        );
    }

    public function attachments(): array
    {
        if ($this->pdfPath && file_exists($this->pdfPath)) {
            return [
                Attachment::fromPath($this->pdfPath)
                    ->as('Releve_de_Notes_ENCG.pdf')
                    ->withMime('application/pdf'),
            ];
        }

        return [];
    }
}
