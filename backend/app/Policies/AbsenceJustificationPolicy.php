<?php

namespace App\Policies;

use App\Models\AbsenceJustification;
use App\Models\User;
use App\Support\ChecksStaffAccess;

class AbsenceJustificationPolicy
{
    use ChecksStaffAccess;

    public function viewAny(User $user): bool
    {
        if ($user->hasRole('student')) {
            return true;
        }

        return $this->hasPermissionOrRole($user, 'students.view', [
            'admin', 'super-admin', 'institution-admin', 'director',
            'department-head', 'filiere-head', 'professor', 'scolarite',
        ]);
    }

    public function view(User $user, AbsenceJustification $absenceJustification): bool
    {
        if ($user->hasRole('student')) {
            return (int) $user->student?->id === (int) $absenceJustification->student_id;
        }

        return $this->viewAny($user);
    }

    public function update(User $user, AbsenceJustification $absenceJustification): bool
    {
        return $this->hasPermissionOrRole($user, 'students.edit', [
            'admin', 'super-admin', 'institution-admin', 'director', 'scolarite',
        ]);
    }

    public function delete(User $user, AbsenceJustification $absenceJustification): bool
    {
        return $this->hasPermissionOrRole($user, 'students.delete', [
            'admin', 'super-admin', 'institution-admin', 'director',
        ]);
    }
}
