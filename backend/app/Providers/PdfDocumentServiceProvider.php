<?php

namespace App\Providers;

use App\Services\Documents\RegisteredPdf;
use Illuminate\Support\ServiceProvider;

class PdfDocumentServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->app->extend('dompdf.wrapper', fn ($wrapper, $app) => new RegisteredPdf($wrapper->getDomPDF(), $app['config'], $app['files'], $app['view']));
    }
}
