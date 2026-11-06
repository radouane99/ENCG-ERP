<?php

use App\Services\Core\VerifiedDatabaseBackupService;
use Illuminate\Contracts\Console\Kernel;

// Read-only source backup; writes exclusively a new, deliberately isolated restore database.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$service = $app->make(VerifiedDatabaseBackupService::class);
$manifest = $service->create();
$target = 'encg_drill_'.date('Ymd_His').'_'.bin2hex(random_bytes(3)).'_restore_test';
$verified = $service->verifyRestore($manifest['file'], $target);
echo json_encode([
    'archive_readable' => $verified['archive_readable'],
    'restore_verified' => $verified['restore_verified'],
    'restored_grades' => $verified['restored_grades'],
    'restore_database' => $target,
], JSON_PRETTY_PRINT).PHP_EOL;
