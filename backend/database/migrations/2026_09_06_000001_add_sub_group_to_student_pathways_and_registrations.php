<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('student_pathways') && ! Schema::hasColumn('student_pathways', 'sub_group')) {
            Schema::table('student_pathways', function (Blueprint $table) {
                $table->string('sub_group', 20)->nullable()->after('group_id');
                $table->index(['group_id', 'sub_group']);
            });
        }

        if (Schema::hasTable('student_registrations') && ! Schema::hasColumn('student_registrations', 'sub_group')) {
            Schema::table('student_registrations', function (Blueprint $table) {
                $table->string('sub_group', 20)->nullable()->after('group_id');
                $table->index(['group_id', 'sub_group']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('student_pathways') && Schema::hasColumn('student_pathways', 'sub_group')) {
            Schema::table('student_pathways', function (Blueprint $table) {
                $table->dropIndex(['group_id', 'sub_group']);
                $table->dropColumn('sub_group');
            });
        }

        if (Schema::hasTable('student_registrations') && Schema::hasColumn('student_registrations', 'sub_group')) {
            Schema::table('student_registrations', function (Blueprint $table) {
                $table->dropIndex(['group_id', 'sub_group']);
                $table->dropColumn('sub_group');
            });
        }
    }
};
