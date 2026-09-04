<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Professor;
use App\Models\Schedule;
use App\Models\AttendanceSession;
use App\Models\VacationContract;
use App\Models\VacationPayment;
use Illuminate\Support\Facades\Schema;

echo "--- PROFESSORS ---\n";
foreach (Professor::with('user', 'department')->get() as $p) {
    $schedCount = Schedule::where('professor_id', $p->id)->orWhere('professor_id', $p->user_id)->count();
    echo "ID: {$p->id} | UserID: {$p->user_id} | Name: {$p->user->first_name} {$p->user->last_name} | Contract: {$p->contract_type} | Grade: {$p->grade} | Dept: " . ($p->department->name ?? 'N/A') . " | Schedules: {$schedCount}\n";
}

echo "\n--- SCHEDULES SAMPLE ---\n";
$schedules = Schedule::with(['module', 'group.filiere', 'room'])->where('is_active', true)->get();
echo "Total Active Schedules: " . $schedules->count() . "\n";
foreach ($schedules->take(5) as $s) {
    echo "Day: {$s->day_of_week} | Time: {$s->start_time}-{$s->end_time} | Type: {$s->session_type} | ProfID: {$s->professor_id} | Module: " . ($s->module->name ?? 'N/A') . "\n";
}

echo "\n--- ATTENDANCE SESSIONS ---\n";
if (Schema::hasTable('attendance_sessions')) {
    echo "AttendanceSession count: " . AttendanceSession::count() . "\n";
}

echo "\n--- VACATION TABLES ---\n";
if (Schema::hasTable('vacation_contracts')) {
    echo "VacationContracts: " . VacationContract::count() . "\n";
}
if (Schema::hasTable('vacation_payments')) {
    echo "VacationPayments: " . VacationPayment::count() . "\n";
}
