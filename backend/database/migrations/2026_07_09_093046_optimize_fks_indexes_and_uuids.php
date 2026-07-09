<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $uuidTables = ['users', 'students', 'professors', 'modules', 'rooms', 'groups', 'schedules'];
        $versionTables = ['schedules', 'grades', 'attendances', 'student_registrations'];

        // 1. Add UUIDs
        foreach ($uuidTables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                if (!Schema::hasColumn($table->getTable(), 'uuid')) {
                    $table->uuid('uuid')->nullable()->after('id');
                }
            });
        }

        // 2. Populate UUIDs safely
        DB::transaction(function () use ($uuidTables) {
            foreach ($uuidTables as $tableName) {
                DB::table($tableName)->whereNull('uuid')->orderBy('id')->chunkById(1000, function ($records) use ($tableName) {
                    foreach ($records as $record) {
                        DB::table($tableName)->where('id', $record->id)->update(['uuid' => Str::uuid()]);
                    }
                    Log::info("Populated UUIDs for {$tableName} chunk", ['count' => count($records)]);
                });
            }
        });

        // 3. Make UUIDs Unique & Indexed
        foreach ($uuidTables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->unique('uuid');
            });
        }

        // 4. Add Optimistic Locking (version)
        foreach ($versionTables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                if (!Schema::hasColumn($table->getTable(), 'version')) {
                    $table->integer('version')->default(1)->after('updated_at');
                }
            });
        }

        // 5. Clean Orphans and enforce strict FKs
        $orphanConfigs = [
            ['table' => 'attendance_sessions', 'col' => 'professor_id', 'ref' => 'professors'],
            ['table' => 'defense_juries', 'col' => 'professor_id', 'ref' => 'professors'],
            ['table' => 'learning_materials', 'col' => 'professor_id', 'ref' => 'professors'],
            ['table' => 'module_professor', 'col' => 'professor_id', 'ref' => 'professors'],
        ];

        foreach ($orphanConfigs as $config) {
            // Pre-flight: Delete orphans safely
            DB::statement("DELETE FROM {$config['table']} WHERE {$config['col']} IS NOT NULL AND {$config['col']} NOT IN (SELECT id FROM {$config['ref']})");
            
            Schema::table($config['table'], function (Blueprint $table) use ($config) {
                // Ensure index exists first (optional depending on engine, but good practice)
                $table->index($config['col']);
                // Note: we assume the column exists as unsignedBigInteger already. We just add the constraint.
                $table->foreign($config['col'])->references('id')->on($config['ref'])->restrictOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $uuidTables = ['users', 'students', 'professors', 'modules', 'rooms', 'groups', 'schedules'];
        $versionTables = ['schedules', 'grades', 'attendances', 'student_registrations'];
        
        $orphanConfigs = [
            ['table' => 'attendance_sessions', 'col' => 'professor_id', 'ref' => 'professors'],
            ['table' => 'defense_juries', 'col' => 'professor_id', 'ref' => 'professors'],
            ['table' => 'learning_materials', 'col' => 'professor_id', 'ref' => 'professors'],
            ['table' => 'module_professor', 'col' => 'professor_id', 'ref' => 'professors'],
        ];

        // 1. Drop FKs and indexes
        foreach ($orphanConfigs as $config) {
            Schema::table($config['table'], function (Blueprint $table) use ($config) {
                $table->dropForeign([$config['col']]);
                $table->dropIndex([$config['col']]);
            });
        }

        // 2. Drop version column
        foreach ($versionTables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                if (Schema::hasColumn($table->getTable(), 'version')) {
                    $table->dropColumn('version');
                }
            });
        }

        // 3. Drop UUID constraints and column
        foreach ($uuidTables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (Schema::hasColumn($table->getTable(), 'uuid')) {
                    $table->dropUnique("{$tableName}_uuid_unique");
                    $table->dropColumn('uuid');
                }
            });
        }
    }
};
