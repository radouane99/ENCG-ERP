<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewDeviceLoginAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $recipientName;

    public string $deviceLabel;

    public string $browserAndOs;

    public string $ipAddress;

    public string $authMethod;

    public string $loggedInAt;

    public function __construct(
        string $recipientName,
        string $deviceLabel,
        string $browserAndOs,
        string $ipAddress,
        string $authMethod,
        string $loggedInAt
    ) {
        $this->recipientName = $recipientName;
        $this->deviceLabel = $deviceLabel;
        $this->browserAndOs = $browserAndOs;
        $this->ipAddress = $ipAddress;
        $this->authMethod = $authMethod;
        $this->loggedInAt = $loggedInAt;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(
                config('mail.from.address', 'noreply@encg-fes.ac.ma'),
                config('mail.from.name', 'ENCG Portail')
            ),
            subject: '[Alerte Sécurité ENCG Fès] Connexion détectée depuis un nouvel appareil',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new_device_login_alert',
            with: [
                'recipientName' => $this->recipientName,
                'deviceLabel' => $this->deviceLabel,
                'browserAndOs' => $this->browserAndOs,
                'ipAddress' => $this->ipAddress,
                'authMethod' => $this->authMethod,
                'loggedInAt' => $this->loggedInAt,
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
