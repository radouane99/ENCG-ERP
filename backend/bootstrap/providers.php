<?php

use App\Providers\AiServiceProvider;
use App\Providers\AppServiceProvider;
use App\Providers\HorizonServiceProvider;
use App\Providers\PdfDocumentServiceProvider;
use App\Providers\TelescopeServiceProvider;

$providers = [
    AiServiceProvider::class,
    AppServiceProvider::class,
    PdfDocumentServiceProvider::class,
    HorizonServiceProvider::class,
];

if (($_ENV['APP_ENV'] ?? getenv('APP_ENV') ?: 'production') === 'local') {
    $providers[] = TelescopeServiceProvider::class;
}

return $providers;
