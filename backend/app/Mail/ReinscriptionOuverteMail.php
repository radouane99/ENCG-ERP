<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Domain\Student\Models\Student;

/**
 * Email sent when reinscription opens for a student (Recommendation #4).
 * Compatible with Resend transport — uses Blade view.
 */
class ReinscriptionOuverteMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $studentName;
    public string $cne;
    public bool   $isReminder;

    public function __construct(
        public readonly Student $student,
        public readonly string $academicYear,
        bool $isReminder = false
    ) {
        $this->studentName = strtoupper($student->last_name) . ' ' . $student->first_name;
        $this->cne         = $student->cne ?? '';
        $this->isReminder  = $isReminder;
    }

    public function envelope(): Envelope
    {
        $subject = $this->isReminder
            ? "⏰ Rappel : Confirmez votre réinscription {$this->academicYear} — ENCG Fès"
            : "🔁 Réinscription {$this->academicYear} est ouverte — ENCG Fès";

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.reinscription_ouverte');
    }

    public function attachments(): array
    {
        return [];
    }
}
