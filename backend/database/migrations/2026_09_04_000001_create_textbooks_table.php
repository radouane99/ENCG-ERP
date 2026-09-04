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
        if (! Schema::hasTable('textbooks')) {
            Schema::create('textbooks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('professor_id')->constrained('professors')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
                $table->foreignId('group_id')->nullable()->constrained('groups')->nullOnDelete();
                $table->foreignId('schedule_id')->nullable()->constrained('schedules')->nullOnDelete();
                $table->date('session_date');
                $table->decimal('session_duration_hours', 4, 2)->default(2.0);
                $table->string('session_type')->default('cm');
                $table->string('chapter_title');
                $table->text('key_concepts')->nullable();
                $table->text('pedagogical_goals')->nullable();
                $table->text('homework_assigned')->nullable();
                $table->unsignedInteger('syllabus_percentage')->default(10);
                $table->string('status')->default('submitted'); // submitted, validated, rejected
                $table->string('validated_by')->nullable();
                $table->timestamp('validated_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('textbooks');
    }
};
