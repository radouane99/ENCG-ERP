<?php

namespace App\Notifications;

use App\Models\DocumentRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewDocumentRequestAdminNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected DocumentRequest $documentRequest,
        protected ?User $studentUser = null
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $docType = $this->documentRequest->documentType?->name ?? 'Document';
        $studentName = $this->studentUser?->name ?? 'Un étudiant';
        $studentCne = $this->documentRequest->student?->cne ?? '';

        return [
            'title' => "Nouvelle demande : {$docType}",
            'message' => "{$studentName}".($studentCne ? " ({$studentCne})" : '')." a soumis une demande de \"{$docType}\" nécessitant validation.",
            'type' => 'document_pending',
            'action_url' => '/admin/document-requests',
            'document_request_id' => $this->documentRequest->id,
            'student_id' => $this->documentRequest->student_id,
        ];
    }
}
