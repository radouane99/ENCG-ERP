<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Queue\SerializesModels;

class ProfessorAssignmentNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $profData;

    public function __construct(array $profData)
    {
        $this->profData = $profData;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(
                config('mail.from.address', 'no-reply@benadadarentcar.com'),
                config('mail.from.name', 'ENCG Portail')
            ),
            subject: '🏛️ ENCG Fès — Notification Officielle d\'Affectation Pédagogique 2026/2027',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.professor_assignment',
            with: [
                'profName' => $this->profData['profName'] ?? 'Enseignant',
                'assignments' => $this->profData['assignments'] ?? [],
                'totalHours' => $this->profData['totalHours'] ?? 0,
                'weeklyHours' => $this->profData['weeklyHours'] ?? 0,
                'academicYear' => $this->profData['academicYear'] ?? '2026/2027',
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
