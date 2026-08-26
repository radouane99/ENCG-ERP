<?php

namespace App\Policies;

use App\Models\Deliberation;
use App\Models\User;
use App\Support\ChecksStaffAccess;

class DeliberationPolicy
{
    use ChecksStaffAccess;

    public function viewAny(User $user): bool
    {
        return $this->hasPermissionOrRole($user, 'grades.view', [
            'admin', 'super-admin', 'institution-admin', 'director',
            'department-head', 'filiere-head', 'scolarite',
        ]);
    }

    public function view(User $user, Deliberation $deliberation): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->hasPermissionOrRole($user, 'grades.edit', [
            'admin', 'super-admin', 'institution-admin', 'director',
            'department-head', 'filiere-head',
        ]);
    }

    public function update(User $user, Deliberation $deliberation): bool
    {
        return $this->create($user);
    }
}
