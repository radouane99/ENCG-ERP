<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfessorResource extends JsonResource
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
            'department_id' => $this->department_id,
            'speciality' => $this->speciality,
            'hire_date' => $this->hire_date,
            'status' => $this->status,
            'type' => $this->type,
            // Wrap the related user model in UserResource if it's loaded
            'user' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
