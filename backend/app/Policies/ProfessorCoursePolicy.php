<?php

namespace App\Policies;

use App\Models\Group;
use App\Models\Module;
use App\Models\User;
use App\Support\ChecksStaffAccess;
use Illuminate\Support\Facades\DB;

/**
 * ProfessorCoursePolicy
 *
 * Row-level security for professor portal endpoints.
 * Enforces that a professor can only access groups and modules
 * they are officially assigned to via Schedule or module_professor table.
 *
 * Admin/director roles bypass all checks (they have institution-wide access).
 */
class ProfessorCoursePolicy
{
    use ChecksStaffAccess;

    /**
     * Roles that bypass professor-level ownership checks and have institution-wide access.
     */
    protected array $adminRoles = [
        'super-admin',
        'institution-admin',
        'admin',
        'director',
        'department-head',
        'filiere-head',
        'scolarite',
        'pedagogy_officer',
    ];

    /**
     * Check whether the authenticated user can view student data for a given group.
     * A professor/vacataire can only access groups they teach.
     */
    public function viewGroupStudents(User $user, Group $group): bool
    {
        // Admins and senior staff have unrestricted access.
        if ($user->hasAnyRole($this->adminRoles)) {
            return true;
        }

        return $this->isProfessorAssignedToGroup($user, $group->id);
    }

    /**
     * Check whether the authenticated user can record or view attendance for a given group.
     */
    public function manageGroupAttendance(User $user, int $groupId): bool
    {
        if ($user->hasAnyRole($this->adminRoles)) {
            return true;
        }

        return $this->isProfessorAssignedToGroup($user, $groupId);
    }

    /**
     * Check whether the authenticated user is assigned to a given module.
     * Used for grade entry, textbook, and service-fait PDFs.
     */
    public function accessModule(User $user, Module $module): bool
    {
        if ($user->hasAnyRole($this->adminRoles)) {
            return true;
        }

        return $this->isProfessorAssignedToModule($user, $module->id);
    }

    /**
     * Core check: is this user (professor or vacataire) assigned to the given group?
     * Checks both the `schedules` table and the `module_professor` pivot table.
     */
    public function isProfessorAssignedToGroup(User $user, int $groupId): bool
    {
        $profId = $user->professor?->id;
        $userId = $user->id;

        // Check 1: Direct schedule assignment (most reliable source)
        $inSchedule = DB::table('schedules')
            ->where('group_id', $groupId)
            ->where(function ($q) use ($profId, $userId) {
                if ($profId) {
                    $q->where('professor_id', $profId);
                }
                $q->orWhere('professor_id', $userId);
            })
            ->where('is_active', true)
            ->exists();

        if ($inSchedule) {
            return true;
        }

        // Check 2: module_professor pivot (explicit academic year assignment)
        if ($profId) {
            $inModuleProfessor = DB::table('module_professor')
                ->where('professor_id', $profId)
                ->where('group_id', $groupId)
                ->exists();

            if ($inModuleProfessor) {
                return true;
            }

            // Check 3: module_professor without group but module belongs to group's filiere
            $groupFiliereId = DB::table('groups')
                ->where('id', $groupId)
                ->value('filiere_id');

            if ($groupFiliereId) {
                $assignedViaFiliere = DB::table('module_professor as mp')
                    ->join('modules as m', 'mp.module_id', '=', 'm.id')
                    ->where('mp.professor_id', $profId)
                    ->where('m.filiere_id', $groupFiliereId)
                    ->whereNull('mp.group_id')
                    ->exists();

                if ($assignedViaFiliere) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Core check: is this user assigned to a specific module?
     */
    public function isProfessorAssignedToModule(User $user, int $moduleId): bool
    {
        $profId = $user->professor?->id;
        $userId = $user->id;

        // Check via schedules
        $inSchedule = DB::table('schedules')
            ->where('module_id', $moduleId)
            ->where(function ($q) use ($profId, $userId) {
                if ($profId) {
                    $q->where('professor_id', $profId);
                }
                $q->orWhere('professor_id', $userId);
            })
            ->where('is_active', true)
            ->exists();

        if ($inSchedule) {
            return true;
        }

        // Check via module_professor pivot
        if ($profId) {
            return DB::table('module_professor')
                ->where('professor_id', $profId)
                ->where('module_id', $moduleId)
                ->exists();
        }

        return false;
    }
}
