<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

$uuidTables = ['users', 'students', 'professors', 'modules', 'rooms', 'groups', 'schedules'];
foreach($uuidTables as $table){
    try{
        Schema::table($table, function(Blueprint $b) use ($table){
            $b->dropUnique("{$table}_uuid_unique");
            $b->dropColumn('uuid');
        });
    }catch(\Exception $e){}
}

$versionTables = ['schedules', 'grades', 'attendances', 'student_registrations'];
foreach($versionTables as $table){
    try{
        Schema::table($table, function(Blueprint $b){
            $b->dropColumn('version');
        });
    }catch(\Exception $e){}
}

$orphanConfigs = [
    ['table' => 'attendance_sessions', 'col' => 'professor_id', 'ref' => 'professors'],
    ['table' => 'defense_juries', 'col' => 'professor_id', 'ref' => 'professors'],
    ['table' => 'learning_materials', 'col' => 'professor_id', 'ref' => 'professors'],
    ['table' => 'module_professor', 'col' => 'professor_id', 'ref' => 'professors'],
];
foreach($orphanConfigs as $config){
    try{
        Schema::table($config['table'], function(Blueprint $b) use ($config){
            $b->dropForeign([$config['col']]);
            $b->dropIndex([$config['col']]);
        });
    }catch(\Exception $e){}
}

DB::table('migrations')->where('migration', '2026_07_09_093046_optimize_fks_indexes_and_uuids')->delete();
echo "Cleaned\n";
