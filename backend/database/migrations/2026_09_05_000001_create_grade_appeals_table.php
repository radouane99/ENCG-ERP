<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('grade_appeals')) {
            Schema::create('grade_appeals', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
                $table->foreignId('assessment_id')->nullable()->constrained('assessments')->nullOnDelete();
                $table->foreignId('professor_id')->nullable()->constrained('professors')->nullOnDelete();
                $table->decimal('original_grade', 5, 2);
                $table->decimal('claimed_grade', 5, 2)->nullable();
                $table->string('reason_category')->default('erreur_materielle'); // erreur_materielle, oubli_cc, non_report, autre
                $table->text('student_justification');
                $table->string('status')->default('submitted'); // submitted, under_review, rectified, maintained, rejected
                $table->text('professor_comment')->nullable();
                $table->decimal('rectified_grade', 5, 2)->nullable();
                $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('resolved_at')->nullable();
                $table->timestamp('appeal_deadline_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_appeals');
    }
};
