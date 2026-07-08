<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('students.create');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'first_name'      => 'required|string|max:100',
            'last_name'       => 'required|string|max:100',
            'email'           => 'required|email|unique:users,email',
            'phone'           => 'nullable|string|max:20',
            'cin'             => 'nullable|string|max:20|unique:users,cin',
            'cne'             => 'required|string|max:20|unique:students,cne',
            'massar_code'     => 'nullable|string|max:30',
            'gender'          => 'required|in:male,female',
            'birth_date'      => 'nullable|date|before:today',
            'status'          => 'required|in:active,suspended,graduated,withdrawn',
            'scholarship_type'=> 'nullable|string|max:50',
        ];
    }
}
