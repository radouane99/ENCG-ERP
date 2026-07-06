<?php

namespace App\Services;

use App\Models\DocumentRequest;
use App\Models\DocumentTemplate;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class DocumentRequestService
{
    public function createRequest(array $data)
    {
        $user = Auth::user();
        
        return DocumentRequest::create([
            'institution_id' => $user->institution_id ?? 1,
            'user_id' => $user->id,
            'document_template_id' => $data['document_template_id'],
            'reference_number' => 'DOC-' . date('Ymd') . '-' . Str::upper(Str::random(6)),
            'status' => 'pending',
            'language' => $data['language'] ?? 'fr',
            'additional_data' => $data['additional_data'] ?? [],
        ]);
    }

    public function updateStatus(DocumentRequest $documentRequest, array $data)
    {
        $documentRequest->update([
            'status' => $data['status'],
            'rejection_reason' => $data['rejection_reason'] ?? null,
            'processed_by' => Auth::id(),
            'processed_at' => now(),
        ]);
        
        if (in_array($data['status'], ['ready', 'rejected'])) {
            $documentRequest->user->notify(new \App\Notifications\DocumentStatusChangedNotification($documentRequest));
        }
        
        return $documentRequest;
    }
}
