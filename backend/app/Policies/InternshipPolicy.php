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
        if ((int) $internship->student->institution_id !== (int) $user->institution_id) return false;
        if ($user->hasRole('student')) {
            return (int) $user->student?->id === (int) $internship->student_id;
        }

        return \App\Support\InternshipAccess::staff($user) || ($user->professor && ((int) $internship->supervisor_id === (int) $user->professor->id || $internship->soutenance()->where(fn ($q) => $q->where('president_id', $user->professor->id)->orWhere('examiner_id', $user->professor->id)->orWhere('supervisor_id', $user->professor->id))->exists()));
    }

    public function update(User $user, Internship $internship): bool
    {
        if ((int) $internship->student->institution_id !== (int) $user->institution_id) return false;
        return $this->hasPermissionOrRole($user, 'internships.validate', [
            'admin', 'super-admin', 'institution-admin', 'director',
            'department-head', 'filiere-head', 'scolarite',
        ]);
    }
}
