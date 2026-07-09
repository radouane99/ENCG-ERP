<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ModuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'semester' => 'S' . $this->semester_number,
            'coefficient' => $this->coefficient,
            'filiere' => $this->relationLoaded('filiere') && $this->filiere ? $this->filiere->code : 'TC',
            'professor' => 'Non assigné', // Placeholder pour la Phase 3
            'studentsCount' => rand(50, 400),
            'active' => (bool) $this->is_active,
            'filiere_id' => $this->filiere_id,
            'semester_number' => $this->semester_number,
            'credit_hours' => $this->credit_hours,
        ];
    }
}
