<?php
namespace App\Mail;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\{Attachment, Content, Envelope};
use Illuminate\Queue\SerializesModels;
class RenewalReminderMail extends Mailable
{
    use Queueable, SerializesModels;
    public function __construct(public string $studentName, public string $year) { $this->afterCommit(); }
    public function envelope(): Envelope { return new Envelope(subject: 'Confirmation de votre réinscription — '.$this->year); }
    public function content(): Content { return new Content(view: 'emails.renewal_reminder'); }
    public function attachments(): array { return []; }
}