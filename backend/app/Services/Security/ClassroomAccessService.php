<?php

namespace App\Services\Security;

use App\Models\Group;
use App\Models\Module;
use App\Models\User;
use App\Services\Academic\AcademicContext;

class ClassroomAccessService
{
    public function authorize(User $user, Module $module, ?Group $group = null, bool $write = false): void
    {
        if ($group) {
            abort_unless((string) $group->filiere_id === (string) $module->filiere_id, 404);
            abort_unless((int) $group->academic_year_id === AcademicContext::yearId()
                && (int) $group->semester_number === (int) $module->semester_number, 422, 'Groupe hors du contexte pédagogique.');
        }
        if ($user->hasRole('super-admin')) {
            return;
        }
        abort_unless($user->institution_id && (string) $user->institution_id === (string) $module->institution_id, 403);
        if ($user->hasAnyRole(['admin', 'institution-admin', 'director', 'scolarite'])) {
            return;
        }
        if ($user->professor && $module->professors()->where('professors.id', $user->professor->id)->where('module_professor.academic_year_id', AcademicContext::yearId())
            ->when($group, fn ($q) => $q->where(fn ($q) => $q->where('module_professor.group_id', $group->id)->orWhereNull('module_professor.group_id')))->exists()) {
            return;
        }
        abort_if($write, 403);
        $student = $user->student;
        abort_unless($student, 403);
        $pathway = $student->pathways()->where('is_current', true)->where('academic_year_id', AcademicContext::yearId())->where('current_semester', $module->semester_number)->where('filiere_id', $module->filiere_id)
            ->when($group, fn ($q) => $q->where('group_id', $group->id))->exists();
        $registration = $student->registrations()->where('semester_number', $module->semester_number)->where('filiere_id', $module->filiere_id)
            ->whereHas('academicYear', fn ($q) => $q->where('is_current', true))
            ->when($group, fn ($q) => $q->where('group_id', $group->id))->exists();
        abort_unless($pathway || $registration, 403);
    }
}
