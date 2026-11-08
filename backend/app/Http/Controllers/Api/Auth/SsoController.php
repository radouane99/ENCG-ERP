<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Domain\Auth\Exceptions\SsoAuthenticationException;
use App\Domain\Auth\Services\SsoAuthenticationService;
use App\Http\Controllers\Controller;
use App\Services\LoginChallengeService;
use App\Support\AuthCookie;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SsoController extends Controller
{
    public function __construct(
        private SsoAuthenticationService $sso
    ) {}

    public function providers(): JsonResponse
    {
        return response()->json([
            'data' => [
                'providers' => $this->sso->enabledProviders(),
                'catalog' => $this->sso->availableProvidersCatalog(),
            ],
        ]);
    }

    public function redirect(string $provider, Request $request): RedirectResponse|JsonResponse
    {
        try {
            return $this->sso->redirect($provider, $request->boolean('remember'));
        } catch (SsoAuthenticationException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function callback(string $provider, Request $request): RedirectResponse
    {
        return $this->sso->callback($provider, $request);
    }

    public function exchange(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:128',
            'remember' => 'sometimes|boolean',
        ]);

        try {
            $user = $this->sso->exchange($validated['code'], $request);
        } catch (SsoAuthenticationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $remember = $request->boolean('remember');
        if ($user->two_factor_enabled) {
            return response()->json(['data' => app(LoginChallengeService::class)->create($user, $remember)])->withCookie(AuthCookie::forget());
        }
        $expiresAt = $remember ? now()->addDays(AuthCookie::REMEMBER_DAYS) : now()->addHours(8);
        $token = $user->createToken($remember ? 'auth-token-remember' : 'auth-token', ['*'], $expiresAt)->plainTextToken;
        SessionController::recordLoginEvent($user, $request, 'sso_'.($user->sso_provider ?: 'oauth'), $remember);
        event(new Login('sanctum', $user, $remember));

        return AuthCookie::attach(response()->json([
            'data' => [
                'authenticated' => true,
                'remember' => $remember,
            ],
        ]), $token, $remember);
    }
}
