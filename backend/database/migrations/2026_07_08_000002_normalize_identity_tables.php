<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. users table SSOT
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name')->nullable()->after('name');
            }
            if (!Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name')->nullable()->after('first_name');
            }
            if (!Schema::hasColumn('users', 'name_ar')) {
                $table->string('name_ar')->nullable()->after('last_name');
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'cin')) {
                $table->string('cin')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
        });

        // 2. students table
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'email')) {
                $table->dropColumn('email');
            }
            if (Schema::hasColumn('students', 'phone')) {
                $table->dropColumn('phone');
            }
            if (Schema::hasColumn('students', 'first_name')) {
                $table->dropColumn('first_name');
            }
            if (Schema::hasColumn('students', 'last_name')) {
                $table->dropColumn('last_name');
            }
            if (Schema::hasColumn('students', 'cin')) {
                $table->dropColumn('cin');
            }
            
            // Rebuild user_id foreign key if needed
            // SQLite does not support dropping foreign keys easily, we will skip it for sqlite testing
            if (DB::getDriverName() !== 'sqlite') {
                $table->dropForeign(['user_id']);
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            }
        });

        // 3. professors table
        Schema::table('professors', function (Blueprint $table) {
            if (Schema::hasColumn('professors', 'email')) {
                $table->dropColumn('email');
            }
            if (Schema::hasColumn('professors', 'phone')) {
                $table->dropColumn('phone');
            }
            if (Schema::hasColumn('professors', 'first_name')) {
                $table->dropColumn('first_name');
            }
            if (Schema::hasColumn('professors', 'last_name')) {
                $table->dropColumn('last_name');
            }
            if (Schema::hasColumn('professors', 'cin')) {
                $table->dropColumn('cin');
            }

            if (DB::getDriverName() !== 'sqlite') {
                $table->dropForeign(['user_id']);
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            }
        });
    }

    public function down(): void
    {
    }
};
