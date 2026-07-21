<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Enums\ValidationStatus;

class ValidationStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    public $validatable;
    public $newStatus;

    public function __construct($validatable, $newStatus)
    {
        $this->validatable = $validatable;
        $this->newStatus = $newStatus;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        $statusLabel = ValidationStatus::tryFrom($this->newStatus)?->label() ?? $this->newStatus;
        $type = class_basename($this->validatable);

        return (new MailMessage)
                    ->subject("Mise à jour de votre demande : {$type}")
                    ->greeting("Bonjour {$notifiable->first_name},")
                    ->line("Le statut de votre demande ({$type}) a été mis à jour.")
                    ->line("Nouveau statut : **{$statusLabel}**")
                    ->action('Consulter mon dossier', url('/student/dashboard'))
                    ->line("Merci d'utiliser le portail ENCG.");
    }

    public function toArray($notifiable)
    {
        $statusLabel = ValidationStatus::tryFrom($this->newStatus)?->label() ?? $this->newStatus;
        $type = class_basename($this->validatable);

        return [
            'message' => "Le statut de votre {$type} est passé à {$statusLabel}.",
            'validatable_type' => get_class($this->validatable),
            'validatable_id' => $this->validatable->id,
            'status' => $this->newStatus,
        ];
    }
}
