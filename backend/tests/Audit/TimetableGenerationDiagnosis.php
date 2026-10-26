<?php

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
\Illuminate\Support\Facades\DB::statement('BEGIN READ ONLY');
try {
    $workspace = app(\App\Services\Academic\TimetableCampaignService::class)->workspace();
    $results = [];
    foreach ($workspace['filieres'] as $filiere) {
        $guard = app(\App\Services\Academic\TimetableRoomGuard::class);
        $strategy = new class($guard) extends \App\Services\Academic\TimetablePerformanceStrategy {
            public array $diagnosis = [];
            public function place(array $variables, \Illuminate\Support\Collection $rooms, array $config = []): array {
                $result = parent::place($variables, $rooms, $config);
                $guard = app(\App\Services\Academic\TimetableRoomGuard::class);
                $this->diagnosis = array_map(fn ($v) => ['module' => $v['module_code'], 'group' => $v['group_name'], 'type' => $v['session_type'], 'effectif' => $v['group_size'], 'suitable_rooms' => $guard->feasibleRooms($v, $rooms)->count()], $result['unplaced']);
                return $result;
            }
        };
        $except = empty($filiere['version_id']) ? [] : \App\Models\Schedule::where('schedule_version_id', $filiere['version_id'])->pluck('id')->all();
        if (getenv('DIAG_REPLACEMENT') === '1') {
            $except = array_merge($except, \App\Models\Schedule::where('academic_year_id', $workspace['academic_year']['id'])->whereNull('schedule_version_id')->where('is_active', true)
                ->whereHas('module', fn ($q) => $q->where('filiere_id', $filiere['filiere_id'])->whereRaw('MOD(semester_number, 2) = ?', [$workspace['semester']['number'] % 2]))->pluck('id')->all());
        }
        $result = (new \App\Services\Academic\SmartSchedulingEngine($strategy))->simulate(['filiere_id' => $filiere['filiere_id'], 'semester_id' => $workspace['semester']['id'], 'teaching_weeks' => 15, 'max_daily_hours' => 8, 'include_saturday' => false, 'except_schedule_ids' => $except]);
        $results[] = ['filiere' => $filiere['filiere_code'], 'required' => $result['total_variables'] ?? null, 'placed' => $result['total_placed'] ?? null, 'unplaced' => $result['unplaced_count'] ?? null, 'input_issues' => $result['input_issues'] ?? [], 'details' => $strategy->diagnosis];
    }
    echo json_encode(['read_only' => true, 'results' => $results], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
} finally {
    \Illuminate\Support\Facades\DB::statement('ROLLBACK');
}
