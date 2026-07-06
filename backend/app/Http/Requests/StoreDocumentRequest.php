<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'document_template_id' => 'required|exists:document_templates,id',
            'language' => 'nullable|string|in:fr,ar,en',
            'additional_data' => 'nullable|array',
        ];
    }
}
