<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * [Phase 8] ProfessorResource
 *
 * Standardizes the Professor API response. Flattens User virtual
 * attributes and includes department relationship when loaded.
 * Mirrors the frontend Professor interface in src/types/models.ts.
 */
class ProfessorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'user_id'         => $this->user_id,
            'employee_number' => $this->employee_number,
            'grade'           => $this->grade,
            'specialty'       => $this->specialty,
            'contract_type'   => $this->contract_type,
            'hire_date'       => $this->hire_date?->toDateString(),
            'is_active'       => $this->is_active,
            'department_id'   => $this->department_id,
            'institution_id'  => $this->institution_id,

            // Delegated from User (virtual attributes)
            'first_name'      => $this->first_name,
            'last_name'       => $this->last_name,
            'email'           => $this->email,
            'phone'           => $this->phone,
            'cin'             => $this->user?->cin,

            // Related department (conditionally)
            'department' => $this->whenLoaded('department', fn() => [
                'id'   => $this->department->id,
                'name' => $this->department->name,
                'code' => $this->department->code,
            ]),

            // User relation (optional embedding)
            'user' => $this->whenLoaded('user', fn() => new UserResource($this->user)),

            'created_at' => $this->created_at->toDateTimeString(),
            'updated_at' => $this->updated_at->toDateTimeString(),
        ];
    }
}
