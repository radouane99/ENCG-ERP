<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$r1 = Illuminate\Validation\Rule::exists('assessments', 'id')->where('needs_review', false);
echo "R1: " . (string) $r1 . "\n";

$r2 = Illuminate\Validation\Rule::exists('assessments', 'id')->where(function ($q) {
    $q->where('needs_review', false);
});
echo "R2: " . (string) $r2 . "\n";

$v1 = Illuminate\Support\Facades\Validator::make(['id' => 319], [
    'id' => [
        Illuminate\Validation\Rule::exists('assessments', 'id')->where(function ($q) {
            $q->where('module_id', 76)->where('needs_review', false);
        })
    ]
]);
try {
    $v1->validate();
    echo "Validation with closure passed or failed cleanly without SQL error\n";
} catch (\Throwable $e) {
    echo "Error with closure: " . $e->getMessage() . "\n";
}
