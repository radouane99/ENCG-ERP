<?php

namespace App\Http\Requests\Admissions;

use Illuminate\Foundation\Http\FormRequest;

class SaveDossierRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }

    public function rules(): array
    {
        return [
            'application_id' => 'required|integer', 'version' => 'required|integer|min:1',
            'first_name' => 'sometimes|required|string|max:100', 'last_name' => 'sometimes|required|string|max:100',
            'first_name_ar' => 'nullable|string|max:100', 'last_name_ar' => 'nullable|string|max:100',
            'phone' => ['nullable', 'regex:/^\+?[0-9 ()-]{8,20}$/'],
            'birth_date' => 'nullable|date_format:Y-m-d|before:today|after:1900-01-01',
            'birth_city' => 'nullable|string|max:120', 'gender' => 'nullable|in:male,female',
            'address' => 'nullable|string|max:500', 'city' => 'nullable|string|max:120',
            'nationality' => 'nullable|string|max:100', 'academy' => 'nullable|string|max:120',
            'province' => 'nullable|string|max:120', 'high_school' => 'nullable|string|max:180',
            'bac_series' => 'nullable|string|max:120', 'bac_year' => 'nullable|integer|min:1980|max:'.now()->year,
            'bac_average' => 'nullable|numeric|between:0,20',
            'father_name' => 'nullable|string|max:150', 'mother_name' => 'nullable|string|max:150',
            'emergency_contact_name' => 'nullable|string|max:150', 'emergency_contact_phone' => 'nullable|string|max:30',
            'has_disability' => 'sometimes|boolean', 'disability_details' => 'nullable|string|max:1000',
            'allergy_type' => 'nullable|string|max:500', 'has_medical_followup' => 'sometimes|boolean',
            'medication_used' => 'nullable|string|max:500', 'treating_doctor_info' => 'nullable|string|max:500',
        ];
    }
}
