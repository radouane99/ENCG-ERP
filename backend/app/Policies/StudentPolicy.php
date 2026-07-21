<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Student;

class StudentPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('students.view');
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

        // Must belong to the same institution
        if ($user->institution_id !== $student->institution_id) {
            return false;
        }

        return $user->hasPermissionTo('students.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('students.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Student $student): bool
    {
        if ($user->institution_id !== $student->institution_id) {
            return false;
        }

        return $user->hasPermissionTo('students.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Student $student): bool
    {
        if ($user->institution_id !== $student->institution_id) {
            return false;
        }

        return $user->hasPermissionTo('students.delete');
    }
}
