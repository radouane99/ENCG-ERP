<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InternshipResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'student_id'       => $this->student_id,
            'company_name'     => $this->company_name,
            'company_address'  => $this->company_address,
            'start_date'       => $this->start_date?->toDateString(),
            'end_date'         => $this->end_date?->toDateString(),
            'status'           => $this->status,
            'type'             => $this->type,
            'supervisor_id'    => $this->supervisor_id,
            'description'      => $this->description,
            'title'            => $this->title,

            'student'   => $this->whenLoaded('student', fn() => $this->student ? [
                'id'             => $this->student->id,
                'student_number' => $this->student->student_number,
                'first_name'     => $this->student->first_name,
                'last_name'      => $this->student->last_name,
            ] : null),

            'supervisor' => $this->whenLoaded('supervisor', fn() => $this->supervisor ? [
                'id'              => $this->supervisor->id,
                'employee_number' => $this->supervisor->employee_number ?? null,
                'first_name'      => $this->supervisor->first_name,
                'last_name'       => $this->supervisor->last_name,
            ] : null),

            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}