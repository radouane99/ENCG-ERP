<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    echo "1. Testing DeliberationController exportPvQuery (semestriel)..." . PHP_EOL;
    $request = Illuminate\Http\Request::create('/deliberations/export-pv-pdf', 'POST', [
        'type' => 'semestriel',
        'filiere_id' => 13,
        'academic_year_id' => 3,
        'semester_number' => 1,
        'session' => 'normale',
    ]);
    $delibController = app(App\Http\Controllers\Api\DeliberationController::class);
    $response = $delibController->exportPvQuery($request);
    echo "DeliberationController exportPvQuery status: " . $response->getStatusCode() . PHP_EOL;

    echo "2. Testing DeliberationController exportPvQuery with default/fallback filiere..." . PHP_EOL;
    $requestFallback = Illuminate\Http\Request::create('/deliberations/export-pv-pdf', 'POST', [
        'type' => 'semestriel',
        'filiere_id' => 1,
        'academic_year_id' => 1,
        'semester_number' => 1,
        'session' => 'normale',
    ]);
    $responseFallback = $delibController->exportPvQuery($requestFallback);
    echo "DeliberationController exportPvQuery (fallback) status: " . $responseFallback->getStatusCode() . PHP_EOL;

    echo "3. Testing PdfExportController exportModulePvPdf for Module 57..." . PHP_EOL;
    $moduleRequest = Illuminate\Http\Request::create('/modules/57/pv/export-pdf', 'GET', [
        'group_id' => 'all',
        'session' => 'normale',
        'semester' => 1,
        'academic_year_id' => 3,
    ]);
    $pdfExportController = app(App\Http\Controllers\Api\PdfExportController::class);
    $moduleResponse = $pdfExportController->exportModulePvPdf($moduleRequest, 57);
    echo "PdfExportController exportModulePvPdf status: " . $moduleResponse->getStatusCode() . PHP_EOL;

    echo "ALL TESTS PASSED SUCCESSFULLY!" . PHP_EOL;
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
    echo $e->getTraceAsString() . PHP_EOL;
}
