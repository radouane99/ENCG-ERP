<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::where('email', 'gm02.ems03@gmail.com')->first();
$prof = \App\Models\Professor::where('user_id', $user->id)->first();

echo "User: " . $user->name . " (ID: " . $user->id . ")\n";
echo "Professor ID: " . $prof->id . " Grade: " . $prof->grade . " Type: " . $prof->type . "\n";

$schedules = \App\Models\Schedule::with(['module', 'group.filiere', 'room'])->where('professor_id', $prof->id)->get();
echo "Total schedules in DB for this professor: " . $schedules->count() . "\n\n";

foreach ($schedules as $s) {
    echo sprintf(
        "Schedule #%d: Day %d | %s-%s (%s) | Module: %s | Group: %s | Room: %s\n",
        $s->id,
        $s->day_of_week,
        $s->start_time,
        $s->end_time,
        $s->session_type,
        $s->module?->name ?? 'N/A',
        $s->group?->name ?? 'N/A',
        $s->room?->name ?? 'N/A'
    );
}

$attendanceCount = \App\Models\AttendanceSession::where('professor_id', $prof->id)->orWhere('professor_id', $user->id)->count();
echo "\nAttendance Sessions in DB: " . $attendanceCount . "\n";

// Let's test what getWorkloadSummary produces for this user
$req = \Illuminate\Http\Request::create('/api/professor-portal/workload', 'GET');
$req->setUserResolver(fn() => $user);

$controller = app(\App\Http\Controllers\Api\Professor\ProfessorPortalController::class);
$res = $controller->getWorkloadSummary($req);
echo "\n--- getWorkloadSummary Response ---\n";
echo json_encode($res->getData(true), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
