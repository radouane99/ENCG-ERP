<?php

namespace App\Http\Requests\Academic;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RolloverAcademicYearRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director']) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'new_label' => 'required|string|max:50',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ];
    }
}
