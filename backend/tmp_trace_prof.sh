#!/bin/sh
grep -r 'models/Professor' app bootstrap database routes config 2>/dev/null | head -40
echo '---'
grep -r 'app/models' vendor/composer 2>/dev/null | head -20
echo '---'
# Trace who loads Professor during service resolve
php -d display_errors=1 <<'PHP'
<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

spl_autoload_register(function ($class) {
    if ($class === 'App\\Models\\Professor') {
        $bt = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 8);
        file_put_contents('storage/logs/prof_autoload_trace.txt', print_r($bt, true), FILE_APPEND);
    }
}, true, true);

try {
    $r = app(App\Services\Analytics\DashboardAnalyticsService::class)->getProfessorStats(10);
    file_put_contents('storage/logs/prof_stats_check.json', json_encode($r['data'] ?? $r));
    echo "SUCCESS modules=" . ($r['data']['total_modules'] ?? '?') . "\n";
} catch (Throwable $e) {
    echo "FAIL " . $e->getMessage() . "\n";
}
PHP
