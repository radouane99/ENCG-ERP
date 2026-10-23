<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }
        DB::statement('ALTER TABLE groups ADD CONSTRAINT group_pedagogical_context_unique UNIQUE(id,filiere_id,academic_year_id,semester_number)');
        DB::statement('ALTER TABLE student_registrations ADD CONSTRAINT registration_group_context FOREIGN KEY(group_id,filiere_id,academic_year_id,semester_number) REFERENCES groups(id,filiere_id,academic_year_id,semester_number) DEFERRABLE INITIALLY DEFERRED');
        DB::statement('ALTER TABLE student_pathways ADD CONSTRAINT pathway_group_context FOREIGN KEY(group_id,filiere_id,academic_year_id,current_semester) REFERENCES groups(id,filiere_id,academic_year_id,semester_number) DEFERRABLE INITIALLY DEFERRED');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }
        DB::statement('ALTER TABLE student_pathways DROP CONSTRAINT pathway_group_context');
        DB::statement('ALTER TABLE student_registrations DROP CONSTRAINT registration_group_context');
        DB::statement('ALTER TABLE groups DROP CONSTRAINT group_pedagogical_context_unique');
    }
};
