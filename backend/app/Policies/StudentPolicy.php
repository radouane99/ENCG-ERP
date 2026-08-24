<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;
use App\Support\ChecksStaffAccess;

class StudentPolicy
{
    use ChecksStaffAccess;

    public function viewAny(User $user): bool
    {
        return $this->hasPermissionOrRole($user, 'students.view', [
            'admin', 'super-admin', 'institution-admin', 'director',
            'department-head', 'filiere-head', 'professor', 'hr-officer',
        ]);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Student $student): bool
    {
        // A student can only view their own profile
        if ($user->hasRole('student')) {
            return $user->id === $student->user_id;
        }

        if ($user->institution_id && $student->institution_id
            && (int) $user->institution_id !== (int) $student->institution_id) {
            return false;
        }

        return $this->hasPermissionOrRole($user, 'students.view', [
            'admin', 'super-admin', 'institution-admin', 'director',
            'department-head', 'filiere-head', 'professor', 'hr-officer',
        ]);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $this->hasPermissionOrRole($user, 'students.create', [
            'admin', 'super-admin', 'institution-admin', 'director',
        ]);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Student $student): bool
    {
        if ($user->institution_id && $student->institution_id
            && (int) $user->institution_id !== (int) $student->institution_id) {
            return false;
        }

        return $this->hasPermissionOrRole($user, 'students.edit', [
            'admin', 'super-admin', 'institution-admin', 'director', 'hr-officer',
        ]);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Student $student): bool
    {
        if ($user->institution_id && $student->institution_id
            && (int) $user->institution_id !== (int) $student->institution_id) {
            return false;
        }

        return $this->hasPermissionOrRole($user, 'students.delete', [
            'admin', 'super-admin', 'institution-admin',
        ]);
    }
}
