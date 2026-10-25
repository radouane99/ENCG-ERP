<?php

namespace App\Services\Core;

class DocumentOcrAuditorService
{
    public function auditCandidateDocuments(array $candidateData, array $documents): array
    {
        return ['overall_status' => 'needs_review', 'message' => 'Une revue humaine des versions documentaires est requise. Aucun document ne peut être certifié par cette méthode.'];
    }
}
