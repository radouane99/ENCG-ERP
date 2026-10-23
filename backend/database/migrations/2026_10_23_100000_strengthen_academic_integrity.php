<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_integrity_issues', function (Blueprint $table) {
            $table->id();
            $table->string('entity');
            $table->unsignedBigInteger('entity_id');
            $table->string('reason');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->unique(['entity', 'entity_id', 'reason']);
        });
        Schema::table('assessments', function (Blueprint $table) {
            $table->foreignId('academic_year_id')->nullable()->constrained()->restrictOnDelete();
            $table->boolean('needs_review')->default(false);
        });
        // Infer only an unambiguous date range. Ambiguity is retained for review, never guessed.
        DB::table('assessments')->orderBy('id')->chunkById(200, function ($rows) {
            foreach ($rows as $row) {
                $institution = DB::table('modules')->where('id', $row->module_id)->value('institution_id');
                $years = DB::table('academic_years')->where('institution_id', $institution)
                    ->where('start_date', '<=', $row->date)->where('end_date', '>=', $row->date)->pluck('id');
                DB::table('assessments')->where('id', $row->id)->update([
                    'academic_year_id' => $years->count() === 1 ? $years->first() : null,
                    'needs_review' => $years->count() !== 1,
                ]);
                if ($years->count() !== 1) {
                    $this->issue('assessments', $row->id, 'ambiguous_academic_year');
                }
            }
        });
        $duplicates = DB::table('assessments')->select('module_id', 'academic_year_id', 'type')
            ->whereNotNull('academic_year_id')->groupBy('module_id', 'academic_year_id', 'type')->havingRaw('count(*) > 1')->get();
        foreach ($duplicates as $key) {
            $rows = DB::table('assessments')->where('module_id', $key->module_id)->where('academic_year_id', $key->academic_year_id)->where('type', $key->type)->get();
            foreach ($rows as $row) {
                DB::table('assessments')->where('id', $row->id)->update(['needs_review' => true]);
                $this->issue('assessments', $row->id, 'duplicate_modality');
            }
        }
        Schema::table('student_registrations', fn (Blueprint $table) => $table->dropUnique('unique_student_year_registration'));
        Schema::table('module_professor', fn (Blueprint $table) => $table->dropUnique('unique_module_professor'));
        // Rows with a global (NULL) group need a separate unique index.
        DB::statement('CREATE UNIQUE INDEX module_assignment_context_unique ON module_professor (module_id, professor_id, academic_year_id, COALESCE(group_id,0), session_type)');
        DB::statement('CREATE UNIQUE INDEX current_year_per_institution ON academic_years (institution_id) WHERE is_current = true');
        DB::statement('CREATE UNIQUE INDEX current_pathway_per_student ON student_pathways (student_id) WHERE is_current = true');
        DB::statement('CREATE UNIQUE INDEX assessment_year_type_unique ON assessments (module_id, academic_year_id, type) WHERE needs_review = false');
        DB::statement('CREATE UNIQUE INDEX global_module_signature_unique ON module_pv_signatures (module_id,academic_year_id,session) WHERE group_id IS NULL');
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE module_pv_signatures ALTER COLUMN academic_year_id DROP DEFAULT');
            DB::statement('ALTER TABLE grades ADD CONSTRAINT grade_value_range CHECK (value IS NULL OR value BETWEEN 0 AND 20)');
            DB::statement('ALTER TABLE assessments ADD CONSTRAINT assessment_weight_range CHECK (weight BETWEEN 0 AND 100)');
        }
        foreach (['birth_date', 'address', 'city', 'cin'] as $field) {
            DB::table('students')->join('users', 'students.user_id', '=', 'users.id')
                ->whereNotNull('students.'.$field)->whereNotNull('users.'.$field)
                ->select('students.id', 'students.'.$field.' as legacy', 'users.'.$field.' as canonical')->orderBy('students.id')
                ->get()->each(function ($row) use ($field) {
                    if ((string) $row->legacy !== (string) $row->canonical) {
                        $this->issue('students', $row->id, 'identity_conflict_'.$field);
                    }
                });
        }
    }

    private function issue(string $entity, int $id, string $reason): void
    {
        DB::table('data_integrity_issues')->insertOrIgnore(['entity' => $entity, 'entity_id' => $id, 'reason' => $reason, 'created_at' => now(), 'updated_at' => now()]);
    }

    public function down(): void
    {
        // Data-preserving forward migration. Restore from a verified backup for a full downgrade.
    }
};
