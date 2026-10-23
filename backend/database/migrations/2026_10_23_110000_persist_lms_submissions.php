<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('learning_materials', function (Blueprint $t) {
            $t->timestamp('due_date')->nullable();
            $t->decimal('max_score', 5, 2)->default(20);
            $t->unsignedBigInteger('file_size')->nullable();
        });
        Schema::create('lms_submissions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('learning_material_id')->constrained()->restrictOnDelete();
            $t->foreignId('student_id')->constrained()->restrictOnDelete();
            $t->text('submission_text')->nullable();
            $t->string('file_path')->nullable();
            $t->string('file_name')->nullable();
            $t->unsignedInteger('version')->default(1);
            $t->timestamp('submitted_at');
            $t->timestamps();
            $t->unique(['learning_material_id', 'student_id']);
        });
    }

    public function down(): void {}
};
