<?php

namespace App\Http\Requests\Internship;

use Illuminate\Foundation\Http\FormRequest;

class UploadInternshipDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('student');
    }

    public function rules(): array
    {
        return [
            'document_type' => 'required|in:convention,rapport_etape,rapport_final,attestation,fiche_evaluation',
            'file' => 'required|file|mimes:pdf,doc,docx|max:10240', // 10MB max
        ];
    }
}
