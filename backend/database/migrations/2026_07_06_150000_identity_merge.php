<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->nullable()->after('name');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('cin')->nullable()->after('last_name');
            $table->string('photo_path')->nullable();
        });

        // Migrate data from students
        $students = DB::table('students')->get();
        foreach ($students as $student) {
            if (isset($student->user_id) && $student->user_id) {
                DB::table('users')->where('id', $student->user_id)->update([
                    'first_name' => $student->first_name ?? null,
                    'last_name' => $student->last_name ?? null,
                    'cin' => $student->cin ?? null,
                    'phone' => $student->phone ?? null,
                    'photo_path' => $student->photo_path ?? null,
                ]);
            }
        }

        // Migrate data from professors
        $professors = DB::table('professors')->get();
        foreach ($professors as $professor) {
            if (isset($professor->user_id) && $professor->user_id) {
                DB::table('users')->where('id', $professor->user_id)->update([
                    'first_name' => $professor->first_name ?? null,
                    'last_name' => $professor->last_name ?? null,
                    'cin' => $professor->cin ?? null,
                    'phone' => $professor->phone ?? null,
                    'photo_path' => $professor->photo_path ?? null,
                ]);
            }
        }

        Schema::table('students', function (Blueprint $table) {
            // 1. مسح الـ Index أولاً باش نتفاداو خطأ SQLite
            $table->dropIndex('students_last_name_first_name_index');
            
            // 2. عاد نمسحو الأعمدة بأمان
            if (Schema::hasColumn('students', 'first_name')) $table->dropColumn('first_name');
            if (Schema::hasColumn('students', 'last_name')) $table->dropColumn('last_name');
            if (Schema::hasColumn('students', 'cin')) $table->dropColumn('cin');
            if (Schema::hasColumn('students', 'phone')) $table->dropColumn('phone');
            if (Schema::hasColumn('students', 'photo_path')) $table->dropColumn('photo_path');
        });

        Schema::table('professors', function (Blueprint $table) {
            if (Schema::hasColumn('professors', 'first_name')) $table->dropColumn('first_name');
            if (Schema::hasColumn('professors', 'last_name')) $table->dropColumn('last_name');
            if (Schema::hasColumn('professors', 'cin')) $table->dropColumn('cin');
            if (Schema::hasColumn('professors', 'phone')) $table->dropColumn('phone');
            if (Schema::hasColumn('professors', 'photo_path')) $table->dropColumn('photo_path');
        });
    }

    public function down(): void
    {
        // Revert logic
    }
};