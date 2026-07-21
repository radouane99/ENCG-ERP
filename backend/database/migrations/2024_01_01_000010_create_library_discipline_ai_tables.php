<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── books ────────────────────────────────────────────────
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->string('isbn')->nullable()->unique();
            $table->string('title');
            $table->string('author');
            $table->string('publisher')->nullable();
            $table->year('publication_year')->nullable();
            $table->string('edition')->nullable();
            $table->string('language')->default('fr');
            $table->string('category')->nullable();         // Mathematics, Management, Law
            $table->string('location_code')->nullable();    // Shelf reference
            $table->string('cover_path')->nullable();
            $table->integer('total_copies')->default(1);
            $table->integer('available_copies')->default(1);
            $table->timestamps();

            $table->index(['institution_id', 'category']);
            // fullText unsupported in SQLite — use regular index for local dev
            $table->index(['title', 'author']);
        });

        // ── book_copies ──────────────────────────────────────────
        Schema::create('book_copies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained()->cascadeOnDelete();
            $table->string('barcode')->unique();
            $table->string('condition')->default('good');   // good, fair, damaged, lost
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });

        // ── borrowings ───────────────────────────────────────────
        Schema::create('borrowings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_copy_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Student or Professor
            $table->foreignId('issued_by')->constrained('users')->cascadeOnDelete();
            $table->date('borrow_date');
            $table->date('due_date');
            $table->date('return_date')->nullable();
            $table->string('status')->default('borrowed'); // borrowed, returned, overdue, lost
            $table->decimal('penalty_amount', 8, 2)->default(0);
            $table->boolean('penalty_paid')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['status', 'due_date']);
        });

        // ── disciplinary_cases ───────────────────────────────────
        Schema::create('disciplinary_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('case_number')->unique();
            $table->string('infraction_type');              // cheating, violence, vandalism, other
            $table->text('description');
            $table->date('incident_date');
            $table->string('reported_by_name')->nullable();
            $table->string('status')->default('pending');  // pending, under_review, decided, appealed
            $table->text('student_statement')->nullable();
            $table->timestamps();

            $table->index(['institution_id', 'status']);
        });

        // ── disciplinary_decisions ───────────────────────────────
        Schema::create('disciplinary_decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('disciplinary_case_id')->constrained()->cascadeOnDelete();
            $table->string('sanction_type');                // warning, suspension, exclusion, none
            $table->integer('suspension_days')->nullable();
            $table->text('decision_text');
            $table->date('decision_date');
            $table->boolean('is_appealed')->default(false);
            $table->text('appeal_notes')->nullable();
            $table->foreignId('decided_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // ── clubs ────────────────────────────────────────────────
        Schema::create('clubs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('name_ar')->nullable();
            $table->string('category');                     // sports, cultural, scientific, social
            $table->text('description')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('president_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ── club_members ─────────────────────────────────────────
        Schema::create('club_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('member');     // president, vice_president, secretary, member
            $table->date('joined_at');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['club_id', 'user_id']);
        });

        // ── club_events ──────────────────────────────────────────
        Schema::create('club_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('start_at');
            $table->dateTime('end_at')->nullable();
            $table->string('location')->nullable();
            $table->string('status')->default('planned'); // planned, ongoing, completed, cancelled
            $table->string('poster_path')->nullable();
            $table->timestamps();
        });

        // ── ai_conversations ─────────────────────────────────────
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->string('type');                         // tutor, admin_assistant, qcm_generator
            $table->string('driver')->default('gemini');     // stub, gemini
            $table->json('messages');                       // [{role, content, timestamp}]
            $table->integer('token_count')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'type']);
        });

        // ── ai_generated_content ─────────────────────────────────
        Schema::create('ai_generated_content', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');                         // quiz, summary, explanation
            $table->foreignId('module_id')->nullable()->constrained()->nullOnDelete();
            $table->string('prompt')->nullable();
            $table->longText('content');
            $table->string('driver')->default('gemini');
            $table->boolean('is_saved')->default(false);
            $table->timestamps();
        });

        // ── risk_predictions ─────────────────────────────────────
        Schema::create('risk_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->string('risk_level');                   // low, medium, high, critical
            $table->decimal('risk_score', 5, 2);            // 0-100
            $table->json('factors');                        // [{factor, weight, value}]
            $table->text('recommendations')->nullable();
            $table->string('generated_by')->default('system');
            $table->timestamps();

            $table->index(['student_id', 'risk_level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('risk_predictions');
        Schema::dropIfExists('ai_generated_content');
        Schema::dropIfExists('ai_conversations');
        Schema::dropIfExists('club_events');
        Schema::dropIfExists('club_members');
        Schema::dropIfExists('clubs');
        Schema::dropIfExists('disciplinary_decisions');
        Schema::dropIfExists('disciplinary_cases');
        Schema::dropIfExists('borrowings');
        Schema::dropIfExists('book_copies');
        Schema::dropIfExists('books');
    }
};
