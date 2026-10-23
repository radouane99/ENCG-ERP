<?php

namespace App\Services\Security;

use App\Models\Group;
use App\Models\Module;
use App\Models\User;

class ClassroomAccessService
{
    public function authorize(User $user, Module $module, ?Group $group = null, bool $write = false): void
    {
        if ($group) {
            abort_unless((string) $group->filiere_id === (string) $module->filiere_id, 404);
        }
        if ($user->hasRole('super-admin')) {
            return;
        }
        abort_unless($user->institution_id && (string) $user->institution_id === (string) $module->institution_id, 403);
        if ($user->hasAnyRole(['admin', 'institution-admin', 'director', 'scolarite'])) {
            return;
        }
        if ($user->professor && $module->professors()->where('professors.id', $user->professor->id)->exists()) {
            return;
        }
        abort_if($write, 403);
        $student = $user->student;
        abort_unless($student, 403);
        $pathway = $student->pathways()->where('is_current', true)->where('filiere_id', $module->filiere_id)
            ->when($group, fn ($q) => $q->where('group_id', $group->id))->exists();
        $registration = $student->registrations()->where('filiere_id', $module->filiere_id)
            ->whereHas('academicYear', fn ($q) => $q->where('is_current', true))
            ->when($group, fn ($q) => $q->where('group_id', $group->id))->exists();
        abort_unless($pathway || $registration, 403);
    }
}
