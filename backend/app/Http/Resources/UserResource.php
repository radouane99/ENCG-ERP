<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * [Phase 8] UserResource
 *
 * Standardizes the User API response. Hides sensitive fields
 * and flattens the output for frontend consumption.
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'name'             => $this->name,
            'first_name'       => $this->first_name,
            'last_name'        => $this->last_name,
            'email'            => $this->email,
            'phone'            => $this->phone,
            'cin'              => $this->cin,
            'is_active'        => $this->is_active,
            'roles'            => $this->whenLoaded('roles', fn() => $this->roles->pluck('name')),
            'institution_id'   => $this->institution_id,
            'email_verified_at'=> $this->email_verified_at?->toDateTimeString(),
            'last_login_at'    => $this->last_login_at?->toDateTimeString(),
            'created_at'       => $this->created_at->toDateTimeString(),
            'updated_at'       => $this->updated_at->toDateTimeString(),
        ];
    }
}
