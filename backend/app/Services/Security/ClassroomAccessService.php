<?php

namespace App\Services\Security;

use App\Models\Group;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Schedule;
use App\Models\User;
use App\Services\Academic\AcademicContext;
use Illuminate\Support\Facades\DB;

class ClassroomAccessService
{
    public function authorize(User $user, Module $module, ?Group $group = null, bool $write = false): void
    {
        if ($group) {
            abort_unless((string) $group->filiere_id === (string) $module->filiere_id, 404);
            $effectiveYearId = AcademicContext::yearId() ?? $group->academic_year_id;
            abort_unless((int) $group->academic_year_id === (int) $effectiveYearId
                && (int) $group->semester_number === (int) $module->semester_number, 422, 'Groupe hors du contexte pédagogique.');
        }

        if ($user->hasRole('super-admin')) {
            return;
        }

        abort_unless($user->institution_id && (string) $user->institution_id === (string) $module->institution_id, 403);

        if ($user->hasAnyRole(['admin', 'institution-admin', 'director', 'scolarite'])) {
            return;
        }

        // Check Professor / Instructor Access
        $prof = $user->professor ?? Professor::where('user_id', $user->id)->first();
        $profId = $prof?->id;
        $activeYearId = AcademicContext::yearId() ?? $group?->academic_year_id;

        if ($profId || $user->hasAnyRole(['professor', 'vacataire', 'department-head', 'filiere-head'])) {
            // 1. Pivot module_professor assignment
            if ($profId) {
                $pivotQuery = $module->professors()
                    ->where('professors.id', $profId)
                    ->when($activeYearId, fn ($q) => $q->where('module_professor.academic_year_id', $activeYearId))
                    ->when($group, fn ($q) => $q->where(fn ($sq) => $sq->where('module_professor.group_id', $group->id)->orWhereNull('module_professor.group_id')));

                if ($pivotQuery->exists()) {
                    return;
                }
            }

            // 2. Official Timetable Schedule assignment (schedules table)
            $scheduleQuery = Schedule::where('module_id', $module->id)
                ->where(fn ($q) => $q->where('professor_id', $profId)->orWhere('professor_id', $user->id))
                ->when($group, fn ($q) => $q->where(fn ($sq) => $sq->where('group_id', $group->id)->orWhereNull('group_id')))
                ->when($activeYearId, fn ($q) => $q->where('academic_year_id', $activeYearId));

            if ($scheduleQuery->exists()) {
                return;
            }

            // 3. Approved Professor Substitution (professor_substitutions table)
            if ($profId) {
                $hasSubstitution = DB::table('professor_substitutions')
                    ->where(fn ($q) => $q->where('substitute_professor_id', $profId)->orWhere('substitute_professor_id', $user->id))
                    ->where('module_id', $module->id)
                    ->where('status', 'approved')
                    ->whereDate('start_date', '<=', now())
                    ->whereDate('end_date', '>=', now())
                    ->exists();

                if ($hasSubstitution) {
                    return;
                }
            }

            // 4. Pedagogical Leadership (Coordinator, Department Head, Filiere Head)
            if ($profId && ($module->coordinator_id === $profId || $module->head_professor_id === $profId)) {
                return;
            }

            if ($user->hasAnyRole(['department-head', 'filiere-head']) && $module->filiere_id) {
                return;
            }
        }

        abort_if($write, 403, "Accès Refusé : Vous n'avez pas les permissions nécessaires.");

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
