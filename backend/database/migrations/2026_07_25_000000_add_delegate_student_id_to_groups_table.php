<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('groups', 'delegate_student_id')) {
            Schema::table('groups', function (Blueprint $table) {
                $table->unsignedBigInteger('delegate_student_id')->nullable()->after('capacity');
                $table->string('delegate_name')->nullable()->after('delegate_student_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn(['delegate_student_id', 'delegate_name']);
        });
    }
};
