<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mobility_partners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('country');
            $table->string('city')->nullable();
            $table->string('program_type');
            $table->unsignedInteger('slots')->default(0);
            $table->decimal('gpa_required', 5, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('student_mobility_choices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mobility_partner_id')->constrained('mobility_partners')->cascadeOnDelete();
            $table->unsignedTinyInteger('choice_rank');
            $table->timestamps();

            $table->unique(['student_id', 'choice_rank']);
            $table->unique(['student_id', 'mobility_partner_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_mobility_choices');
        Schema::dropIfExists('mobility_partners');
    }
};
