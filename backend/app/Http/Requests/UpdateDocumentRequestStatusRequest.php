<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentRequestStatusRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'status' => 'required|string|in:pending,processing,ready,rejected',
            'rejection_reason' => 'nullable|string|required_if:status,rejected',
        ];
    }
}
