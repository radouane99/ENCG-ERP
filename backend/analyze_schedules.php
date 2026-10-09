<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$year = App\Models\AcademicYear::where('is_current', true)->first();
echo "Year: {$year->id} ({$year->name})\n";

$schedules = App\Models\Schedule::with(['module.filiere', 'group', 'professor.user', 'room'])
    ->where('academic_year_id', $year->id)
    ->get();

echo "Total schedules: " . $schedules->count() . "\n";
echo "CM count: " . $schedules->where('session_type', 'cm')->count() . "\n";
echo "TD count: " . $schedules->where('session_type', 'td')->count() . "\n";

// Check modules with multiple CM professors or multiple CM rooms
$cmByModule = $schedules->where('session_type', 'cm')->groupBy('module_id');
echo "\nModules with CM:\n";
foreach ($cmByModule as $mId => $cmSessions) {
    $mod = $cmSessions->first()->module;
    $profs = $cmSessions->map(fn($s) => $s->professor?->user?->name)->unique()->implode(', ');
    $rooms = $cmSessions->map(fn($s) => $s->room?->name)->unique()->implode(', ');
    $groups = $cmSessions->map(fn($s) => $s->group?->name)->unique()->implode(', ');
    echo "- Module {$mod?->code} ({$mod?->name}) : " . $cmSessions->count() . " CM sessions | Profs: [{$profs}] | Rooms: [{$rooms}] | Groups: [{$groups}]\n";
}
