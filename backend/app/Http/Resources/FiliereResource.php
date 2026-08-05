<?php

namespace App\Http\Resources;

use App\Models\Filiere;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FiliereResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $studentCount = $this->students_count
            ?? (method_exists($this->resource, 'studentPathways') ? $this->studentPathways()->count() : 0);

        $groupsCount  = $this->groups_count
            ?? $this->groups()->count();

        $modulesCount = $this->modules_count
            ?? $this->modules()->count();

        return [
            'id'               => $this->id,
            'code'             => $this->code,
            'name'             => $this->name,
            'type'             => $this->type ?? 'grande_ecole',
            'coordinator'      => $this->department->head_name ?? 'Non assigné',
            'responsable_id'   => $this->responsable_id,
            'responsable_name' => $this->responsable?->name ?? 'Non assigné',
            'students'         => $studentCount,
            'students_count'   => $studentCount,
            'max_capacity'     => $this->max_capacity ?? 150,
            'active'           => (bool) $this->is_active,
            'duration_years'   => $this->duration_years,
            'department_id'    => $this->department_id,
            'groups_count'     => $groupsCount,
            'modules_count'    => $modulesCount,
        ];
    }
}