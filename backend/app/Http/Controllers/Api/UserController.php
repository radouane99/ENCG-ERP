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
    public function show(string|int $id): JsonResponse
    {
        abort_unless(request()->user()->can('users.view'), 403);

        $user = User::with('roles')->find($id)
            ?? User::with('roles')->where('id', (string) $id)->first()
            ?? User::with('roles')->where('email', (string) $id)->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Mettre à jour un utilisateur.
     */
    public function update(Request $request, string|int $id): JsonResponse
    {
        abort_unless($request->user()->can('users.manage'), 403);

        $user = User::find($id)
            ?? User::where('id', (string) $id)->first()
            ?? User::where('email', (string) $id)->firstOrFail();

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
    public function destroy(string|int $id): JsonResponse
    {
        abort_unless(request()->user()->can('users.manage'), 403);

        $user = User::find($id)
            ?? User::where('id', (string) $id)->first()
            ?? User::where('email', (string) $id)->firstOrFail();

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur supprimé avec succès.',
        ]);
    }
}
