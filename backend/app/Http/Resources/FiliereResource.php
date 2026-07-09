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
            'type' => $this->type ?? 'Formation Initiale',
            'coordinator' => $this->relationLoaded('department') && $this->department ? $this->department->head_name : 'Non assigné',
            'students' => rand(50, 400), // Placeholder pour la Phase 2
            'active' => (bool) $this->is_active,
            'duration_years' => $this->duration_years,
            'department_id' => $this->department_id,
        ];
    }
}
