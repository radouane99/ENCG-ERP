<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordlessOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $otpCode,
        public int $ttlMinutes = 10,
        public ?string $ipAddress = null
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🔐 Code de connexion instantanée ENCG Fès : '.$this->otpCode,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.passwordless_otp',
            with: [
                'userName' => $this->user->name ?: trim($this->user->first_name.' '.$this->user->last_name),
                'otpCode' => $this->otpCode,
                'ttlMinutes' => $this->ttlMinutes,
                'ipAddress' => $this->ipAddress ?? 'Non renseignée',
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
