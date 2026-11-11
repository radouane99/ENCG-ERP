<?php

namespace App\Services\Academic;

use App\Models\Group;
use App\Models\Student;
use Illuminate\Database\Eloquent\Builder;

class ClassroomRosterService
{
    private function members(Group $group, int $institutionId): Builder
    {
        return Student::where('students.institution_id', $institutionId)->where(fn ($q) => $q
            ->whereHas('pathways', fn ($p) => $p->where('academic_year_id', $group->academic_year_id)->where('group_id', $group->id))
            ->orWhereHas('registrations', fn ($r) => $r->where('academic_year_id', $group->academic_year_id)->where('group_id', $group->id)));
    }

    public function students(Group $group, int $institutionId): Builder
    {
        $members = $this->members($group, $institutionId);
        if ($members->exists() || ! preg_match('/^(.*?)-S(\d+)-(G\d+.*)$/i', (string) $group->name, $parts)) {
            return $members;
        }
        // Annual sections share only their exact paired semester, never another level.
        $semester = (int) $parts[2];
        if ($semester !== (int) $group->semester_number || $semester < 1 || $semester > 10) {
            return $members;
        }
        $pairedSemester = $semester % 2 ? $semester + 1 : $semester - 1;
        $twins = Group::where('academic_year_id', $group->academic_year_id)->where('filiere_id', $group->filiere_id)
            ->where('semester_number', $pairedSemester)->where('name', $parts[1].'-S'.$pairedSemester.'-'.$parts[3])->get();

        return $twins->count() === 1 ? $this->members($twins->first(), $institutionId) : $members;
    }
}
