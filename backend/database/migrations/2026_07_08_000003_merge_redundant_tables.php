<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Attendances
        if (!Schema::hasTable('attendances')) {
            Schema::create('attendances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained()->cascadeOnDelete();
                $table->foreignId('attendance_session_id')->constrained()->cascadeOnDelete();
                $table->string('status')->default('present');
                $table->boolean('is_justified')->default(false);
                $table->text('notes')->nullable();
                $table->timestamp('scanned_at')->nullable();
                $table->decimal('scanned_latitude', 10, 8)->nullable();
                $table->decimal('scanned_longitude', 11, 8)->nullable();
                $table->boolean('is_valid')->default(true);
                $table->timestamps();
            });
        } else {
            Schema::table('attendances', function (Blueprint $table) {
                if (!Schema::hasColumn('attendances', 'status')) $table->string('status')->default('present');
                if (!Schema::hasColumn('attendances', 'is_justified')) $table->boolean('is_justified')->default(false);
                if (!Schema::hasColumn('attendances', 'notes')) $table->text('notes')->nullable();
                if (!Schema::hasColumn('attendances', 'scanned_at')) $table->timestamp('scanned_at')->nullable();
                if (!Schema::hasColumn('attendances', 'scanned_latitude')) $table->decimal('scanned_latitude', 10, 8)->nullable();
                if (!Schema::hasColumn('attendances', 'scanned_longitude')) $table->decimal('scanned_longitude', 11, 8)->nullable();
                if (!Schema::hasColumn('attendances', 'is_valid')) $table->boolean('is_valid')->default(true);
            });
        }

        if (Schema::hasTable('attendance_records')) {
            // Migrate data
            $records = DB::table('attendance_records')->get();
            foreach ($records as $record) {
                if (isset($record->student_id) && isset($record->attendance_session_id)) {
                    DB::table('attendances')->updateOrInsert(
                        [
                            'student_id' => $record->student_id,
                            'attendance_session_id' => $record->attendance_session_id
                        ],
                        [
                            'status' => $record->status ?? 'present',
                            'is_justified' => $record->is_justified ?? false,
                            'created_at' => $record->created_at ?? now(),
                            'updated_at' => $record->updated_at ?? now(),
                        ]
                    );
                }
            }
            // Drop old table
            // Drop old table (CASCADE required for PostgreSQL foreign key dependencies)
            DB::statement('DROP TABLE IF EXISTS "attendance_records" CASCADE');
        }

        // 2. Professor Availabilities
        if (!Schema::hasTable('professor_availabilities')) {
            Schema::create('professor_availabilities', function (Blueprint $table) {
                $table->id();
                $table->foreignId('professor_id')->constrained()->cascadeOnDelete();
                $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
                $table->foreignId('semester_id')->nullable()->constrained()->cascadeOnDelete();
                $table->string('day_of_week');
                $table->time('start_time');
                $table->time('end_time');
                $table->boolean('is_available')->default(true);
                $table->timestamps();
            });
        } else {
            Schema::table('professor_availabilities', function (Blueprint $table) {
                if (!Schema::hasColumn('professor_availabilities', 'academic_year_id')) $table->foreignId('academic_year_id')->nullable()->constrained()->cascadeOnDelete();
                if (!Schema::hasColumn('professor_availabilities', 'semester_id')) $table->foreignId('semester_id')->nullable()->constrained()->cascadeOnDelete();
                if (!Schema::hasColumn('professor_availabilities', 'day_of_week')) $table->string('day_of_week')->nullable();
                if (!Schema::hasColumn('professor_availabilities', 'start_time')) $table->time('start_time')->nullable();
                if (!Schema::hasColumn('professor_availabilities', 'end_time')) $table->time('end_time')->nullable();
                if (!Schema::hasColumn('professor_availabilities', 'is_available')) $table->boolean('is_available')->default(true);
            });
        }

        if (Schema::hasTable('professor_availability')) {
            // Migrate data
            $records = DB::table('professor_availability')->get();
            foreach ($records as $record) {
                if (isset($record->professor_id)) {
                    DB::table('professor_availabilities')->insert([
                        'professor_id' => $record->professor_id,
                        'day_of_week' => $record->day_of_week ?? null,
                        'start_time' => $record->start_time ?? null,
                        'end_time' => $record->end_time ?? null,
                        'is_available' => $record->is_available ?? true,
                        'created_at' => $record->created_at ?? now(),
                        'updated_at' => $record->updated_at ?? now(),
                    ]);
                }
            }
            DB::statement('DROP TABLE IF EXISTS "professor_availability" CASCADE');
        }
    }

    public function down(): void
    {
    }
};
