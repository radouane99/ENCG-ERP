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
            ],
        ]);
    }

    public function redirect(string $provider): RedirectResponse|JsonResponse
    {
        try {
            return $this->sso->redirect($provider);
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
        ]);

        try {
            $user = $this->sso->exchange($validated['code'], $request);
        } catch (SsoAuthenticationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        if ($user->two_factor_enabled) {
            return response()->json(['data' => app(LoginChallengeService::class)->create($user)])->withCookie(AuthCookie::forget());
        }
        $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;
        event(new Login('sanctum', $user, false));

        return AuthCookie::attach(response()->json([
            'data' => [
                'authenticated' => true,
            ],
        ]), $token);
    }
}
