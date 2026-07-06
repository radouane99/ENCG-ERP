<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentTypeRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:document_templates,code',
            'type' => 'required|string|in:blade,pdf,word',
            'category' => 'nullable|string',
            'html_template' => 'nullable|string',
            'is_active' => 'boolean',
        ];
    }
}
