<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGradeRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Add robust authorization in Controller (Professor can only grade their modules)
        return true; 
    }

    public function rules(): array
    {
        return [
            'grades' => ['required', 'array'],
            'grades.*.student_id' => ['required', 'exists:students,id'],
            'grades.*.value' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'grades.*.absent' => ['boolean'],
        ];
    }
}
