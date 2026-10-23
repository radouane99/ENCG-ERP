<?php

namespace App\Http\Requests\Internship;

use Illuminate\Foundation\Http\FormRequest;

class ValidateInternshipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return \App\Support\InternshipAccess::staff($this->user());
    }

    public function rules(): array
    {
        return [
            'status' => 'required|in:approved,rejected',
            'professor_supervisor_id' => 'nullable|exists:professors,id',
        ];
    }
}
