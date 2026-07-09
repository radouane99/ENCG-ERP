<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * [Phase 8] InternshipResource
 *
 * Standardizes the Internship API response.
 * Mirrors the frontend Internship interface in src/types/models.ts.
 */
class InternshipResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'student_id'      => $this->student_id,
            'company_name'    => $this->company_name,
            'company_address' => $this->company_address,
            'start_date'      => $this->start_date?->toDateString(),
            'end_date'        => $this->end_date?->toDateString(),
            'status'          => $this->status,
            'type'            => $this->type,
            'supervisor_id'   => $this->supervisor_id,
            'description'     => $this->description,
            'title'           => $this->title,

            // Related student (conditionally embedded)
            'student' => $this->whenLoaded('student', fn() => [
                'id'             => $this->student->id,
                'student_number' => $this->student->student_number,
                'first_name'     => $this->student->first_name,
                'last_name'      => $this->student->last_name,
            ]),

            // Related supervisor professor (conditionally embedded)
            'supervisor' => $this->whenLoaded('supervisor', fn() => [
                'id'              => $this->supervisor->id,
                'employee_number' => $this->supervisor->employee_number,
                'first_name'      => $this->supervisor->first_name,
                'last_name'       => $this->supervisor->last_name,
            ]),

            'created_at' => $this->created_at->toDateTimeString(),
            'updated_at' => $this->updated_at->toDateTimeString(),
        ];
    }
}
