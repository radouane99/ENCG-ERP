<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class SessionController extends Controller
{
    public function index(Request $request)
    {
        $current = $request->user()->currentAccessToken();
        $id = $current instanceof PersonalAccessToken ? $current->id : null;

        return response()->json(['data' => $request->user()->tokens()->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))->latest('id')->get()->map(fn ($token) => [
            'id' => $token->id, 'name' => $token->name, 'created_at' => $token->created_at, 'last_used_at' => $token->last_used_at, 'expires_at' => $token->expires_at, 'is_current' => $token->id === $id,
        ])]);
    }

    public function destroy(Request $request, int $id)
    {
        $token = $request->user()->tokens()->findOrFail($id);
        $current = $request->user()->currentAccessToken();
        abort_if($current instanceof PersonalAccessToken && $token->id === $current->id, 409, 'Utilisez Déconnexion pour fermer la session actuelle.');
        $token->delete();

        return response()->json(['message' => 'Session révoquée.']);
    }

    public function others(Request $request)
    {
        $current = $request->user()->currentAccessToken();
        abort_unless($current instanceof PersonalAccessToken, 409, 'Session actuelle non identifiable.');
        $count = $request->user()->tokens()->where('id', '!=', $current->id)->delete();

        return response()->json(['message' => 'Les autres sessions ont été fermées.', 'revoked' => $count]);
    }
}
