<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "ATTENDANCE: " . \App\Models\AttendanceSession::count() . PHP_EOL;
echo "SCHEDULES: " . \App\Models\Schedule::count() . PHP_EOL;
echo "CONTRACTS: " . \App\Models\VacationContract::count() . PHP_EOL;

$aminaUser = \App\Models\User::where('email', 'gm02.ems03@gmail.com')->first();
$aminaProf = \App\Models\Professor::where('user_id', $aminaUser?->id)->first();
echo "Amina user_id: " . $aminaUser?->id . " prof_id: " . $aminaProf?->id . " type: " . $aminaProf?->type . PHP_EOL;
if ($aminaProf) {
    echo "Amina schedules: " . \App\Models\Schedule::where('professor_id', $aminaProf->id)->count() . PHP_EOL;
    echo "Amina attendance sessions: " . \App\Models\AttendanceSession::where('professor_id', $aminaProf->id)->orWhere('professor_id', $aminaUser->id)->count() . PHP_EOL;
}

$vacProf = \App\Models\Professor::where('type', 'vacataire')->first();
if ($vacProf) {
    echo "Vacataire user_id: " . $vacProf->user_id . " prof_id: " . $vacProf->id . " type: " . $vacProf->type . PHP_EOL;
    echo "Vacataire schedules: " . \App\Models\Schedule::where('professor_id', $vacProf->id)->count() . PHP_EOL;
    echo "Vacataire contracts: " . \App\Models\VacationContract::where('professor_id', $vacProf->id)->count() . PHP_EOL;
}
