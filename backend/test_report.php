<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $controller = app(\App\Http\Controllers\Api\Admin\AdminMinistryReportController::class);
    $response = $controller->getReport();
    echo "STATUS: " . $response->getStatusCode() . "\n";
    $data = $response->getData(true);
    echo "SUCCESS! Filières count: " . count($data['effectifs']['par_filiere']) . "\n";
    echo "Total inscrits: " . $data['effectifs']['total_inscrits'] . "\n";
    echo json_encode($data['effectifs'], JSON_PRETTY_PRINT) . "\n";
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
}
