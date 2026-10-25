<?php

namespace App\Actions\Exam;

use App\Models\AcademicYear;
use App\Models\ResitEligibility;
use App\Models\Student;
use App\Services\Academic\ExamWorkflowGuard;
use Illuminate\Support\Facades\DB;

class ReconcileResitYearAction
{
    public function execute(int $id, int $yearId, string $reason): ResitEligibility
    {
        app(ExamWorkflowGuard::class)->manage();

        return DB::transaction(function () use ($id, $yearId, $reason) {
            $user = auth()->user();
            $candidate = ResitEligibility::findOrFail($id);
            Student::whereKey($candidate->student_id)->lockForUpdate()->firstOrFail();
            $year = AcademicYear::where('institution_id', $user->institution_id)->findOrFail($yearId);
            $row = ResitEligibility::whereHas('module', fn ($q) => $q->where('institution_id', $user->institution_id))->whereKey($id)->lockForUpdate()->firstOrFail();
            abort_unless($row->academic_year_id === null, 409, 'Ce droit est déjà rattaché à une année. Actualisez la liste.');
            abort_if(ResitEligibility::where('student_id', $row->student_id)->where('module_id', $row->module_id)->where('academic_year_id', $year->id)->exists(), 409, 'Un droit existe déjà pour cette année. Aucun dossier n’a été fusionné ni remplacé.');
            $row->academic_year_id = $year->id;
            $row->save();
            activity()->causedBy($user)->performedOn($row)->withProperties(['year_id' => $year->id, 'reason' => $reason])->log('legacy_resit_year_reconciled');

            return $row;
        });
    }
}
