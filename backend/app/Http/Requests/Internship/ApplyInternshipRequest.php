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
            'institution_id' => 'nullable|exists:institutions,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'type' => 'nullable|string|max:50',
            'internship_type' => 'nullable|string|max:50',
            'company_name' => 'required|string|max:150',
            'company_address' => 'nullable|string|max:255',
            'company_city' => 'nullable|string|max:100',
            'supervisor_name' => 'nullable|string|max:150',
            'company_mentor_name' => 'nullable|string|max:150',
            'supervisor_email' => 'nullable|email|max:150',
            'company_mentor_email' => 'nullable|email|max:150',
            'supervisor_phone' => 'nullable|string|max:50',
            'position_title' => 'required|string|max:150',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'insurance_company' => 'nullable|string|max:100',
            'insurance_policy_number' => 'nullable|string|max:100',
        ];
    }
}
