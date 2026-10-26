<?php

$defaultOrigins = 'https://erp.irsale.fr,http://localhost:5173,http://localhost';
$rawOrigins = env('CORS_ALLOWED_ORIGINS', env('FRONTEND_URL', $defaultOrigins));
$allowedOrigins = array_values(array_unique(array_filter(array_merge(
    ['https://erp.irsale.fr'],
    array_map(static fn (string $origin): string => trim($origin), explode(',', (string) $rawOrigins))
))));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Content-Disposition'],

    'max_age' => 0,

    'supports_credentials' => true,
];
