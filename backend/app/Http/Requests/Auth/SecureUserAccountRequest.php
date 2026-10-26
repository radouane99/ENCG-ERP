<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SecureUserAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('users.manage');
    }

    public function rules(): array
    {
        return [
            'operation' => ['required', Rule::in(['suspend', 'reactivate', 'revoke_sessions', 'require_2fa', 'recover_2fa', 'password_reset_link'])],
            'reason' => 'required|string|min:10|max:1000',
            'password' => 'required|string|max:4096',
            'code' => 'nullable|string|max:32',
            'identity_verified' => 'sometimes|boolean',
        ];
    }
}
