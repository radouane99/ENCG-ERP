<?php

namespace App\Http\Requests\Internship;

use Illuminate\Foundation\Http\FormRequest;

class EvaluateInternshipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['professor', 'vacataire', 'super-admin', 'institution-admin', 'director', 'department-head', 'filiere-head']);
    }

    public function rules(): array
    {
        return [
            'grade' => 'required|numeric|min:0|max:20',
            'remarks' => 'nullable|string|max:1000',
        ];
    }
}
