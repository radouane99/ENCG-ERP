<?php

use App\Models\Grade;
use App\Models\Schedule;
use App\Models\ScheduleVersion;
use App\Services\Academic\TimetableCampaignService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
DB::statement('BEGIN READ ONLY');
try {
    $version = ScheduleVersion::whereHas('filiere', fn ($q) => $q->where('code', 'MCM'))->latest('id')->firstOrFail();
    $service = app(TimetableCampaignService::class);
    $rows = Schedule::with('room')->where('schedule_version_id', $version->id)->get();
    $issues = $service->publicationIssues($version->id, false);
    $board = $service->board($version->id);
    echo json_encode(['version_id' => $version->id, 'status' => $version->status, 'rows' => $rows->count(), 'active_draft_rows' => $rows->where('is_active', true)->count(), 'pre_confirmation_issues' => $issues,
        'rooms' => $rows->groupBy('room_id')->map(fn ($r) => ['name' => $r->first()->room->name, 'capacity' => $r->first()->room->capacity, 'type' => $r->first()->room->type, 'rows' => $r->count()])->values(),
        'grades' => Grade::count()], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
} finally {
    DB::statement('ROLLBACK');
}
