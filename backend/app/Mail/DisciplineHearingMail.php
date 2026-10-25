<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DisciplineHearingMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $studentName, public string $hearingDate, public string $hearingRoom, private string $pdf, public int $incidentId) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Convocation à une audition — ENCG Fès');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.discipline_hearing');
    }

    public function attachments(): array
    {
        return [Attachment::fromData(fn () => $this->pdf, 'Convocation_Conseil_'.$this->incidentId.'.pdf')->withMime('application/pdf')];
    }
}
