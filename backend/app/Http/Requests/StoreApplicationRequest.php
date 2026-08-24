<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'bac_average' => $this->input('bac_average') ?? $this->input('moyenne_bac'),
            'selection_score' => $this->input('selection_score') ?? $this->input('score_selection'),
            'cne' => $this->input('cne') ?? $this->input('cne'),
            'status' => $this->input('status') ?? $this->input('statut'),
        ]);
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'cne' => ['required', 'string', 'max:32'],
            'cin' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'bac_average' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'selection_score' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'status' => ['nullable', 'string', 'in:submitted,pending,accepted,waitlisted,rejected,accepted'],
        ];
    }
}
