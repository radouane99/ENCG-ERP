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
            // Wrap the related user model in UserResource if it's loaded
            'user' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
