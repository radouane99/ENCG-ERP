<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $service = app(\App\Services\Academic\ModuleService::class);
    $module = $service->createModule([
        'code' => 'TEST-3',
        'name' => 'Test 3',
        'semester_number' => 1,
        'coefficient' => 1,
        'filiere_id' => 1,
        'credit_hours' => 45,
        'is_active' => true
    ], 1);
    echo "Success";
} catch (\Throwable $e) {
    echo $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine();
}
