<?php
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (getenv('APPLY_MCM_DRAFT') !== '1' || \Illuminate\Support\Facades\DB::connection()->getDatabaseName() !== 'encg_erp') { throw new RuntimeException('Explicit MCM draft generation required.'); }
$filiere = \App\Models\Filiere::where('institution_id', 1)->where('code', 'MCM')->sole();
$before = \App\Models\Schedule::where('is_active', true)->count();
$result = app(\App\Services\Academic\TimetableCampaignService::class)->generateDraft($filiere->id, ['teaching_weeks' => 15, 'max_daily_hours' => 8, 'include_saturday' => false]);
$after = \App\Models\Schedule::where('is_active', true)->count();
if ($before !== $after) { throw new RuntimeException('Unexpected active timetable change.'); }
echo json_encode(['filiere' => 'MCM', 'success' => $result['success'], 'message' => $result['message'], 'version_id' => $result['version_id'] ?? null, 'status' => $result['status'] ?? null, 'placed' => $result['simulation']['total_placed'] ?? null, 'unplaced' => $result['simulation']['unplaced_count'] ?? null, 'active_before' => $before, 'active_after' => $after], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
