<?php
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
\Illuminate\Support\Facades\DB::statement('BEGIN READ ONLY');
try {
    $version = \App\Models\ScheduleVersion::whereHas('filiere', fn ($q) => $q->where('code', 'MCM'))->latest('id')->firstOrFail();
    $service = app(\App\Services\Academic\TimetableCampaignService::class);
    $rows = \App\Models\Schedule::with('room')->where('schedule_version_id', $version->id)->get();
    $issues = $service->publicationIssues($version->id, false);
    $board = $service->board($version->id);
    echo json_encode(['version_id' => $version->id, 'status' => $version->status, 'rows' => $rows->count(), 'active_draft_rows' => $rows->where('is_active', true)->count(), 'pre_confirmation_issues' => $issues,
        'rooms' => $rows->groupBy('room_id')->map(fn ($r) => ['name' => $r->first()->room->name, 'capacity' => $r->first()->room->capacity, 'type' => $r->first()->room->type, 'rows' => $r->count()])->values(),
        'grades' => \App\Models\Grade::count()], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
} finally { \Illuminate\Support\Facades\DB::statement('ROLLBACK'); }
