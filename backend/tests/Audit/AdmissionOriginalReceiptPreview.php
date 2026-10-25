<?php

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

// Read-only visual recipe with synthetic values; never use real student records.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! app()->environment('testing') || ! str_ends_with(DB::connection()->getDatabaseName(), '_test')) {
    throw new RuntimeException('Dedicated testing environment required.');
}
$dossier = (object) ['campaign' => (object) ['institution' => (object) ['name' => 'Établissement de recette synthétique']], 'reference_number' => 'SYN-ORIGINAL-001', 'last_name' => 'CANDIDAT', 'first_name' => 'Synthétique', 'cne' => 'SYN-TEST-ONLY'];
$record = (object) ['id' => 1, 'document_type' => 'bac', 'event' => 'returned', 'created_at' => '2026-10-24 12:00:00'];
$pdf = Pdf::loadView('pdf.admission-original-receipt', ['app' => $dossier, 'record' => $record, 'agent' => 'Agent de recette synthétique'])->setPaper('a4')->output();
file_put_contents(storage_path('app/original-receipt-synthetic-preview.pdf'), $pdf);
echo json_encode(['synthetic' => true, 'bytes' => strlen($pdf)]).PHP_EOL;
