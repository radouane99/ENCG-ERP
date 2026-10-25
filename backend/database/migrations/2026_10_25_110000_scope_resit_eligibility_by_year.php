<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('resit_eligibilities', 'academic_year_id')) {
            Schema::table('resit_eligibilities', fn (Blueprint $table) => $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete());
        }
        DB::statement('UPDATE resit_eligibilities SET academic_year_id = (SELECT academic_year_id FROM exam_sessions WHERE exam_sessions.id = resit_eligibilities.exam_session_id) WHERE academic_year_id IS NULL AND exam_session_id IS NOT NULL');
        if (Schema::hasIndex('resit_eligibilities', 'resit_eligibility_student_module_unique')) {
            Schema::table('resit_eligibilities', fn (Blueprint $table) => $table->dropUnique('resit_eligibility_student_module_unique'));
        }
        if (! Schema::hasIndex('resit_eligibilities', 'resit_student_module_year_unique')) {
            Schema::table('resit_eligibilities', fn (Blueprint $table) => $table->unique(['student_id', 'module_id', 'academic_year_id'], 'resit_student_module_year_unique'));
        }
    }

    public function down(): void
    {
        throw new LogicException('Le retour à une seule éligibilité par étudiant/module supprimerait l’historique annuel. Prévoir une migration de réconciliation explicite.');
    }
};
