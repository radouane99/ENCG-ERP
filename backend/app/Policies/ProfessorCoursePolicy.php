<?php

namespace App\Policies;

use App\Models\Group;
use App\Models\Module;
use App\Models\User;
use App\Services\Security\ClassroomAccessService;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class ProfessorCoursePolicy
{
    private function permits(User $user, Module $module, ?Group $group = null): bool
    {
        try {
            app(ClassroomAccessService::class)->authorize($user, $module, $group, write: true);
            return true;
        } catch (HttpExceptionInterface) {
            return false;
        }
    }

    public function viewGroupStudents(User $user, Group $group): bool
    {
        if ($user->hasRole('super-admin')) return true;
        if ((int) $group->filiere?->institution_id !== (int) $user->institution_id) return false;
        if ($user->hasAnyRole(['admin', 'institution-admin', 'director', 'scolarite'])) return true;
        foreach (Module::where('filiere_id', $group->filiere_id)->where('semester_number', $group->semester_number)->get() as $module) {
            if ($this->permits($user, $module, $group)) return true;
        }
        return false;
    }

    public function manageGroupAttendance(User $user, int $groupId): bool
    {
        $group = Group::find($groupId);
        return $group && $this->viewGroupStudents($user, $group);
    }

    public function manageModuleAttendance(User $user, Module $module, Group $group): bool
    {
        return $this->permits($user, $module, $group);
    }

    public function accessModule(User $user, Module $module): bool
    {
        return $this->permits($user, $module);
    }

    public function isProfessorAssignedToGroup(User $user, int $groupId): bool
    {
        return $this->manageGroupAttendance($user, $groupId);
    }

    public function isProfessorAssignedToModule(User $user, int $moduleId): bool
    {
        $module = Module::find($moduleId);
        return $module && $this->permits($user, $module);
    }
}
