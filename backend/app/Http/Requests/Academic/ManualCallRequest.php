<?php

namespace App\Http\Requests\Academic;

use Illuminate\Foundation\Http\FormRequest;

class ManualCallRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('attendance.manage') || $this->user()->hasRole('professor');
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|exists:users,id',
            'status' => 'required|in:present,absent,late,excused',
        ];
    }
}
