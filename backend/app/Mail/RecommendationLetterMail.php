<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RecommendationLetterMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $studentName;

    public string $professorName;

    public string $letterContent;

    public string $purpose;

    public function __construct(string $studentName, string $professorName, string $letterContent, string $purpose = 'Master / Mobilité')
    {
        $this->studentName = $studentName;
        $this->professorName = $professorName;
        $this->letterContent = $letterContent;
        $this->purpose = $purpose;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(config('mail.from.address', 'noreply@encg-fes.ac.ma'), config('mail.from.name', 'ENCG Portail')),
            subject: "📜 Lettre de Recommandation Officielle ENCG Fès — M./Mme {$this->studentName}"
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.recommendation_letter',
            with: [
                'studentName' => $this->studentName,
                'professorName' => $this->professorName,
                'letterContent' => $this->letterContent,
                'purpose' => $this->purpose,
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
