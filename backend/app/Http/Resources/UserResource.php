<?php

namespace App\Http\Resources;

use App\Support\Utf8Text;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing('roles', 'permissions', 'institution');

        $roles = $this->roles->pluck('name')->values()->toArray();

        return [
            'id' => $this->uuid ?? $this->id,
            'first_name' => Utf8Text::repair($this->first_name),
            'last_name' => Utf8Text::repair($this->last_name),
            'name' => Utf8Text::repair(trim(($this->first_name ?? '').' '.($this->last_name ?? '')) ?: $this->name),
            'name_ar' => Utf8Text::repair($this->name_ar),
            'email' => $this->email,
            'phone' => $this->phone,
            'cin' => $this->cin,
            'cne' => $this->cne,
            'avatar_path' => $this->avatar_path,
            'is_active' => (bool) $this->is_active,
            'must_change_password' => (bool) $this->must_change_password,
            'two_factor_enabled' => (bool) $this->two_factor_enabled,
            'locale' => $this->locale ?? 'fr',
            'institution_id' => $this->institution_id,
            'institution_name' => Utf8Text::repair($this->institution?->name),
            'roles' => $roles,
            'permissions' => $this->permissions->pluck('name')->values()->toArray(),
            'type' => collect($roles)->intersect(['professor', 'student', 'vacataire'])->count() === count($roles) && count($roles) > 0
                ? ($roles[0] ?? 'user')
                : (count($roles) ? 'admin' : 'user'),
            'role_label' => $roles[0] ?? 'Non assigné',
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
