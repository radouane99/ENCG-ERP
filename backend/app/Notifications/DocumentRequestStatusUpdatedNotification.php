<?php

namespace App\Notifications;

use App\Models\DocumentRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DocumentRequestStatusUpdatedNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected DocumentRequest $documentRequest
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $docType = $this->documentRequest->documentType?->name ?? 'Document administratif';
        $status = $this->documentRequest->status;

        $isReady = in_array($status, ['ready', 'approved', 'collected'], true);
        $isRejected = in_array($status, ['rejected', 'refuse'], true);

        if ($isReady) {
            $title = "Document prêt : {$docType}";
            $message = "Votre demande pour \"{$docType}\" a été validée par la scolarité. Votre document certifié avec QR Code est disponible au téléchargement.";
            $type = 'document_approved';
        } elseif ($isRejected) {
            $title = "Demande refusée : {$docType}";
            $reason = is_array($this->documentRequest->admin_notes) ? ($this->documentRequest->admin_notes['reason'] ?? $this->documentRequest->admin_notes['rejection_reason'] ?? 'Non spécifié') : ($this->documentRequest->admin_notes ?: 'Non spécifié');
            $message = "Votre demande pour \"{$docType}\" a été rejetée. Motif : {$reason}.";
            $type = 'danger';
        } else {
            $title = "Mise à jour : {$docType}";
            $message = "Le statut de votre demande de \"{$docType}\" est passé à : " . ucfirst($status) . ".";
            $type = 'info';
        }

        return [
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'action_url' => '/student/documents',
            'document_request_id' => $this->documentRequest->id,
            'status' => $status,
        ];
    }
}
