<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProfessorAvailabilitySurveyMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $surveyData;

    /**
     * Create a new message instance.
     */
    public function __construct(array $surveyData)
    {
        $this->surveyData = $surveyData;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'ENCG Fès - Saisie de vos Disponibilités de Surveillance d\'Examens',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.professor_availability_survey',
            with: $this->surveyData,
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
