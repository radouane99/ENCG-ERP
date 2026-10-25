<?php

namespace App\Services\Academic;

use App\Models\{ResitEligibility, Student};
use Illuminate\Support\Facades\DB;

class ResitEligibilityRegistry
{
    public function record(int $studentId, int $moduleId, int $yearId, ?int $sessionId, bool $eligible, ?string $reason = null): ResitEligibility
    {
        return DB::transaction(function () use ($studentId, $moduleId, $yearId, $sessionId, $eligible, $reason) {
            Student::whereKey($studentId)->lockForUpdate()->firstOrFail();
            $row = ResitEligibility::where('student_id', $studentId)->where('module_id', $moduleId)->where('academic_year_id', $yearId)->lockForUpdate()->first();
            // An automatic recalculation never replaces a recorded administrative decision.
            if ($row && $row->decided_at && in_array($row->status, ['Accordé', 'Refusé', 'En attente'], true)) { return $row; }
            $row ??= new ResitEligibility(['student_id' => $studentId, 'module_id' => $moduleId, 'academic_year_id' => $yearId]);
            $row->fill(['exam_session_id' => $sessionId, 'is_eligible' => $eligible, 'status' => $eligible ? 'eligible' : 'not_required', 'reason' => $reason])->save();
            return $row;
        });
    }
}
