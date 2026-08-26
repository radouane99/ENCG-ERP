<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', 'http://localhost:8000/api/v1/auth/google/callback'),
        'allowed_domains' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('GOOGLE_ALLOWED_DOMAINS', 'encg-fes.ac.ma,usmba.ac.ma,gmail.com'))
        ))),
    ],

    'groq' => [
        'key' => env('GROQ_API_KEY', ''),
    ],

    'gemini' => [
        'key' => env('GEMINI_API_KEY', ''),
    ],

    'sentry' => [
        'dsn' => env('SENTRY_LARAVEL_DSN', env('SENTRY_DSN')),
        'environment' => env('SENTRY_ENVIRONMENT', env('APP_ENV', 'production')),
        'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 0.1),
    ],

    'koha' => [
        'base_url' => env('KOHA_BASE_URL', ''),
        'api_key' => env('KOHA_API_KEY', ''),
    ],

    'sms' => [
        'driver' => env('SMS_DRIVER', 'log'),
    ],

];
