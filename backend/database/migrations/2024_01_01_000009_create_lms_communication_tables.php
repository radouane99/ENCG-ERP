<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── learning_materials ───────────────────────────────────
        Schema::create('learning_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('professor_id');
            $table->string('professor_type');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type');                         // document, video, link, quiz_bank
            $table->string('file_path')->nullable();
            $table->string('external_url')->nullable();
            $table->boolean('is_published')->default(false);
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->index(['module_id', 'academic_year_id', 'is_published']);
        });

        // ── assignments ──────────────────────────────────────────
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type');                         // individual, group
            $table->string('file_path')->nullable();        // Assignment sheet
            $table->dateTime('due_date');
            $table->decimal('max_score', 5, 2)->default(20.0);
            $table->decimal('coefficient', 5, 2)->default(1.0);
            $table->boolean('allow_late_submission')->default(false);
            $table->boolean('is_published')->default(false);
            $table->timestamps();

            $table->index(['module_id', 'due_date']);
        });

        // ── assignment_submissions ───────────────────────────────
        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('file_path')->nullable();
            $table->text('submission_text')->nullable();
            $table->boolean('is_late')->default(false);
            $table->decimal('score', 5, 2)->nullable();
            $table->text('feedback')->nullable();
            $table->foreignId('graded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('graded_at')->nullable();
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamps();

            $table->unique(['assignment_id', 'student_id']);
        });

        // ── quizzes ──────────────────────────────────────────────
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('instructions')->nullable();
            $table->integer('duration_minutes')->default(30);
            $table->integer('max_attempts')->default(1);
            $table->decimal('pass_score', 5, 2)->default(10.0);
            $table->boolean('randomize_questions')->default(false);
            $table->boolean('show_results_immediately')->default(true);
            $table->dateTime('available_from')->nullable();
            $table->dateTime('available_until')->nullable();
            $table->boolean('is_published')->default(false);
            $table->boolean('ai_generated')->default(false);
            $table->timestamps();
        });

        // ── quiz_questions ───────────────────────────────────────
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->string('type');                         // mcq, true_false, short_answer, essay
            $table->text('question_text');
            $table->text('question_text_ar')->nullable();
            $table->json('options')->nullable();            // For MCQ: [{text, is_correct}]
            $table->text('correct_answer')->nullable();
            $table->text('explanation')->nullable();
            $table->decimal('points', 5, 2)->default(1.0);
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        // ── quiz_attempts ────────────────────────────────────────
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->tinyInteger('attempt_number')->default(1);
            $table->json('answers')->nullable();            // Student answers per question
            $table->decimal('score', 5, 2)->nullable();
            $table->decimal('percentage', 5, 2)->nullable();
            $table->boolean('passed')->default(false);
            $table->timestamp('started_at');
            $table->timestamp('submitted_at')->nullable();
            $table->integer('time_spent_seconds')->nullable();
            $table->timestamps();

            $table->index(['quiz_id', 'student_id']);
        });

        // ── announcements ────────────────────────────────────────
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('body');
            $table->string('type')->default('general');    // general, academic, administrative, urgent
            $table->json('target_roles')->nullable();       // Which roles can see this
            $table->json('target_filieres')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('attachment_path')->nullable();
            $table->timestamps();

            $table->index(['institution_id', 'is_published', 'type']);
        });

        // ── notifications ────────────────────────────────────────
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');                         // Laravel notification type
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['notifiable_id', 'notifiable_type', 'read_at']);
        });

        // ── conversations ────────────────────────────────────────
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->string('type')->default('direct');     // direct, group
            $table->string('name')->nullable();             // For group chats
            $table->timestamps();
        });

        // ── conversation_user ────────────────────────────────────
        Schema::create('conversation_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('last_read_at')->nullable();
            $table->boolean('is_admin')->default(false);
            $table->timestamps();

            $table->unique(['conversation_id', 'user_id']);
        });

        // ── messages ─────────────────────────────────────────────
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->string('attachment_path')->nullable();
            $table->string('attachment_type')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['conversation_id', 'created_at']);
        });

        // ── tickets ──────────────────────────────────────────────
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('subject');
            $table->text('description');
            $table->string('category');                     // technical, academic, administrative
            $table->string('priority')->default('medium'); // low, medium, high, urgent
            $table->string('status')->default('open');     // open, in_progress, resolved, closed
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['institution_id', 'status', 'priority']);
        });

        // ── ticket_replies ───────────────────────────────────────
        Schema::create('ticket_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->boolean('is_internal')->default(false); // Staff-only notes
            $table->string('attachment_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_replies');
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversation_user');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('quiz_questions');
        Schema::dropIfExists('quizzes');
        Schema::dropIfExists('assignment_submissions');
        Schema::dropIfExists('assignments');
        Schema::dropIfExists('learning_materials');
    }
};
