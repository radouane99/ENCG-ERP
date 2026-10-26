<?php

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
\Illuminate\Support\Facades\DB::statement('BEGIN READ ONLY');
try {
    $workspace = app(\App\Services\Academic\TimetableCampaignService::class)->workspace();
    $results = [];
    foreach ($workspace['filieres'] as $filiere) {
        $except = empty($filiere['version_id']) ? [] : \App\Models\Schedule::where('schedule_version_id', $filiere['version_id'])->pluck('id')->all();
        $result = app(\App\Services\Academic\SmartSchedulingEngine::class)->simulate(['filiere_id' => $filiere['filiere_id'], 'semester_id' => $workspace['semester']['id'], 'teaching_weeks' => 15, 'max_daily_hours' => 8, 'include_saturday' => false, 'except_schedule_ids' => $except]);
        $results[] = ['filiere' => $filiere['filiere_code'], 'required' => $result['total_variables'] ?? null, 'placed' => $result['total_placed'] ?? null, 'unplaced' => $result['unplaced_count'] ?? null, 'input_issues' => $result['input_issues'] ?? [], 'conflicts_prevented' => $result['conflicts_prevented'] ?? null];
    }
    echo json_encode(['read_only' => true, 'results' => $results], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
} finally {
    \Illuminate\Support\Facades\DB::statement('ROLLBACK');
}
