<?php

namespace App\Http\Requests\Academic;

use Illuminate\Foundation\Http\FormRequest;

class ManualCallRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('attendance.manage') || $this->user()->hasAnyRole(['professor', 'vacataire', 'admin', 'institution-admin', 'super-admin', 'director']);
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|exists:students,id',
            'status' => 'required|in:present,absent,late,excused',
        ];
    }
}
