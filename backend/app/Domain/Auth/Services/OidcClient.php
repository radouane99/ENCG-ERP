<?php

declare(strict_types=1);

namespace App\Domain\Auth\Services;

use App\Domain\Auth\Dto\OidcIdentity;
use App\Domain\Auth\Exceptions\SsoAuthenticationException;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class OidcClient
{
    /**
     * @return array{authorization_endpoint: string, token_endpoint: string, userinfo_endpoint: ?string, issuer: string, client_id: string, client_secret: string, redirect: string}
     */
    public function endpoints(string $provider): array
    {
        $config = $this->providerConfig($provider);
        $clientId = trim((string) ($config['client_id'] ?? ''));
        $clientSecret = (string) ($config['client_secret'] ?? '');
        $redirect = (string) ($config['redirect'] ?? '');

        if ($clientId === '' || $redirect === '') {
            throw new SsoAuthenticationException('sso', 'Fournisseur SSO non configuré.');
        }

        $discovered = match ($provider) {
            'google' => [
                'issuer' => 'https://accounts.google.com',
                'authorization_endpoint' => 'https://accounts.google.com/o/oauth2/v2/auth',
                'token_endpoint' => 'https://oauth2.googleapis.com/token',
                'userinfo_endpoint' => 'https://openidconnect.googleapis.com/v1/userinfo',
                'jwks_uri' => 'https://www.googleapis.com/oauth2/v3/certs',
            ],
            'microsoft' => $this->microsoftEndpoints((string) ($config['tenant'] ?? 'organizations')),
            'oidc' => $this->discover((string) ($config['issuer'] ?? '')),
            default => throw new SsoAuthenticationException('sso', 'Fournisseur SSO inconnu.'),
        };

        return array_merge($discovered, [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'redirect' => $redirect,
        ]);
    }

    /**
     * @return array{url: string, state: string, nonce: string, verifier: string}
     */
    public function authorizationRequest(string $provider): array
    {
        $ep = $this->endpoints($provider);
        $state = Str::random(48);
        $nonce = Str::random(32);
        $verifier = $this->base64Url(random_bytes(32));
        $challenge = $this->base64Url(hash('sha256', $verifier, true));

        $query = http_build_query([
            'client_id' => $ep['client_id'],
            'redirect_uri' => $ep['redirect'],
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'nonce' => $nonce,
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
            'response_mode' => 'query',
        ]);

        return [
            'url' => $ep['authorization_endpoint'].'?'.$query,
            'state' => $state,
            'nonce' => $nonce,
            'verifier' => $verifier,
        ];
    }

    public function redeem(string $provider, string $code, string $verifier, string $nonce): OidcIdentity
    {
        $ep = $this->endpoints($provider);

        $response = Http::asForm()
            ->acceptJson()
            ->timeout(20)
            ->post($ep['token_endpoint'], [
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => $ep['redirect'],
                'client_id' => $ep['client_id'],
                'client_secret' => $ep['client_secret'],
                'code_verifier' => $verifier,
            ]);

        if (! $response->successful()) {
            throw new SsoAuthenticationException('sso', 'Échange du code OIDC refusé par l\'IdP.');
        }

        $idToken = (string) $response->json('id_token', '');
        $accessToken = (string) $response->json('access_token', '');
        try {
            $uri = $ep['jwks_uri'] ?? '';
            if (parse_url($uri, PHP_URL_SCHEME) !== 'https') {
                throw new \RuntimeException('JWKS HTTPS requis.');
            }
            $key = 'oidc_jwks_'.hash('sha256', $uri);
            $keys = Cache::remember($key, 300, fn () => Http::acceptJson()->timeout(15)->get($uri)->throw()->json());
            $claims = (array) JWT::decode($idToken, JWK::parseKeySet($keys, 'RS256'));
        } catch (\Throwable) {
            throw new SsoAuthenticationException('sso', 'Signature OIDC invalide.');
        }
        $issuer = $ep['issuer'];
        if (str_contains($issuer, '{tenantid}')) {
            $tenant = (string) ($claims['tid'] ?? '');
            if (! preg_match('/^[a-f0-9-]{36}$/i', $tenant)) {
                throw new SsoAuthenticationException('sso', 'Tenant invalide.');
            }
            $issuer = str_replace('{tenantid}', $tenant, $issuer);
        }
        if (($claims['iss'] ?? '') !== $issuer || ! isset($claims['aud'], $claims['exp'], $claims['sub'])) {
            throw new SsoAuthenticationException('sso', 'Claims OIDC incomplets ou émetteur invalide.');
        }
        if (($provider === 'google' || array_key_exists('email_verified', $claims)) && ($claims['email_verified'] ?? false) !== true) {
            throw new SsoAuthenticationException('sso', 'Adresse non vérifiée par le fournisseur.');
        }

        if ($nonce !== '' && ($claims['nonce'] ?? null) !== $nonce) {
            throw new SsoAuthenticationException('sso', 'Nonce OIDC invalide.');
        }

        if (isset($claims['aud'])) {
            $audience = $claims['aud'];
            $ok = is_array($audience) ? in_array($ep['client_id'], $audience, true) : $audience === $ep['client_id'];
            if (! $ok) {
                throw new SsoAuthenticationException('sso', 'Audience du jeton OIDC invalide.');
            }
        }

        if (isset($claims['exp']) && (int) $claims['exp'] < time() - 30) {
            throw new SsoAuthenticationException('sso', 'Jeton OIDC expiré.');
        }

        $email = $this->claimEmail($claims);
        $subject = (string) ($claims['sub'] ?? '');
        $name = isset($claims['name']) ? (string) $claims['name'] : null;

        if (($email === '' || $subject === '') && $accessToken !== '' && ! empty($ep['userinfo_endpoint'])) {
            $userinfo = Http::withToken($accessToken)
                ->acceptJson()
                ->timeout(15)
                ->get($ep['userinfo_endpoint']);

            if ($userinfo->successful()) {
                $info = $userinfo->json() ?? [];
                if (($info['sub'] ?? null) !== $subject) {
                    throw new SsoAuthenticationException('sso', 'Identités OIDC incohérentes.');
                }
                $email = $email !== '' ? $email : $this->claimEmail($info);
                $subject = $subject !== '' ? $subject : (string) ($info['sub'] ?? '');
                $name = $name ?? (isset($info['name']) ? (string) $info['name'] : null);
            }
        }

        if ($email === '' || $subject === '') {
            throw new SsoAuthenticationException('sso', 'L\'IdP n\'a pas renvoyé d\'identité utilisable.');
        }

        return new OidcIdentity(
            provider: $provider,
            subject: $subject,
            email: strtolower($email),
            name: $name,
        );
    }

    public function isConfigured(string $provider): bool
    {
        try {
            $config = $this->providerConfig($provider);
        } catch (SsoAuthenticationException) {
            return false;
        }

        $clientId = trim((string) ($config['client_id'] ?? ''));
        if ($clientId === '' || empty($config['client_secret']) || empty($config['redirect'])) {
            return false;
        }

        if ($provider === 'oidc') {
            return trim((string) ($config['issuer'] ?? '')) !== '';
        }

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function providerConfig(string $provider): array
    {
        $config = config('sso.providers.'.$provider);
        if (! is_array($config)) {
            throw new SsoAuthenticationException('sso', 'Fournisseur SSO inconnu.');
        }

        return $config;
    }

    /**
     * @return array{issuer: string, authorization_endpoint: string, token_endpoint: string, userinfo_endpoint: ?string}
     */
    private function microsoftEndpoints(string $tenant): array
    {
        $tenant = $tenant !== '' ? $tenant : 'organizations';

        return $this->discover('https://login.microsoftonline.com/'.rawurlencode($tenant).'/v2.0');
    }

    /**
     * @return array{issuer: string, authorization_endpoint: string, token_endpoint: string, userinfo_endpoint: ?string}
     */
    private function discover(string $issuer): array
    {
        $issuer = rtrim($issuer, '/');
        if ($issuer === '' || parse_url($issuer, PHP_URL_SCHEME) !== 'https') {
            throw new SsoAuthenticationException('sso', 'Issuer OIDC manquant.');
        }

        $response = Http::acceptJson()
            ->timeout(15)
            ->get($issuer.'/.well-known/openid-configuration');

        if (! $response->successful()) {
            throw new SsoAuthenticationException('sso', 'Découverte OpenID Connect impossible.');
        }

        $authorization = (string) $response->json('authorization_endpoint', '');
        $token = (string) $response->json('token_endpoint', '');
        if ($authorization === '' || $token === '') {
            throw new SsoAuthenticationException('sso', 'Configuration OpenID Connect incomplète.');
        }

        $userinfo = $response->json('userinfo_endpoint');
        foreach (array_filter([$authorization, $token, $response->json('jwks_uri'), $userinfo], fn ($url) => $url !== null) as $endpoint) {
            if (! is_string($endpoint) || parse_url($endpoint, PHP_URL_SCHEME) !== 'https') {
                throw new SsoAuthenticationException('sso', 'Endpoints HTTPS requis.');
            }
        }

        return [
            'issuer' => (string) $response->json('issuer', $issuer),
            'authorization_endpoint' => $authorization,
            'token_endpoint' => $token,
            'userinfo_endpoint' => is_string($userinfo) && $userinfo !== '' ? $userinfo : null,
            'jwks_uri' => $response->json('jwks_uri'),
        ];
    }

    /**
     * @param  array<string, mixed>  $claims
     */
    private function claimEmail(array $claims): string
    {
        foreach (['email', 'preferred_username', 'upn'] as $key) {
            $value = $claims[$key] ?? null;
            if (is_string($value) && filter_var($value, FILTER_VALIDATE_EMAIL)) {
                return strtolower($value);
            }
        }

        return '';
    }

    private function base64Url(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }
}
