<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GradeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'assessment_id' => $this->assessment_id,
            'value' => (float) $this->value,
            'absent' => (bool) $this->absent,
            'assessment' => [
                'id' => $this->assessment->id ?? null,
                'type' => $this->assessment->type ?? null,
                'weight' => (float) ($this->assessment->weight ?? 0),
            ]
        ];
    }
}
