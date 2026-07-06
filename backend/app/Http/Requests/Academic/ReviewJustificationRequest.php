<?php

namespace App\Http\Requests\Academic;

use Illuminate\Foundation\Http\FormRequest;

class ReviewJustificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('attendance.review');
    }

    public function rules(): array
    {
        return [
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|string|max:255',
        ];
    }
}
