<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RattrapageDecisionMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $studentName;
    public string $moduleName;
    public string $filiereName;
    public string $decision;
    public string $reason;
    public ?string $decisionNote;

    /**
     * Create a new message instance.
     */
    public function __construct(
        string $studentName,
        string $moduleName,
        string $filiereName,
        string $decision,
        string $reason,
        ?string $decisionNote = null
    ) {
        $this->studentName  = $studentName;
        $this->moduleName   = $moduleName;
        $this->filiereName  = $filiereName;
        $this->decision     = $decision;
        $this->reason       = $reason;
        $this->decisionNote = $decisionNote;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->decision === 'Accordé'
            ? '✅ Rattrapage Accordé — ' . $this->moduleName
            : '❌ Rattrapage Refusé — ' . $this->moduleName;

        return new Envelope(
            from: new \Illuminate\Mail\Mailables\Address(
                config('mail.from.address', 'no-reply@benadadarentcar.com'),
                config('mail.from.name', 'ENCG Portail')
            ),
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.rattrapage_decision',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
