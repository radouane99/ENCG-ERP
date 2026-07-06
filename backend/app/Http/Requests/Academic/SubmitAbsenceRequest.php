<?php

namespace App\Http\Requests\Academic;

use Illuminate\Foundation\Http\FormRequest;

class SubmitAbsenceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // For Student Portal, students can submit their own absence justifications.
        // Assuming middleware handles authentication, we can return true.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'student_id' => 'required|integer',
            'attendance_id' => 'required|integer',
            'reason' => 'required|string',
            'description' => 'nullable|string',
            'document' => 'nullable|file|mimes:pdf,jpg,png',
        ];
    }
}
