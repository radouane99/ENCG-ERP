<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConvocationEmail extends Mailable
{
    use Queueable, SerializesModels;

    public array $examData;
    public string $pdfContent;

    /**
     * Create a new message instance.
     */
    public function __construct(array $examData, string $pdfContent)
    {
        $this->examData = $examData;
        $this->pdfContent = $pdfContent;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Convocation Officielle - Examens ENCG',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.convocation',
            with: ['emailData' => $this->examData],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->pdfContent, 'Convocation.pdf')
                    ->withMime('application/pdf'),
        ];
    }
}
