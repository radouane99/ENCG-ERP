<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RattrapageConvocationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $studentName;
    public string $moduleName;
    public string $moduleCode;
    public string $seanceCode;
    public string $professorName;
    public string $date;
    public string $timeSlot;
    public string $room;
    public ?string $notes;

    /**
     * Create a new message instance.
     */
    public function __construct(
        string $studentName,
        string $moduleName,
        string $moduleCode,
        string $seanceCode,
        string $professorName,
        string $date,
        string $timeSlot,
        string $room,
        ?string $notes = null
    ) {
        $this->studentName = $studentName;
        $this->moduleName = $moduleName;
        $this->moduleCode = $moduleCode;
        $this->seanceCode = $seanceCode;
        $this->professorName = $professorName;
        $this->date = $date;
        $this->timeSlot = $timeSlot;
        $this->room = $room;
        $this->notes = $notes;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(
                config('mail.from.address', 'noreply@encg-fes.ac.ma'),
                config('mail.from.name', 'ENCG Portail')
            ),
            subject: "📢 Convocation Obligatoire : Séance de Rattrapage — {$this->moduleName} ({$this->seanceCode})",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.rattrapage_convocation',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
