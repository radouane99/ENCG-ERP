<?php

declare(strict_types=1);

$allowedDomains = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('SSO_ALLOWED_DOMAINS', env('GOOGLE_ALLOWED_DOMAINS', 'encg-fes.ac.ma,usmba.ac.ma,gmail.com')))
)));

return [

    /*
    |--------------------------------------------------------------------------
    | OpenID Connect / OAuth 2.0 SSO
    |--------------------------------------------------------------------------
    |
    | Authorization Code + PKCE. Users must already exist in the ERP
    | (no JIT provisioning). Email domain must be in allowed_domains.
    |
    */

    'allowed_domains' => $allowedDomains,

    'providers' => [
        'google' => [
            'label' => 'Google Workspace',
            'client_id' => env('GOOGLE_CLIENT_ID'),
            'client_secret' => env('GOOGLE_CLIENT_SECRET'),
            'redirect' => env('GOOGLE_REDIRECT_URI', env('APP_URL', 'http://localhost').'/api/v1/auth/sso/google/callback'),
            'issuer' => 'https://accounts.google.com',
        ],
        'microsoft' => [
            'label' => 'Microsoft 365',
            'client_id' => env('AZURE_AD_CLIENT_ID', env('AZURE_CLIENT_ID')),
            'client_secret' => env('AZURE_AD_CLIENT_SECRET', env('AZURE_CLIENT_SECRET')),
            'tenant' => env('AZURE_AD_TENANT_ID', env('AZURE_TENANT_ID', 'organizations')),
            'redirect' => env('AZURE_AD_REDIRECT_URI', env('APP_URL', 'http://localhost').'/api/v1/auth/sso/microsoft/callback'),
            'issuer' => null,
        ],
        'oidc' => [
            'label' => env('OIDC_LABEL', 'SSO institutionnel'),
            'client_id' => env('OIDC_CLIENT_ID'),
            'client_secret' => env('OIDC_CLIENT_SECRET'),
            'redirect' => env('OIDC_REDIRECT_URI', env('APP_URL', 'http://localhost').'/api/v1/auth/sso/oidc/callback'),
            'issuer' => env('OIDC_ISSUER'),
        ],
    ],

];
