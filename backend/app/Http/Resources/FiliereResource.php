<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FiliereResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'type' => $this->type ?? 'grande_ecole',
            'coordinator' => $this->relationLoaded('department') && $this->department ? $this->department->head_name : 'Non assigné',
            'responsable_id' => $this->responsable_id,
            'responsable_name' => $this->responsable?->name ?? 'Non assigné',
            'students' => $this->whenCounted('students', fn () => $this->students_count, 0),
            'active' => (bool) $this->is_active,
            'duration_years' => $this->duration_years,
            'department_id' => $this->department_id,
            'groups_count' => $this->groups_count ?? \Illuminate\Support\Facades\DB::table('groups')->where('filiere_id', $this->id)->count(),
            'modules_count' => $this->modules_count ?? \Illuminate\Support\Facades\DB::table('modules')->where('filiere_id', $this->id)->count(),
        ];
    }
}
