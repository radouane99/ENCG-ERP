<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

use function Pest\Laravel\get;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

function configureGoogleSso(): void
{
    config([
        'sso.allowed_domains' => ['encg-fes.ac.ma'],
        'sso.providers.google.client_id' => 'google-client',
        'sso.providers.google.client_secret' => 'google-secret',
        'sso.providers.google.redirect' => 'http://localhost/api/v1/auth/sso/google/callback',
        'sso.providers.microsoft.client_id' => null,
        'sso.providers.oidc.client_id' => null,
        'app.frontend_url' => 'http://localhost:5173',
    ]);
}

function oidcIdToken(array $payload): string
{
    $header = rtrim(strtr(base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT'])), '+/', '-_'), '=');
    $body = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');

    return $header.'.'.$body.'.sig';
}

it('lists only configured OpenID Connect providers', function () {
    config([
        'sso.providers.google.client_id' => '',
        'sso.providers.microsoft.client_id' => 'azure-client',
        'sso.providers.microsoft.client_secret' => 'azure-secret',
        'sso.providers.oidc.client_id' => '',
    ]);

    getJson('/api/v1/auth/sso/providers')
        ->assertOk()
        ->assertJsonCount(1, 'data.providers')
        ->assertJsonPath('data.providers.0.id', 'microsoft');
});

it('starts an OIDC authorization-code plus PKCE redirect for Google', function () {
    configureGoogleSso();

    $response = get('/api/v1/auth/sso/google/redirect');

    $response->assertRedirect();
    $location = $response->headers->get('Location');
    expect($location)->toContain('https://accounts.google.com/o/oauth2/v2/auth')
        ->and($location)->toContain('scope=openid')
        ->and($location)->toContain('code_challenge_method=S256')
        ->and($location)->toContain('response_type=code');
});

it('keeps the legacy Google redirect alias', function () {
    configureGoogleSso();

    get('/api/v1/auth/google/redirect')->assertRedirect();
});

it('rejects an unknown SSO provider', function () {
    getJson('/api/v1/auth/sso/unknown/redirect')->assertNotFound();
});

it('rejects an SSO identity outside the institutional domain', function () {
    configureGoogleSso();
    $state = 'state-domain';
    Cache::put('sso_oidc_'.$state, [
        'provider' => 'google',
        'nonce' => 'nonce-1',
        'verifier' => 'verifier-1',
    ], now()->addMinutes(10));

    Http::fake([
        'oauth2.googleapis.com/token' => Http::response([
            'id_token' => oidcIdToken([
                'sub' => 'ext-1',
                'email' => 'user@gmail.com',
                'nonce' => 'nonce-1',
                'aud' => 'google-client',
                'exp' => time() + 3600,
            ]),
            'access_token' => 'atok',
        ]),
    ]);

    get('/api/v1/auth/sso/google/callback?code=idp-code&state='.$state)
        ->assertRedirect('http://localhost:5173/login?error=domain');
});

it('rejects SSO when no ERP account exists for the identity', function () {
    configureGoogleSso();
    $state = 'state-unknown';
    Cache::put('sso_oidc_'.$state, [
        'provider' => 'google',
        'nonce' => 'nonce-2',
        'verifier' => 'verifier-2',
    ], now()->addMinutes(10));

    Http::fake([
        'oauth2.googleapis.com/token' => Http::response([
            'id_token' => oidcIdToken([
                'sub' => 'g-2',
                'email' => 'inconnu@encg-fes.ac.ma',
                'nonce' => 'nonce-2',
                'aud' => 'google-client',
                'exp' => time() + 3600,
            ]),
            'access_token' => 'atok',
        ]),
    ]);

    get('/api/v1/auth/sso/google/callback?code=idp-code&state='.$state)
        ->assertRedirect('http://localhost:5173/login?error=unknown_account');
});

it('completes OIDC login and exchanges the one-time code for a Sanctum session', function () {
    configureGoogleSso();
    $user = User::factory()->create([
        'email' => 'prof@encg-fes.ac.ma',
        'is_active' => true,
    ]);

    $state = 'state-ok';
    Cache::put('sso_oidc_'.$state, [
        'provider' => 'google',
        'nonce' => 'nonce-ok',
        'verifier' => 'verifier-ok',
    ], now()->addMinutes(10));

    Http::fake([
        'oauth2.googleapis.com/token' => Http::response([
            'id_token' => oidcIdToken([
                'sub' => 'google-sub-ok',
                'email' => 'prof@encg-fes.ac.ma',
                'nonce' => 'nonce-ok',
                'aud' => 'google-client',
                'exp' => time() + 3600,
            ]),
            'access_token' => 'atok',
        ]),
    ]);

    $redirect = get('/api/v1/auth/sso/google/callback?code=idp-code&state='.$state);
    $redirect->assertRedirect();
    $location = $redirect->headers->get('Location');
    expect($location)->toStartWith('http://localhost:5173/auth/callback?code=');

    $code = (string) parse_url((string) $location, PHP_URL_QUERY);
    parse_str($code, $query);

    postJson('/api/v1/auth/sso/exchange', ['code' => $query['code']])
        ->assertOk()
        ->assertJsonPath('data.authenticated', true);

    expect($user->fresh()->sso_provider)->toBe('google')
        ->and($user->fresh()->sso_subject)->toBe('google-sub-ok');
});

it('rejects a reused SSO exchange code', function () {
    postJson('/api/v1/auth/sso/exchange', ['code' => 'already-used'])
        ->assertStatus(422);
});
