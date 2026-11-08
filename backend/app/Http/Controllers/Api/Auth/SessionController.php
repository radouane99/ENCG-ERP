<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\PersonalAccessToken;

class SessionController extends Controller
{
    public static function recordLoginEvent(User $user, Request $request, string $method, bool $remember = false): void
    {
        $key = "user_security_history:{$user->id}";
        $history = Cache::get($key, []);
        if (! is_array($history)) {
            $history = [];
        }

        $ua = (string) $request->userAgent();
        $device = str_contains(strtolower($ua), 'mobile') || str_contains(strtolower($ua), 'iphone') || str_contains(strtolower($ua), 'android')
            ? 'Appareil Mobile'
            : 'Ordinateur / Navigateur Web';

        array_unshift($history, [
            'id' => uniqid('sec_', true),
            'method' => $method,
            'device' => $device,
            'user_agent' => substr($ua, 0, 140) ?: 'Client API',
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'remember' => $remember,
            'session_duration' => $remember ? '30 jours (Remember Me)' : '8 heures (Standard)',
            'logged_in_at' => now()->toIso8601String(),
        ]);

        Cache::put($key, array_slice($history, 0, 15), now()->addDays(90));
    }

    public function index(Request $request): JsonResponse
    {
        $current = $request->user()->currentAccessToken();
        $id = $current instanceof PersonalAccessToken ? $current->id : null;

        return response()->json([
            'data' => $request->user()->tokens()
                ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
                ->latest('id')
                ->get()
                ->map(fn ($token) => [
                    'id' => $token->id,
                    'name' => $token->name,
                    'session_type' => $token->name === 'auth-token-remember' ? 'remember_30d' : 'standard_8h',
                    'created_at' => $token->created_at,
                    'last_used_at' => $token->last_used_at,
                    'expires_at' => $token->expires_at,
                    'is_current' => $token->id === $id,
                ]),
            'security_history' => Cache::get("user_security_history:{$request->user()->id}", []),
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Cache::get("user_security_history:{$request->user()->id}", []),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $token = $request->user()->tokens()->findOrFail($id);
        $current = $request->user()->currentAccessToken();
        abort_if($current instanceof PersonalAccessToken && $token->id === $current->id, 409, 'Utilisez Déconnexion pour fermer la session actuelle.');
        $token->delete();

        return response()->json(['message' => 'Session révoquée.']);
    }

    public function others(Request $request): JsonResponse
    {
        $current = $request->user()->currentAccessToken();
        abort_unless($current instanceof PersonalAccessToken, 409, 'Session actuelle non identifiable.');
        $count = $request->user()->tokens()->where('id', '!=', $current->id)->delete();

        return response()->json(['message' => 'Les autres sessions ont été fermées.', 'revoked' => $count]);
    }
}
