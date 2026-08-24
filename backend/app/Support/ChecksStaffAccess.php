<?php

namespace App\Support;

use App\Models\User;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;

trait ChecksStaffAccess
{
    protected function hasPermissionOrRole(User $user, string $permission, array $roles): bool
    {
        try {
            if ($user->hasPermissionTo($permission)) {
                return true;
            }
        } catch (PermissionDoesNotExist) {
            // Permissions may not be seeded in every environment.
        }

        return $user->hasAnyRole($roles);
    }
}
