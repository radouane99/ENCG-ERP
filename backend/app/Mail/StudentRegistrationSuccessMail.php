<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class StudentRegistrationSuccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $studentName;
    public string $cne;
    public string $cin;
    public string $filiere;
    public ?string $pdfPath;
    public string $academicYear;

    public function __construct(
        string $studentName,
        string $cne,
        string $cin,
        string $filiere,
        ?string $pdfPath = null,
        string $academicYear = '2026-2027'
    ) {
        $this->studentName = $studentName;
        $this->cne = $cne;
        $this->cin = $cin;
        $this->filiere = $filiere;
        $this->pdfPath = $pdfPath;
        $this->academicYear = $academicYear;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🎉 Confirmation de Pré-Inscription — ENCG Fès (' . $this->academicYear . ')',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.student_registration_success',
            with: [
                'studentName' => $this->studentName,
                'cne'         => $this->cne,
                'cin'         => $this->cin,
                'filiere'     => $this->filiere,
                'academicYear'=> $this->academicYear,
            ],
        );
    }

    public function attachments(): array
    {
        if ($this->pdfPath && file_exists($this->pdfPath)) {
            return [
                Attachment::fromPath($this->pdfPath)
                    ->as('Attestation_Inscription_ENCG_' . $this->cne . '.pdf')
                    ->withMime('application/pdf'),
            ];
        }

        return [];
    }
}
