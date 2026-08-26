<?php

namespace App\Policies;

use App\Models\DocumentRequest;
use App\Models\User;
use App\Support\ChecksStaffAccess;

class DocumentRequestPolicy
{
    use ChecksStaffAccess;

    public function viewAny(User $user): bool
    {
        if ($user->hasRole('student')) {
            return true;
        }

        return $this->hasPermissionOrRole($user, 'documents.view', [
            'admin', 'super-admin', 'institution-admin', 'director',
            'department-head', 'filiere-head', 'scolarite', 'hr-officer',
        ]);
    }

    public function view(User $user, DocumentRequest $documentRequest): bool
    {
        if ($user->hasRole('student')) {
            return (int) $user->student?->id === (int) $documentRequest->student_id;
        }

        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('student') || $this->viewAny($user);
    }

    public function update(User $user, DocumentRequest $documentRequest): bool
    {
        return $this->hasPermissionOrRole($user, 'documents.process', [
            'admin', 'super-admin', 'institution-admin', 'director', 'scolarite',
        ]);
    }
}
