<?php

namespace App\Http\Requests\Internship;

use Illuminate\Foundation\Http\FormRequest;

class ApplyInternshipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('student');
    }

    public function rules(): array
    {
        return [
            'institution_id' => 'required|exists:institutions,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'type' => 'required|string|max:50',
            'company_name' => 'required|string|max:150',
            'company_address' => 'required|string|max:255',
            'company_city' => 'required|string|max:100',
            'supervisor_name' => 'required|string|max:150',
            'supervisor_email' => 'required|email|max:150',
            'supervisor_phone' => 'required|string|max:50',
            'position_title' => 'required|string|max:150',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ];
    }
}
