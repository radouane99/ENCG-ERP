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
        Schema::create('professor_substitutions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_professor_id');
            $table->unsignedBigInteger('substitute_professor_id');
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->text('reason')->nullable();
            $table->enum('status', ['active', 'expired', 'revoked'])->default('active');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['substitute_professor_id', 'status', 'start_date', 'end_date'], 'subst_prof_active_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('professor_substitutions');
    }
};
