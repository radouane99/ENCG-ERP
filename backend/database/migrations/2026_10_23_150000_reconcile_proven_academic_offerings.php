<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Resolve overlapping date ranges only when recorded teaching assignments and
        // every graded student's enrolment independently support the same single year.
        foreach (DB::table('assessments')->whereNull('academic_year_id')->where('needs_review', true)->get() as $assessment) {
            $institution = DB::table('modules')->where('id', $assessment->module_id)->value('institution_id');
            $candidates = DB::table('academic_years')->where('institution_id', $institution)->where('start_date', '<=', $assessment->date)->where('end_date', '>=', $assessment->date)->pluck('id');
            $assigned = DB::table('module_professor')->where('module_id', $assessment->module_id)->whereIn('academic_year_id', $candidates)->distinct()->pluck('academic_year_id');
            if ($assigned->count() !== 1) {
                continue;
            }
            $year = $assigned->first();
            $unproven = DB::table('grades')->where('assessment_id', $assessment->id)->whereNotExists(function ($q) use ($year) {
                $q->selectRaw('1')->from('student_registrations')->whereColumn('student_registrations.student_id', 'grades.student_id')->where('student_registrations.academic_year_id', $year);
            })->exists();
            if ($unproven) {
                continue;
            }
            if (DB::table('assessments')->where('module_id', $assessment->module_id)->where('academic_year_id', $year)->where('type', $assessment->type)->where('id', '!=', $assessment->id)->exists()) {
                continue;
            }
            DB::table('assessments')->where('id', $assessment->id)->update(['academic_year_id' => $year, 'needs_review' => false]);
            DB::table('data_integrity_issues')->where('entity', 'assessments')->where('entity_id', $assessment->id)->where('reason', 'ambiguous_academic_year')->update(['resolved_at' => now(), 'updated_at' => now()]);
        }
    }

    public function down(): void {}
};
