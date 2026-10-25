<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('schedule_change_requests')) {
            Schema::create('schedule_change_requests', function (Blueprint $t) {
                $t->id();
                $t->foreignId('professor_id')->constrained('users')->restrictOnDelete();
                $t->foreignId('exam_id')->nullable()->constrained('exams')->nullOnDelete();
                $t->date('old_date')->nullable();
                $t->time('old_start_time')->nullable();
                $t->date('proposed_date')->nullable();
                $t->time('proposed_start_time')->nullable();
                $t->text('reason');
                $t->string('status')->default('pending');
                $t->string('request_type')->default('schedule_change');
                $t->timestamps();
            });

            return;
        }
        Schema::table('schedule_change_requests', function (Blueprint $t) {
            $t->string('request_type')->default('schedule_change');
            $t->date('proposed_date')->nullable()->change();
            $t->time('proposed_start_time')->nullable()->change();
        });
    }

    public function down(): void
    {
        throw new RuntimeException('Preserve scheduling reports and restore a verified backup if necessary.');
    }
};
