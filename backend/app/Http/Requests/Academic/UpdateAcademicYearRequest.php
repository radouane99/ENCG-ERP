<?php

namespace App\Http\Requests\Academic;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAcademicYearRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('academic.edit');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'label'      => 'sometimes|required|string|max:50',
            'start_year' => 'sometimes|required|integer|min:2000',
            'end_year'   => 'sometimes|required|integer',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date',
            'is_current' => 'boolean',
            'is_locked'  => 'boolean',
        ];
    }
}
