<?php

namespace App\Policies;

use App\Models\Internship;
use App\Models\User;
use App\Support\ChecksStaffAccess;

class InternshipPolicy
{
    use ChecksStaffAccess;

    public function viewAny(User $user): bool
    {
        if ($user->hasRole('student')) {
            return true;
        }

        return $this->hasPermissionOrRole($user, 'internships.view', [
            'admin', 'super-admin', 'institution-admin', 'director',
            'department-head', 'filiere-head', 'professor', 'scolarite',
        ]);
    }

    public function view(User $user, Internship $internship): bool
    {
        if ($user->hasRole('student')) {
            return (int) $user->student?->id === (int) $internship->student_id;
        }

        return $this->viewAny($user);
    }

    public function update(User $user, Internship $internship): bool
    {
        return $this->hasPermissionOrRole($user, 'internships.validate', [
            'admin', 'super-admin', 'institution-admin', 'director',
            'department-head', 'filiere-head', 'scolarite',
        ]);
    }
}
