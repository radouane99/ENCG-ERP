<?php

namespace App\Http\Requests;

use App\Support\ChecksStaffAccess;
use Illuminate\Foundation\Http\FormRequest;

class StoreGradeRequest extends FormRequest
{
    use ChecksStaffAccess;

    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        return $this->hasPermissionOrRole($user, 'grades.enter', [
            'admin', 'super-admin', 'institution-admin', 'director',
            'department-head', 'filiere-head', 'professor', 'vacataire',
        ]);
    }

    protected function prepareForValidation(): void
    {
        $grades = $this->input('grades');
        if (! is_array($grades)) {
            return;
        }

        $this->merge([
            'grades' => array_map(function ($grade) {
                if (! is_array($grade)) {
                    return $grade;
                }
                if (! array_key_exists('absent', $grade) && array_key_exists('is_absent', $grade)) {
                    $grade['absent'] = (bool) $grade['is_absent'];
                }

                return $grade;
            }, $grades),
        ]);
    }

    public function rules(): array
    {
        return [
            'grades' => ['required', 'array'],
            'grades.*.student_id' => ['required', 'exists:students,id'],
            'grades.*.value' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'grades.*.absent' => ['sometimes', 'boolean'],
        ];
    }
}
