<?php

namespace App\Policies;

use App\Models\Complaint;
use App\Models\User;
use App\Support\ChecksStaffAccess;

class ComplaintPolicy
{
    use ChecksStaffAccess;

    public function viewAny(User $user): bool
    {
        if ($user->hasRole('student')) {
            return true;
        }

        return $this->hasPermissionOrRole($user, 'students.view', [
            'admin', 'super-admin', 'institution-admin', 'director',
            'department-head', 'filiere-head', 'scolarite',
        ]);
    }

    public function view(User $user, Complaint $complaint): bool
    {
        if ($user->hasRole('student')) {
            return (int) $user->student?->id === (int) $complaint->student_id;
        }

        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('student') || $this->viewAny($user);
    }

    public function update(User $user, Complaint $complaint): bool
    {
        return $this->hasPermissionOrRole($user, 'students.edit', [
            'admin', 'super-admin', 'institution-admin', 'director', 'scolarite',
        ]);
    }
}
