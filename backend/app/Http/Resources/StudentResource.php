<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid ?? $this->id,
            'student_number' => $this->student_number,
            'cne' => $this->cne,
            'enrollment_date' => $this->enrollment_date,
            'status' => $this->status,
            'filiere_id' => $this->filiere_id,
            'current_semester' => $this->current_semester ?? ($this->relationLoaded('latestPathway') ? $this->latestPathway?->current_semester : null),
            // Fallback for flat structure expected by some frontend pages
            'first_name' => $this->first_name ?? ($this->relationLoaded('user') ? $this->user?->first_name : null),
            'last_name' => $this->last_name ?? ($this->relationLoaded('user') ? $this->user?->last_name : null),
            'email' => $this->email ?? ($this->relationLoaded('user') ? $this->user?->email : null),
            'phone' => $this->phone ?? ($this->relationLoaded('user') ? $this->user?->phone : null),
            'cin' => $this->cin ?? ($this->relationLoaded('user') ? $this->user?->cin : null),
            'current_filiere' => $this->current_filiere ?? ($this->relationLoaded('latestPathway') ? $this->latestPathway?->filiere?->code : null),
            'current_group' => $this->current_group ?? ($this->relationLoaded('latestPathway') ? $this->latestPathway?->group?->name : null),
            // Wrap the related user model in UserResource if it's loaded
            'user' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),
            'latest_pathway' => $this->whenLoaded('latestPathway', function () {
                return [
                    'id' => $this->latestPathway->id,
                    'current_semester' => $this->latestPathway->current_semester,
                    'academic_year_id' => $this->latestPathway->academic_year_id,
                    'filiere' => $this->latestPathway->relationLoaded('filiere') ? [
                        'id' => $this->latestPathway->filiere?->id,
                        'name' => $this->latestPathway->filiere?->name,
                        'code' => $this->latestPathway->filiere?->code,
                    ] : null,
                ];
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
