<?php

namespace App\Notifications;

use App\Models\DocumentRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DocumentStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $documentRequest;

    public function __construct(DocumentRequest $documentRequest)
    {
        $this->documentRequest = $documentRequest;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $documentName = $this->documentRequest->template->name ?? 'Document';
        $status = $this->documentRequest->status;

        $mailMessage = (new MailMessage)
            ->subject("Mise à jour de votre demande : {$documentName}")
            ->greeting("Bonjour {$notifiable->first_name},");

        if ($status === 'ready') {
            $mailMessage->line("Votre demande pour le document '{$documentName}' a été traitée avec succès et le document est prêt.")
                        ->action('Consulter mes documents', url('/student-portal/documents'))
                        ->line('Vous pouvez le télécharger depuis votre espace étudiant.');
        } elseif ($status === 'rejected') {
            $reason = $this->documentRequest->rejection_reason ?? 'Non spécifiée';
            $mailMessage->line("Votre demande pour le document '{$documentName}' a malheureusement été refusée.")
                        ->line("Motif du refus : {$reason}")
                        ->line('Veuillez contacter le service administratif pour plus de détails.');
        }

        return $mailMessage->line('Merci de votre confiance.');
    }
}
