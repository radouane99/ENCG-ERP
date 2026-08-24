<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    private array $adminRoles = [
        'super-admin', 'institution-admin', 'director',
        'finance-officer', 'hr-officer', 'library-manager', 'discipline-committee',
    ];

    /**
     * Liste des utilisateurs (hors étudiants).
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('users.view'), 403);

        $users = User::with('roles')
            ->whereDoesntHave('roles', fn ($q) => $q->where('name', 'student'))
            ->get();

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($users),
        ]);
    }

    /**
     * Afficher un utilisateur.
     */
    public function show(int $id): JsonResponse
    {
        abort_unless(request()->user()->can('users.view'), 403);

        $user = User::with('roles')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Mettre à jour un utilisateur.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->can('users.manage'), 403);

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,'.$user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'sometimes|required|string',
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }

        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }

        if (! empty($validated['password'])) {
            $user->password = bcrypt($validated['password']);
        }

        $user->save();

        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur mis à jour avec succès.',
            'data' => new UserResource($user->load('roles')),
        ]);
    }

    /**
     * Supprimer un utilisateur.
     */
    public function destroy(int $id): JsonResponse
    {
        abort_unless(request()->user()->can('users.manage'), 403);

        User::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur supprimé avec succès.',
        ]);
    }
}
