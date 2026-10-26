<?php

namespace App\Http\Requests\Admission;

use Illuminate\Foundation\Http\FormRequest;

class SavePublicPortalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && ($this->user()->can('system.settings') || $this->user()->hasAnyRole(['admin', 'super-admin', 'super_admin', 'institution-admin', 'director']));
    }

    public function rules(): array
    {
        return ['revision' => 'required|integer|min:0', 'hours' => 'nullable|string|max:1000',
            'guides' => 'required|array:tafem,cnaem', 'guides.tafem' => 'required|array:instructions', 'guides.cnaem' => 'required|array:instructions', 'guides.*.instructions' => 'nullable|string|max:5000',
            'announcements' => 'present|array|max:30', 'announcements.*' => 'array:id,title,body,status,starts_on,ends_on,attachment_id',
            'announcements.*.id' => 'nullable|uuid|distinct', 'announcements.*.title' => 'required|string|max:180', 'announcements.*.body' => 'required|string|max:5000',
            'announcements.*.status' => 'required|in:draft,published,archived', 'announcements.*.starts_on' => 'nullable|required_if:announcements.*.status,published|date_format:Y-m-d', 'announcements.*.ends_on' => 'nullable|required_if:announcements.*.status,published|date_format:Y-m-d|after_or_equal:announcements.*.starts_on',
            'announcements.*.attachment_id' => 'nullable|uuid'];
    }
}
