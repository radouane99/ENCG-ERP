<?php

namespace App\Http\Requests\Admissions;

use App\Support\AdmissionAccess;
use Illuminate\Foundation\Http\FormRequest;

class AdmissionDeskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return AdmissionAccess::staff($this->user());
    }

    public function rules(): array
    {
        return $this->route('ticket') ? [
            'event' => 'required|in:claim,release,complete,cancel', 'version' => 'required|integer|min:1',
            'reason' => 'nullable|string|min:10|max:500',
        ] : ['application_id' => 'required|integer|min:1', 'desk' => 'required|string|max:80'];
    }
}
