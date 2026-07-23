<?php

namespace App\Services\Academic;

use App\Models\Group;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class GroupService
{
    /**
     * Get groups with eager loading and optional filtering
     */
    public function getFilteredGroups(array $filters): Collection
    {
        $query = Group::with(['filiere', 'academicYear']);

        if (!empty($filters['filiere_id'])) {
            $query->where('filiere_id', $filters['filiere_id']);
        }
        
        if (!empty($filters['semester'])) {
            $query->where('semester_number', $filters['semester']);
        }

        return $query->get();
    }

    /**
     * Map a collection of groups for the API response
     */
    public function mapGroupCollection(Collection $groups): array
    {
        return $groups->map(fn ($g) => [
            'id'              => $g->id,
            'name'            => $g->name,
            'filiere'         => $g->filiere?->code ?? '—',
            'filiere_id'      => $g->filiere_id,
            'filiere_name'    => $g->filiere?->name ?? '—',
            'semester_number' => $g->semester_number,
            'capacity'        => $g->capacity,
            'current_count'   => $g->current_count ?? 0,
            'academic_year'   => $g->academicYear?->label ?? '—',
            'academic_year_id'=> $g->academic_year_id,
        ])->toArray();
    }

    /**
     * Create a new group
     */
    public function createGroup(array $data): Group
    {
        return DB::transaction(function () use ($data) {
            if (empty($data['academic_year_id'])) {
                $data['academic_year_id'] = \App\Models\AcademicYear::where('is_current', true)->value('id')
                    ?? \App\Models\AcademicYear::first()?->id
                    ?? 1;
            }
            return Group::create($data);
        });
    }

    /**
     * Update an existing group
     */
    public function updateGroup(Group $group, array $data): Group
    {
        $group->update($data);
        return $group;
    }
}
