<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
try {
    App\Models\Module::create([
        'code' => 'TC-S1-MD2',
        'name' => 'Maths 2',
        'semester_number' => 1,
        'coefficient' => 2,
        'filiere_id' => 1,
        'institution_id' => 1,
        'credit_hours' => 45,
        'is_active' => true
    ]);
    echo "SUCCESS";
} catch(\Exception $e) {
    echo $e->getMessage();
}
