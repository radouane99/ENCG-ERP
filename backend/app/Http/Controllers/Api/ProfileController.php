<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /**
     * Mettre à jour le profil utilisateur.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::in([$user->email])],
            'phone' => 'nullable|string|max:20',
            'password' => 'prohibited',
            'password_confirmation' => 'prohibited',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user->name = $validated['name'];

        if (isset($validated['name_ar'])) {
            $user->name_ar = $validated['name_ar'];
        }

        if (isset($validated['phone'])) {
            $user->phone = $validated['phone'];
        }

        if ($request->hasFile('avatar')) {
            if ($user->avatar_path) {
                Storage::disk('public')->delete($user->avatar_path);
            }
            $user->avatar_path = $request->file('avatar')->store('avatars', 'public');
        }

        $user->save();
        $user->loadMissing('roles', 'permissions');

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour avec succès.',
            'user' => [
                ...$user->toArray(),
                'roles' => $user->roles->pluck('name')->toArray(),
                'permissions' => $user->permissions->pluck('name')->toArray(),
            ],
        ]);
    }
}
