<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Grade;

class GradePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('grades.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Grade $grade): bool
    {
        if ($user->hasRole('student')) {
            return $user->student->id === $grade->student_id;
        }

        return $user->hasPermissionTo('grades.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('grades.enter');
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
        return $user->hasPermissionTo('grades.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Grade $grade): bool
    {
        return $user->hasPermissionTo('grades.delete');
    }
}
