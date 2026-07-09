<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

DB::statement('DROP VIEW IF EXISTS student_full_profile_view');
DB::statement('DROP VIEW IF EXISTS room_utilization_view');

try {
    Schema::table('schedules', function (Blueprint $t) {
        $t->dropForeign(['schedule_version_id']);
        $t->dropColumn('schedule_version_id');
    });
} catch(\Exception $e) {}

Schema::dropIfExists('schedule_versions');
Schema::dropIfExists('room_equipments');
Schema::dropIfExists('teacher_constraints');
Schema::dropIfExists('holidays');

DB::table('migrations')->where('migration', '2026_07_09_094900_scaffold_timetable_ai_and_views')->delete();
echo "Cleaned Phase 7\n";
