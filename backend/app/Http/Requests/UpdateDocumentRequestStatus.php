<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentRequestStatus extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:processing,ready,rejected'],
            'admin_notes' => ['nullable', 'array'],
            'admin_notes.reason' => ['required_if:status,rejected', 'string'],
        ];
    }
}
