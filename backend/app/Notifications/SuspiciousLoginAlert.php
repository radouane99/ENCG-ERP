<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SuspiciousLoginAlert extends Notification implements ShouldQueue
{
    use Queueable;

    protected string $ipAddress;

    public function __construct(string $ipAddress)
    {
        $this->ipAddress = $ipAddress;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
                    ->subject('Alerte de Sécurité - Nouvelle connexion détectée')
                    ->greeting("Bonjour {$notifiable->first_name},")
                    ->line("Nous avons détecté une connexion à votre compte depuis une nouvelle adresse IP ({$this->ipAddress}).")
                    ->line('Si vous êtes à l\'origine de cette connexion, vous pouvez ignorer ce message.')
                    ->line('Si vous ne reconnaissez pas cette activité, veuillez modifier votre mot de passe immédiatement et contacter l\'administration.')
                    ->action('Accéder au portail', url('/'));
    }
}
