<?php

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

DB::statement('BEGIN READ ONLY');
try {
    $out = [];
    foreach (['filieres', 'modules', 'groups', 'rooms', 'module_professor', 'schedules'] as $table) {
        $rows = DB::table($table);
        if ($table === 'filieres') {
            $rows->select('id', 'code', 'name');
        } elseif ($table === 'modules') {
            $rows->select('id', 'code', 'name', 'filiere_id', 'semester_number', 'hours_cm', 'hours_td', 'hours_tp');
        } elseif ($table === 'groups') {
            $rows->select('id', 'name', 'filiere_id', 'semester_number', 'academic_year_id', 'capacity');
        } elseif ($table === 'rooms') {
            $rows->select('id', 'name', 'type', 'capacity', 'is_available');
        } elseif ($table === 'module_professor') {
            $rows->select('id', 'module_id', 'group_id', 'professor_id', 'academic_year_id', 'session_type', 'assigned_hours');
        } else {
            $out['schedule_counts'] = DB::table('schedules')->selectRaw('academic_year_id, is_active, schedule_version_id, count(*) as count')->groupBy('academic_year_id', 'is_active', 'schedule_version_id')->get();

            continue;
        }
        $out[$table] = $rows->get();
    }
    $out['registration_counts'] = DB::table('student_registrations')->selectRaw('academic_year_id,group_id,status,count(distinct student_id) as students')->groupBy('academic_year_id', 'group_id', 'status')->get();
    echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
} finally {
    DB::statement('ROLLBACK');
}
