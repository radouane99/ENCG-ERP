<?php

namespace App\Notifications;

use App\Models\DocumentRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DocumentRequestCreatedNotification extends Notification
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

        return [
            'title' => 'Demande de document enregistrée',
            'message' => "Votre demande de \"{$docType}\" a été enregistrée avec succès. Elle est en cours de traitement par le service scolarité.",
            'type' => 'document_request',
            'action_url' => '/student/documents',
            'document_request_id' => $this->documentRequest->id,
            'status' => $this->documentRequest->status,
        ];
    }
}
