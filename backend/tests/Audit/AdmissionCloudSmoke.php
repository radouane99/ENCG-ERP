<?php

// Explicit opt-in, synthetic text only. Never run this against the project database.
use App\Models\Application;
use App\Models\Institution;
use App\Models\StudentDocument;
use App\Services\Ocr\AdmissionOcrService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

if (! app()->environment('testing') || ! str_ends_with(DB::connection()->getDatabaseName(), '_test') || getenv('ALLOW_SYNTHETIC_CLOUD_SMOKE') !== '1') {
    throw new RuntimeException('Explicit synthetic-cloud opt-in and dedicated test database required.');
}
$app = Application::where('reference_number', 'E2E-TAFEM-001')->firstOrFail();
$institution = Institution::findOrFail($app->campaign->institution_id);
$previous = $institution->settings;
$path = 'admissions-synthetic-smoke/'.Str::uuid().'.pdf';
$document = null; $status = null; $start = microtime(true);
Http::globalResponseMiddleware(function ($response) use (&$status) { $status = $response->getStatusCode(); return $response; });
try {
    $settings = $previous ?? []; $settings['admissions']['ocr_cloud_enabled'] = true;
    $institution->update(['settings' => $settings]);
    $pdf = app('dompdf.wrapper')->loadHTML('<html><body><h1>SYNTHETIC TEST ONLY</h1><p>CNE Z123456789</p><p>CIN XY123456</p><p>Nom SYNTHETIQUE Prenom TEST</p></body></html>')->output();
    Storage::disk('private')->put($path, $pdf);
    $document = StudentDocument::create(['application_id' => $app->id, 'cne' => $app->cne, 'type' => 'bac', 'is_current' => false,
        'version' => 999, 'file_path' => $path, 'mime_type' => 'application/pdf', 'status' => 'pending']);
    $result = app(AdmissionOcrService::class)->extract($document->fresh(), 'cloud');
    echo json_encode(['provider_http_status' => $status, 'cloud_used' => str_contains($result['engine'], '+groq:'),
        'synthetic_cne_matches' => ($result['fields']['cne']['value'] ?? '') === 'Z123456789',
        'synthetic_cin_matches' => ($result['fields']['cin']['value'] ?? '') === 'XY123456',
        'duration_seconds' => round(microtime(true) - $start, 2)], JSON_PRETTY_PRINT).PHP_EOL;
} catch (Throwable $e) {
    echo json_encode(['provider_http_status' => $status, 'cloud_used' => false, 'error_class' => get_class($e), 'duration_seconds' => round(microtime(true) - $start, 2)], JSON_PRETTY_PRINT).PHP_EOL;
} finally {
    if ($document) $document->delete();
    Storage::disk('private')->delete($path);
    $institution->update(['settings' => $previous]);
}
