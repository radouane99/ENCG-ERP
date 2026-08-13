<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            if (Schema::hasColumn('students', 'deleted_at')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_students_active ON students(id) WHERE deleted_at IS NULL;');
            }
            if (Schema::hasColumn('professors', 'deleted_at')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_professors_active ON professors(id) WHERE deleted_at IS NULL;');
            }
            if (Schema::hasColumn('users', 'deleted_at')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_users_active ON users(id) WHERE deleted_at IS NULL;');
            }
        }

        // Fast foreign key indexes for QR Attendance & Exam seating
        if (Schema::hasTable('attendances') && Schema::hasColumn('attendances', 'student_id')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->index('student_id', 'idx_attendances_student_id');
            });
        }

        if (Schema::hasTable('exam_seatings') && Schema::hasColumn('exam_seatings', 'student_id')) {
            Schema::table('exam_seatings', function (Blueprint $table) {
                $table->index('student_id', 'idx_exam_seatings_student_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS idx_students_active;');
            DB::statement('DROP INDEX IF EXISTS idx_professors_active;');
            DB::statement('DROP INDEX IF EXISTS idx_users_active;');
        }

        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->dropIndex('idx_attendances_student_id');
            });
        }

        if (Schema::hasTable('exam_seatings')) {
            Schema::table('exam_seatings', function (Blueprint $table) {
                $table->dropIndex('idx_exam_seatings_student_id');
            });
        }
    }
};
