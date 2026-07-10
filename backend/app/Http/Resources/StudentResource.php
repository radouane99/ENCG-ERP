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
            'current_semester' => $this->current_semester,
            // Fallback for flat structure expected by some frontend pages
            'first_name' => $this->first_name ?? ($this->relationLoaded('user') ? $this->user?->first_name : null),
            'last_name' => $this->last_name ?? ($this->relationLoaded('user') ? $this->user?->last_name : null),
            'email' => $this->email ?? ($this->relationLoaded('user') ? $this->user?->email : null),
            'phone' => $this->phone ?? ($this->relationLoaded('user') ? $this->user?->phone : null),
            'current_filiere' => $this->current_filiere ?? ($this->relationLoaded('latestPathway') ? $this->latestPathway?->filiere?->code : null),
            // Wrap the related user model in UserResource if it's loaded
            'user' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
