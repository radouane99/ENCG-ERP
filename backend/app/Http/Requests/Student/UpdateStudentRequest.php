<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('students.edit');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $student = $this->route('student');
        $userId = $student ? $student->user_id : null;
        $studentId = $student ? $student->id : null;

        return [
            'first_name'      => 'sometimes|required|string|max:100',
            'last_name'       => 'sometimes|required|string|max:100',
            'email'           => 'sometimes|required|email|unique:users,email,' . $userId,
            'phone'           => 'nullable|string|max:20',
            'cin'             => 'nullable|string|max:20|unique:users,cin,' . $userId,
            'cne'             => 'sometimes|required|string|max:20|unique:students,cne,' . $studentId,
            'massar_code'     => 'nullable|string|max:30',
            'gender'          => 'sometimes|required|in:male,female',
            'birth_date'      => 'nullable|date|before:today',
            'status'          => 'sometimes|required|in:active,suspended,graduated,withdrawn',
            'scholarship_type'=> 'nullable|string|max:50',
            'current_filiere' => 'nullable|string',
            'current_semester'=> 'nullable|integer',
        ];
    }
}
