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
            'first_name'       => 'required|string|max:100',
            'last_name'        => 'required|string|max:100',
            'email'            => 'required|email|unique:users,email',
            'phone'            => 'nullable|string|max:20',
            'cin'              => 'nullable|string|max:20',
            'cne'              => 'nullable|string|max:20',
            'massar_code'      => 'nullable|string|max:30',
            'gender'           => 'nullable|in:male,female',
            'birth_date'       => 'nullable|date',
            'status'           => 'nullable|in:active,suspended,graduated,withdrawn',
            'current_filiere'  => 'nullable|string',
            'current_semester' => 'nullable',
        ];
    }
}
