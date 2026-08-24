<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class ProfessorAssignmentNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $profData;

    public ?string $pdfContent;

    public function __construct(array $profData, ?string $pdfContent = null)
    {
        $this->profData = $profData;
        $this->pdfContent = $pdfContent;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(
                config('mail.from.address', 'noreply@encg-fes.ac.ma'),
                config('mail.from.name', 'ENCG Portail')
            ),
            subject: '🏛️ ENCG Fès — Ordre de Service & Notification Officielle d\'Affectation Pédagogique 2026/2027',
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
        if ($this->pdfContent) {
            $profName = $this->profData['profName'] ?? 'Enseignant';
            $safeName = Str::slug($profName);

            return [
                Attachment::fromData(fn () => $this->pdfContent, "Ordre_De_Service_A4_{$safeName}.pdf")
                    ->withMime('application/pdf'),
            ];
        }

        return [];
    }
}
