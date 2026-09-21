<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Re-create 'soutenances' table if not exists
        if (!Schema::hasTable('soutenances')) {
            Schema::create('soutenances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('internship_id')->nullable()->constrained('internships')->cascadeOnDelete();
                $table->foreignId('final_project_id')->nullable()->constrained('final_projects')->cascadeOnDelete();
                $table->dateTime('date_time')->nullable();
                $table->dateTime('scheduled_at')->nullable();
                $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
                $table->foreignId('president_id')->nullable()->constrained('professors')->nullOnDelete();
                $table->foreignId('examiner_id')->nullable()->constrained('professors')->nullOnDelete();
                $table->foreignId('supervisor_id')->nullable()->constrained('professors')->nullOnDelete();
                $table->decimal('grade', 5, 2)->nullable();
                $table->string('status')->default('scheduled'); // scheduled, completed, cancelled, conflict
                $table->string('mention')->nullable();
                $table->text('remarks')->nullable();
                $table->unsignedInteger('version')->default(1);
                $table->timestamps();
            });
        }

        // 2. Ensure final_projects has supervisor_id, soutenance_date, defense_date, room_id
        Schema::table('final_projects', function (Blueprint $table) {
            if (!Schema::hasColumn('final_projects', 'supervisor_id')) {
                $table->foreignId('supervisor_id')->nullable()->after('student_id')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('final_projects', 'soutenance_date')) {
                $table->dateTime('soutenance_date')->nullable()->after('status');
            }
            if (!Schema::hasColumn('final_projects', 'defense_date')) {
                $table->dateTime('defense_date')->nullable()->after('soutenance_date');
            }
            if (!Schema::hasColumn('final_projects', 'room_id')) {
                $table->foreignId('room_id')->nullable()->after('defense_date')->constrained('rooms')->nullOnDelete();
            }
            if (!Schema::hasColumn('final_projects', 'version')) {
                $table->unsignedInteger('version')->default(1);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('soutenances');
    }
};
