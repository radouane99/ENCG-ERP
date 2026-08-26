<?php

declare(strict_types=1);

namespace App\Domain\Auth\Services;

use App\Domain\Auth\Dto\OidcIdentity;
use App\Domain\Auth\Exceptions\SsoAuthenticationException;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class SsoAuthenticationService
{
    public function __construct(
        private OidcClient $oidcClient
    ) {}

    /**
     * @return list<array{id: string, label: string, redirect: string}>
     */
    public function enabledProviders(): array
    {
        $out = [];
        foreach (array_keys(config('sso.providers', [])) as $id) {
            if (! is_string($id) || ! $this->oidcClient->isConfigured($id)) {
                continue;
            }
            $label = (string) (config('sso.providers.'.$id.'.label') ?: $id);
            $out[] = [
                'id' => $id,
                'label' => $label,
                'redirect' => '/api/v1/auth/sso/'.$id.'/redirect',
            ];
        }

        return $out;
    }

    public function redirect(string $provider): RedirectResponse
    {
        $this->assertKnownProvider($provider);
        $request = $this->oidcClient->authorizationRequest($provider);

        Cache::put('sso_oidc_'.$request['state'], [
            'provider' => $provider,
            'nonce' => $request['nonce'],
            'verifier' => $request['verifier'],
        ], now()->addMinutes(10));

        return redirect()->away($request['url']);
    }

    public function callback(string $provider, Request $request): RedirectResponse
    {
        $frontend = $this->frontendUrl();

        try {
            $this->assertKnownProvider($provider);
            $state = (string) $request->query('state', '');
            $code = (string) $request->query('code', '');
            if ($state === '' || $code === '') {
                throw new SsoAuthenticationException('sso', 'Retour IdP incomplet.');
            }

            $session = Cache::pull('sso_oidc_'.$state);
            if (! is_array($session) || ($session['provider'] ?? null) !== $provider) {
                throw new SsoAuthenticationException('sso', 'État OIDC invalide ou expiré.');
            }

            $identity = $this->oidcClient->redeem(
                $provider,
                $code,
                (string) $session['verifier'],
                (string) $session['nonce'],
            );

            $user = $this->resolveUser($identity);
            $user->forceFill([
                'last_login_at' => now(),
                'last_login_ip' => $request->ip(),
            ])->save();

            $this->linkIdentity($user, $identity);

            $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;
            $exchange = Str::random(64);
            Cache::put('oauth_exchange_'.$exchange, $token, now()->addMinutes(2));

            return redirect()->to($frontend.'/auth/callback?code='.$exchange);
        } catch (SsoAuthenticationException $e) {
            return redirect()->to($frontend.'/login?error='.urlencode($e->errorCode));
        } catch (\Throwable) {
            return redirect()->to($frontend.'/login?error=sso');
        }
    }

    public function exchange(string $code): string
    {
        $token = Cache::pull('oauth_exchange_'.$code);
        if (! is_string($token) || $token === '') {
            throw new SsoAuthenticationException('sso', 'Code d\'échange invalide ou expiré.');
        }

        return $token;
    }

    private function resolveUser(OidcIdentity $identity): User
    {
        $domain = Str::after($identity->email, '@');
        $allowed = array_map('strtolower', config('sso.allowed_domains', []));

        if ($identity->email === '' || $domain === '' || ! in_array($domain, $allowed, true)) {
            throw new SsoAuthenticationException('domain', 'Domaine email non autorisé.');
        }

        $user = null;
        if (Schema::hasColumn('users', 'sso_provider') && Schema::hasColumn('users', 'sso_subject')) {
            $user = User::query()
                ->where('sso_provider', $identity->provider)
                ->where('sso_subject', $identity->subject)
                ->first();
        }

        $user ??= User::query()->where('email', $identity->email)->first();

        if (! $user || ! $user->is_active) {
            throw new SsoAuthenticationException('unknown_account', 'Aucun compte ERP pour cette identité.');
        }

        return $user;
    }

    private function linkIdentity(User $user, OidcIdentity $identity): void
    {
        if (! Schema::hasColumn('users', 'sso_provider') || ! Schema::hasColumn('users', 'sso_subject')) {
            return;
        }

        $user->forceFill([
            'sso_provider' => $identity->provider,
            'sso_subject' => $identity->subject,
            'sso_linked_at' => now(),
        ])->save();
    }

    private function assertKnownProvider(string $provider): void
    {
        if (! $this->oidcClient->isConfigured($provider)) {
            throw new SsoAuthenticationException('sso', 'Fournisseur SSO indisponible.');
        }
    }

    private function frontendUrl(): string
    {
        return rtrim((string) config('app.frontend_url', config('app.url', 'http://localhost:5173')), '/');
    }
}
