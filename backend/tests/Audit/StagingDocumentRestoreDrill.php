<?php

use App\Models\GeneratedDocument;
use App\Services\Core\VerifiedDatabaseBackupService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

require getcwd().'/vendor/autoload.php';
$app = require getcwd().'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! $app->environment('staging') || DB::connection()->getDatabaseName() !== 'encg_staging') {
    throw new RuntimeException('This restore drill is restricted to staging.');
}

$requestId = filter_var(getenv('STAGING_RESTORE_DOCUMENT_ID'), FILTER_VALIDATE_INT);
$source = GeneratedDocument::where('document_request_id', $requestId)->latest('id')->firstOrFail();
$original = Storage::disk('private')->get($source->file_path);
if (! is_string($original) || ! str_starts_with($original, '%PDF-')) {
    throw new RuntimeException('The synthetic source PDF is unavailable.');
}

$service = $app->make(VerifiedDatabaseBackupService::class);
$backup = $service->create();
$target = 'encg_stage_'.date('Ymd_His').'_'.bin2hex(random_bytes(3)).'_restore_test';
$service->verifyRestore($backup['file'], $target);
config(['database.connections.drill' => array_replace(config('database.connections.pgsql'), ['database' => $target])]);
$restored = GeneratedDocument::on('drill')->where('document_request_id', $requestId)->latest('id')->firstOrFail();
if ($restored->verification_token !== $source->verification_token || $restored->file_path !== $source->file_path) {
    throw new RuntimeException('The restored document registry does not match the source.');
}

$disk = Storage::disk('local');
$backupFolder = config('backup.backup.name');
$before = $disk->files($backupFolder);
if (Artisan::call('backup:run', ['--only-files' => true, '--disable-notifications' => true, '--only-to-disk' => 'local']) !== 0) {
    throw new RuntimeException('The file backup failed.');
}
$newArchives = array_values(array_diff($disk->files($backupFolder), $before));
if (count($newArchives) !== 1) {
    throw new RuntimeException('A single new file archive is required.');
}
$zip = new ZipArchive;
if ($zip->open($disk->path($newArchives[0]), ZipArchive::RDONLY) !== true) {
    throw new RuntimeException('The file archive could not be opened.');
}
try {
    if ($password = config('backup.backup.password')) {
        $zip->setPassword($password);
    }
    $suffix = '/private/'.$restored->file_path;
    for ($index = 0; $index < $zip->numFiles; $index++) {
        $name = $zip->getNameIndex($index);
        if (is_string($name) && str_ends_with('/'.$name, $suffix)) {
            $contents = $zip->getFromIndex($index);
            if ($contents === $original) {
                echo json_encode(['restored_database' => $target, 'registered_pdf_matches_archive' => true]).PHP_EOL;

                return;
            }
            break;
        }
    }
    throw new RuntimeException('The PDF restored from the archive does not match the registry source.');
} finally {
    $zip->close();
}
