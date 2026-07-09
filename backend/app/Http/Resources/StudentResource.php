<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * [Phase 8] StudentResource
 *
 * Standardizes the Student API response. Flattens User virtual
 * attributes (first_name, last_name, email, phone, cin) from
 * the related User model directly onto the student payload —
 * matching the frontend Student interface in src/types/models.ts.
 */
class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $latestPathway = $this->whenLoaded('latestPathway');

        return [
            'id'              => $this->id,
            'user_id'         => $this->user_id,
            'student_number'  => $this->student_number,
            'cne'             => $this->cne,
            'massar_code'     => $this->massar_code,
            'gender'          => $this->gender,
            'birth_date'      => $this->birth_date?->toDateString(),
            'status'          => $this->status ?? 'active',
            'scholarship_type'=> $this->scholarship_type,
            'institution_id'  => $this->institution_id,
            'has_disability'  => $this->has_disability,

            // Delegated from User (virtual attributes + eager-loaded user)
            'first_name'      => $this->first_name,
            'last_name'       => $this->last_name,
            'email'           => $this->email,
            'phone'           => $this->phone,
            'cin'             => $this->user?->cin,

            // Pathway info
            'current_filiere'  => $latestPathway?->filiere?->code,
            'current_semester' => $latestPathway?->current_semester,
            'filiere'          => $this->when(
                $this->relationLoaded('latestPathway') && $latestPathway?->filiere,
                fn() => [
                    'id'   => $latestPathway->filiere->id,
                    'code' => $latestPathway->filiere->code,
                    'name' => $latestPathway->filiere->name,
                ]
            ),

            // User relation (optional embedding)
            'user' => $this->whenLoaded('user', fn() => new UserResource($this->user)),

            'created_at'      => $this->created_at->toDateTimeString(),
            'updated_at'      => $this->updated_at->toDateTimeString(),
        ];
    }
}
