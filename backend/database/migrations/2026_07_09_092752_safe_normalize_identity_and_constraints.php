<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add columns to users if they don't exist
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'address')) {
                $table->string('address')->nullable();
            }
            if (!Schema::hasColumn('users', 'city')) {
                $table->string('city')->nullable();
            }
            if (!Schema::hasColumn('users', 'birth_date')) {
                $table->date('birth_date')->nullable();
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable();
            }
        });

        // 2. Safe Data Transfer via Chunking
        DB::transaction(function () {
            // Students to Users
            if (Schema::hasColumns('students', ['address', 'city', 'birth_date'])) {
                DB::table('students')->orderBy('id')->chunkById(1000, function ($students) {
                    foreach ($students as $student) {
                        DB::table('users')->where('id', $student->user_id)->update([
                            'address' => $student->address,
                            'city' => $student->city,
                            'birth_date' => $student->birth_date,
                        ]);
                    }
                    Log::info('Migrated student chunk to users', ['count' => count($students)]);
                });
            }

            // Professors to Users (assuming they might have phone/address)
            if (Schema::hasColumns('professors', ['phone'])) {
                DB::table('professors')->orderBy('id')->chunkById(1000, function ($professors) {
                    foreach ($professors as $prof) {
                        DB::table('users')->where('id', $prof->user_id)->update([
                            'phone' => $prof->phone,
                        ]);
                    }
                    Log::info('Migrated professor chunk to users', ['count' => count($professors)]);
                });
            }
        });

        // 3. Drop old redundant columns
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'address')) $table->dropColumn('address');
            if (Schema::hasColumn('students', 'city')) $table->dropColumn('city');
            if (Schema::hasColumn('students', 'birth_date')) $table->dropColumn('birth_date');
        });

        Schema::table('professors', function (Blueprint $table) {
            if (Schema::hasColumn('professors', 'phone')) $table->dropColumn('phone');
        });

        Schema::table('groups', function (Blueprint $table) {
            if (Schema::hasColumn('groups', 'current_count')) $table->dropColumn('current_count');
        });

        // 4. Add UNIQUE Business Constraints
        Schema::table('student_registrations', function (Blueprint $table) {
            // Prevent a student from registering twice in the same year
            $table->unique(['student_id', 'academic_year_id'], 'unique_student_year_registration');
        });

        Schema::table('module_professor', function (Blueprint $table) {
            $table->unique(['module_id', 'professor_id'], 'unique_module_professor');
        });
        
        // MySQL 8 CHECK constraints (skip on sqlite)
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE schedules ADD CONSTRAINT chk_schedule_time CHECK (start_time < end_time)');
            DB::statement('ALTER TABLE rooms ADD CONSTRAINT chk_room_capacity CHECK (capacity > 0)');
            DB::statement('ALTER TABLE academic_years ADD CONSTRAINT chk_academic_year_dates CHECK (start_date < end_date)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Drop constraints
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE schedules DROP CONSTRAINT chk_schedule_time');
            DB::statement('ALTER TABLE rooms DROP CONSTRAINT chk_room_capacity');
            DB::statement('ALTER TABLE academic_years DROP CONSTRAINT chk_academic_year_dates');
        }

        Schema::table('module_professor', function (Blueprint $table) {
            $table->dropUnique('unique_module_professor');
        });

        Schema::table('student_registrations', function (Blueprint $table) {
            $table->dropUnique('unique_student_year_registration');
        });

        // 2. Re-add columns
        Schema::table('groups', function (Blueprint $table) {
            $table->integer('current_count')->default(0);
        });

        Schema::table('professors', function (Blueprint $table) {
            $table->string('phone')->nullable();
        });

        Schema::table('students', function (Blueprint $table) {
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->date('birth_date')->nullable();
        });

        // 3. Move data back to children
        DB::transaction(function () {
            DB::table('students')->orderBy('id')->chunkById(1000, function ($students) {
                foreach ($students as $student) {
                    $user = DB::table('users')->where('id', $student->user_id)->first();
                    if ($user) {
                        DB::table('students')->where('id', $student->id)->update([
                            'address' => $user->address,
                            'city' => $user->city,
                            'birth_date' => $user->birth_date,
                        ]);
                    }
                }
            });

            DB::table('professors')->orderBy('id')->chunkById(1000, function ($professors) {
                foreach ($professors as $prof) {
                    $user = DB::table('users')->where('id', $prof->user_id)->first();
                    if ($user) {
                        DB::table('professors')->where('id', $prof->id)->update([
                            'phone' => $user->phone,
                        ]);
                    }
                }
            });
        });

        // 4. Drop columns from users
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['address', 'city', 'birth_date', 'phone']);
        });
    }
};
