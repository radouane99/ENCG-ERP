<?php

namespace App\Http\Requests\Professor;

use Illuminate\Foundation\Http\FormRequest;

class StoreProfessorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('professors.create');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'first_name'    => 'required|string|max:100',
            'last_name'     => 'required|string|max:100',
            'email'         => 'required|email|unique:users,email',
            'phone'         => 'nullable|string|max:20',
            'cin'           => 'nullable|string|max:20|unique:users,cin',
            'grade'         => 'nullable|string|max:100',
            'specialty'     => 'nullable|string|max:255',
            'contract_type' => 'required|in:permanent,contractual,visiting',
            'hire_date'     => 'nullable|date',
            'department_id' => 'nullable|exists:departments,id',
            'is_active'     => 'boolean',
        ];
    }
}
