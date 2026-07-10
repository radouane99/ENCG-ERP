<?php

namespace App\Http\Resources;

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
        return [
            'id' => $this->uuid ?? $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'name' => trim($this->first_name . ' ' . $this->last_name),
            'email' => $this->email,
            'is_active' => (bool)$this->is_active,
            'roles' => $this->whenLoaded('roles', function () {
                return $this->roles->pluck('name')->values()->toArray();
            }, []),
            'type' => $this->relationLoaded('roles') && $this->roles->whereNotIn('name', ['professor', 'student'])->isNotEmpty() ? 'admin' : 'professor',
            'role_label' => $this->relationLoaded('roles') && $this->roles->isNotEmpty() ? $this->roles->first()->name : 'Non assigné',
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
