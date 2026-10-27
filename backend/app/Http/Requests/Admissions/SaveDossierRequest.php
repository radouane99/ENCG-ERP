<?php

namespace App\Http\Requests\Admissions;

use Illuminate\Foundation\Http\FormRequest;

class SaveDossierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

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
            'birth_city_ar' => 'nullable|string|max:120', 'nationality_ar' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:120', 'region' => 'nullable|string|max:120', 'delegation' => 'nullable|string|max:120',
            'address_ar' => 'nullable|string|max:500', 'marital_status' => 'nullable|in:single,married,divorced,widowed',
            'father_first_name' => 'nullable|string|max:100', 'father_last_name' => 'nullable|string|max:100',
            'father_first_name_ar' => 'nullable|string|max:100', 'father_last_name_ar' => 'nullable|string|max:100',
            'father_cin' => 'nullable|string|max:30', 'father_profession' => 'nullable|string|max:180', 'father_phone' => ['nullable', 'regex:/^\+?[0-9 ()-]{8,20}$/'],
            'mother_first_name' => 'nullable|string|max:100', 'mother_last_name' => 'nullable|string|max:100',
            'mother_first_name_ar' => 'nullable|string|max:100', 'mother_last_name_ar' => 'nullable|string|max:100',
            'mother_cin' => 'nullable|string|max:30', 'mother_profession' => 'nullable|string|max:180', 'mother_phone' => ['nullable', 'regex:/^\+?[0-9 ()-]{8,20}$/'],
            'bac_province' => 'nullable|string|max:120',
            'bac_regional_average' => 'nullable|numeric|between:0,20', 'bac_national_average' => 'nullable|numeric|between:0,20',
            'bac_continuous_average' => 'nullable|numeric|between:0,20',
            'bac_mention' => 'nullable|string|max:100', 'has_prior_higher_education' => 'sometimes|boolean',
            'first_higher_education_year' => 'nullable|integer|min:1980|max:'.(now()->year + 1),
            'first_university_enrollment_year' => 'nullable|integer|min:1980|max:'.(now()->year + 1),
            'previous_university' => 'nullable|string|max:255', 'previous_institution' => 'nullable|string|max:255',
            'previous_degree' => 'nullable|string|max:180',
        ];
    }
}
