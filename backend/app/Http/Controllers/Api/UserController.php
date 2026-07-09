<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * [Phase 8] UserController — refactored to use UserResource.
 * [Audit SEC-01] All methods now have authorization guards.
 */
class UserController extends Controller
{
    private array $adminRoles = [
        'super-admin', 'institution-admin', 'director',
        'finance-officer', 'hr-officer', 'library-manager', 'discipline-committee',
    ];

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('users.view'), 403);

        $users = User::with('roles')
            ->whereDoesntHave('roles', fn($q) => $q->where('name', 'student'))
            ->get();

        // [Phase 8] Return UserResource collection
        return response()->json([
            'data' => UserResource::collection($users)->additional([]),
        ]);
    }

    public function show($id): JsonResponse
    {
        abort_unless(request()->user()->can('users.view'), 403);

        $user = User::with('roles')->findOrFail($id);

        // [Phase 8] Wrap in UserResource
        return response()->json(['data' => new UserResource($user)]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        abort_unless($request->user()->can('users.manage'), 403);

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'email'    => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'role'     => 'sometimes|required|string',
        ]);

        if (isset($validated['name']))  $user->name  = $validated['name'];
        if (isset($validated['email'])) $user->email = $validated['email'];
        if (!empty($validated['password'])) {
            $user->password = bcrypt($validated['password']);
        }
        $user->save();

        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        $user->load('roles');

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur mis à jour avec succès',
            // [Phase 8] Wrap in UserResource
            'data'    => new UserResource($user),
        ]);
    }

    public function destroy($id): JsonResponse
    {
        abort_unless(request()->user()->can('users.manage'), 403);

        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['success' => true, 'message' => 'Utilisateur supprimé avec succès']);
    }
}
