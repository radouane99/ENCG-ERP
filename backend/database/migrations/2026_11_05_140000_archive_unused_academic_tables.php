<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLES = [
        'room_equipments' => 'archived_room_equipments',
        'student_module_reservations' => 'archived_student_module_reservations',
    ];

    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET LOCAL lock_timeout = '5s'");
            DB::statement('LOCK TABLE room_equipments, student_module_reservations IN ACCESS EXCLUSIVE MODE');
        }

        foreach (self::TABLES as $active => $archive) {
            if (DB::table($active)->exists() || Schema::hasTable($archive)) {
                throw new RuntimeException("Archivage interrompu : vérifier {$active} et {$archive}.");
            }
        }

        foreach (self::TABLES as $active => $archive) {
            Schema::rename($active, $archive);
        }
    }

    public function down(): void
    {
        foreach (array_reverse(self::TABLES, true) as $active => $archive) {
            Schema::rename($archive, $active);
        }
    }
};
