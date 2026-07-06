<?php

namespace App\Http\Requests\Internship;

use Illuminate\Foundation\Http\FormRequest;

class ValidateInternshipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('internships.validate');
    }

    public function rules(): array
    {
        return [
            'status' => 'required|in:approved,rejected',
            'professor_supervisor_id' => 'nullable|exists:professors,id'
        ];
    }
}
