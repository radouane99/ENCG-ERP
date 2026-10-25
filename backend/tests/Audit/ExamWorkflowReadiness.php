<?php

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

DB::statement('BEGIN READ ONLY');
try {
    $year = DB::table('academic_years')->where('institution_id', config('erp.institution_id', 1))->where('is_current', true)->first();
    $sessions = DB::table('exam_sessions')->where('academic_year_id', $year?->id)->pluck('id');
    $exams = DB::table('exams')->whereIn('exam_session_id', $sessions)->pluck('id');
    echo json_encode([
        'database' => DB::connection()->getDatabaseName(), 'read_only' => true,
        'academic_year' => $year?->label, 'sessions' => $sessions->count(), 'exams' => $exams->count(),
        'grades_preserved' => DB::table('grades')->count(),
        'seating_status_column' => Schema::hasColumn('exam_seatings', 'status'),
        'pv_seal_column' => Schema::hasColumn('exams', 'pv_seal_hash'),
        'resit_year_column' => Schema::hasColumn('resit_eligibilities', 'academic_year_id'),
        'legacy_resit_without_year' => DB::table('resit_eligibilities')->whereNull('academic_year_id')->count(),
        'pending_exam_incidents' => DB::table('exam_incidents')->whereIn('exam_id', $exams)->whereNotIn('status', ['resolved', 'dismissed'])->count(),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
} finally { DB::statement('ROLLBACK'); }
