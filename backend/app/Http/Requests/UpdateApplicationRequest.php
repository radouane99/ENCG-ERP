<?php

namespace App\Http\Requests;

use App\Support\ChecksStaffAccess;
use Illuminate\Foundation\Http\FormRequest;

class UpdateApplicationRequest extends FormRequest
{
    use ChecksStaffAccess;

    public function authorize(): bool
    {
        return $this->user() && $this->hasPermissionOrRole($this->user(), 'admissions.manage', [
            'super-admin', 'admin', 'institution-admin', 'director', 'scolarite',
        ]);
    }

    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:255'],
            'last_name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'birth_date' => ['sometimes', 'nullable', 'date', 'before:today'],
            'bac_average' => ['sometimes', 'nullable', 'numeric', 'between:0,20'],
            'selection_score' => ['sometimes', 'nullable', 'numeric', 'between:0,20'],
            'status' => ['prohibited'],
            'dossier_status' => ['prohibited'],
            'eligibility' => ['prohibited'],
            'admission_campaign_id' => ['prohibited'],
            'reviewed_by' => ['prohibited'],
            'reviewed_at' => ['prohibited'],
            'reference_number' => ['prohibited'],
        ];
    }
}
