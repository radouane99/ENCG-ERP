<?php

namespace App\Policies;

use App\Models\Grade;
use App\Models\User;
use App\Support\ChecksStaffAccess;

class GradePolicy
{
    use ChecksStaffAccess;

    public function viewAny(User $user): bool
    {
        return $this->hasPermissionOrRole($user, 'grades.view', [
            'admin', 'super-admin', 'institution-admin', 'director',
            'department-head', 'filiere-head', 'professor', 'vacataire', 'scolarite', 'student',
        ]);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Grade $grade): bool
    {
        if ($user->hasRole('student')) {
            return $user->student?->id === $grade->student_id;
        }

        return $this->hasPermissionOrRole($user, 'grades.view', [
            'admin', 'super-admin', 'institution-admin', 'director',
            'department-head', 'filiere-head', 'professor', 'vacataire',
        ]);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $this->hasPermissionOrRole($user, 'grades.enter', [
            'admin', 'super-admin', 'institution-admin', 'director',
            'department-head', 'filiere-head', 'professor', 'vacataire', 'scolarite',
        ]);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Grade $grade): bool
    {
        // Check if the exam session is locked
        if ($grade->examSession && $grade->examSession->is_locked) {
            return false;
        }

        // Only authorized personnel can enter/edit grades
        return $this->hasPermissionOrRole($user, 'grades.edit', [
            'admin', 'super-admin', 'institution-admin', 'director',
            'department-head', 'filiere-head', 'professor', 'vacataire',
        ]);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Grade $grade): bool
    {
        return $this->hasPermissionOrRole($user, 'grades.delete', [
            'admin', 'super-admin', 'institution-admin', 'director',
        ]);
    }
}
