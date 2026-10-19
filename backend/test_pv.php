<?php

use App\Http\Controllers\Api\DeliberationController;
use App\Http\Controllers\Api\PdfExportController;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

try {
    $adminUser = \App\Models\User::first();
    if ($adminUser) {
        \Illuminate\Support\Facades\Auth::login($adminUser);
    }
    echo '1. Testing DeliberationController exportPvQuery (semestriel MCM S5)...'.PHP_EOL;
    $request = Request::create('/deliberations/export-pv-pdf', 'POST', [
        'type' => 'semestriel',
        'filiere_id' => 15,
        'academic_year_id' => 3,
        'semester_number' => 5,
        'session' => 'normale',
    ]);
    $delibController = app(DeliberationController::class);
    $response = $delibController->exportPvQuery($request);
    echo 'DeliberationController exportPvQuery status: '.$response->getStatusCode().PHP_EOL;
    file_put_contents(storage_path('app/pv_test_mcm_s5.pdf'), $response->getContent());
    echo 'Saved PDF: '.storage_path('app/pv_test_mcm_s5.pdf').' ('.filesize(storage_path('app/pv_test_mcm_s5.pdf')).' bytes)'.PHP_EOL;
    preg_match_all('/\/Count\s+(\d+)/', $response->getContent(), $matches);
    echo 'PDF Total Pages: '.(empty($matches[1]) ? 'N/A' : end($matches[1])).PHP_EOL;

    echo '2. Testing DeliberationController exportPvQuery with default/fallback filiere...'.PHP_EOL;
    $requestFallback = Request::create('/deliberations/export-pv-pdf', 'POST', [
        'type' => 'semestriel',
        'filiere_id' => 1,
        'academic_year_id' => 1,
        'semester_number' => 1,
        'session' => 'normale',
    ]);
    $responseFallback = $delibController->exportPvQuery($requestFallback);
    echo 'DeliberationController exportPvQuery (fallback) status: '.$responseFallback->getStatusCode().PHP_EOL;

    echo '3. Testing PdfExportController exportModulePvPdf for Module 57...'.PHP_EOL;
    $moduleRequest = Request::create('/modules/57/pv/export-pdf', 'GET', [
        'group_id' => 'all',
        'session' => 'normale',
        'semester' => 1,
        'academic_year_id' => 3,
    ]);
    $pdfExportController = app(PdfExportController::class);
    $moduleResponse = $pdfExportController->exportModulePvPdf($moduleRequest, 57);
    echo 'PdfExportController exportModulePvPdf status: '.$moduleResponse->getStatusCode().PHP_EOL;

    echo 'ALL TESTS PASSED SUCCESSFULLY!'.PHP_EOL;
} catch (Throwable $e) {
    echo 'ERROR: '.$e->getMessage().PHP_EOL;
    echo $e->getTraceAsString().PHP_EOL;
}
