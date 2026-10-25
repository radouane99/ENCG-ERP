<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mobility_partners', fn (Blueprint $t) => $t->foreignId('institution_id')->nullable()->constrained()->restrictOnDelete());
        Schema::table('student_mobility_choices', function (Blueprint $t) {
            $t->dropUnique(['student_id', 'choice_rank']);
            $t->dropUnique(['student_id', 'mobility_partner_id']);
            $t->foreignId('academic_year_id')->nullable()->constrained()->restrictOnDelete();
            $t->unique(['student_id', 'academic_year_id', 'choice_rank'], 'mobility_choice_year_rank_unique');
            $t->unique(['student_id', 'academic_year_id', 'mobility_partner_id'], 'mobility_choice_year_partner_unique');
        });
    }

    public function down(): void
    {
        throw new RuntimeException('Mobility history requires a verified backup for rollback.');
    }
};
