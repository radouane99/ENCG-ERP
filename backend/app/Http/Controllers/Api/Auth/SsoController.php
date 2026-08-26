<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Domain\Auth\Exceptions\SsoAuthenticationException;
use App\Domain\Auth\Services\SsoAuthenticationService;
use App\Http\Controllers\Controller;
use App\Support\AuthCookie;
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
            $token = $this->sso->exchange($validated['code']);
        } catch (SsoAuthenticationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return AuthCookie::attach(response()->json([
            'data' => [
                'authenticated' => true,
            ],
        ]), $token);
    }
}
