<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

final class ManageUserAccessAction
{
    private const PROTECTED = ['super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director', 'admin'];

    public function assertManageable(User $actor, User $target): void
    {
        abort_unless((int) $actor->institution_id === (int) $target->institution_id, 404);
        abort_if(! $actor->hasAnyRole(['super-admin', 'super_admin']) && $target->hasAnyRole(self::PROTECTED) && $actor->id !== $target->id, 403, 'Ce compte relève de l’administration supérieure.');
    }

    public function execute(User $actor, User $target, array $roles, ?array $permissions = null): User
    {
        return DB::transaction(function () use ($actor, $target, $roles, $permissions) {
            Role::whereIn('name', ['super-admin', 'super_admin'])->lockForUpdate()->get();
            $target = User::whereKey($target->id)->lockForUpdate()->firstOrFail();
            $this->assertManageable($actor, $target);
            $super = $actor->hasAnyRole(['super-admin', 'super_admin']);
            abort_unless($super || $actor->hasAnyRole(['institution-admin', 'institution_admin', 'director']) || $actor->can('roles.manage'), 403);
            $roles = array_values(array_unique($roles));
            abort_unless(Role::whereIn('name', $roles)->where('guard_name', 'sanctum')->count() === count($roles), 422, 'Rôle inconnu.');
            $before = $target->roles->pluck('name')->sort()->values()->all();
            if (! $super) {
                abort_if(count(array_intersect($roles, self::PROTECTED)) > 0 || $actor->id === $target->id, 403, 'Privilèges non délégables.');
                foreach ($roles as $name) {
                    $role = Role::findByName($name, 'sanctum');
                    abort_if($role->permissions->contains(fn ($p) => in_array($p->name, ['roles.manage', 'users.manage', 'system.settings'], true) || ! $actor->can($p->name)), 403, 'Ce rôle contient des droits non délégables.');
                }
            }
            if ($target->hasAnyRole(['super-admin', 'super_admin']) && ! array_intersect($roles, ['super-admin', 'super_admin'])) {
                abort_unless(User::whereHas('roles', fn ($q) => $q->whereIn('name', ['super-admin', 'super_admin']))->where('id', '!=', $target->id)->exists(), 422, 'Le dernier super administrateur doit être conservé.');
            }
            if ($permissions !== null) {
                $permissions = array_values(array_unique($permissions));
                abort_unless(Permission::whereIn('name', $permissions)->where('guard_name', 'sanctum')->count() === count($permissions), 422, 'Permission inconnue.');
                if (! $super) {
                    foreach ($permissions as $permission) {
                        abort_unless(! in_array($permission, ['roles.manage', 'users.manage', 'system.settings'], true) && $actor->can($permission), 403, 'Permission non délégable.');
                    }
                }
            }
            $oldPermissions = $target->getDirectPermissions()->pluck('name')->all();
            $target->syncRoles($roles);
            if ($permissions !== null) {
                $target->syncPermissions($permissions);
            }
            activity()->causedBy($actor)->performedOn($target)->withProperties(['roles_before' => $before, 'roles_after' => $roles, 'permissions_before' => $oldPermissions, 'permissions_after' => $permissions ?? $oldPermissions])->log('user_access_changed');

            return $target->load('roles', 'permissions');
        });
    }
}
