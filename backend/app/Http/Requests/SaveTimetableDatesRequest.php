<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveTimetableDatesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director', 'scolarite']) ?? false;
    }

    public function rules(): array
    {
        return [
            'cours_start' => ['required', 'date_format:d/m/Y'],
            'td_tp_start' => ['required', 'date_format:d/m/Y', 'after_or_equal:cours_start'],
        ];
    }
}
