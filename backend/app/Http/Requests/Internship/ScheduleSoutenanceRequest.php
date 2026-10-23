<?php

namespace App\Http\Requests\Internship;

use Illuminate\Foundation\Http\FormRequest;

class ScheduleSoutenanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return \App\Support\InternshipAccess::staff($this->user());
    }

    public function rules(): array
    {
        return [
            'internship_id' => 'required|exists:internships,id',
            'date_time' => 'required|date|after:now',
            'room_id' => 'required|exists:rooms,id',
            'president_id' => 'required|exists:professors,id',
            'examiner_id' => 'required|exists:professors,id|different:president_id',
        ];
    }
}
