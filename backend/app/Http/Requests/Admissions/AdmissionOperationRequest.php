<?php

namespace App\Http\Requests\Admissions;

use App\Support\AdmissionAccess;
use Illuminate\Foundation\Http\FormRequest;

class AdmissionOperationRequest extends FormRequest
{
    public function authorize(): bool { return AdmissionAccess::staff($this->user()); }
    public function rules(): array
    {
        if ($this->routeIs('admissions.assign')) return [
            'application_id' => 'required|integer', 'assigned_to' => 'present|nullable|integer',
            'next_action' => 'present|nullable|string|max:500', 'due_on' => 'present|nullable|date_format:Y-m-d', 'version' => 'required|integer|min:0',
        ];
        return ['application_id' => 'required|integer', 'operation_id' => 'required|uuid', 'document_type' => 'required|in:bac,releve_notes,attestation_admission,releve_parcours,diplome_bac2',
            'event' => 'required|in:received,relocated,returned', 'storage_location' => 'nullable|required_unless:event,returned|string|max:180', 'note' => 'required|string|min:3|max:500'];
    }
}
