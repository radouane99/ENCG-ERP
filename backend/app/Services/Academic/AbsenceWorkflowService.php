<?php

namespace App\Services\Academic;

use App\Models\AbsenceJustification;
use App\Models\AttendanceRecord;
use Illuminate\Support\Facades\DB;

class AbsenceWorkflowService
{
    /**
     * Review and approve/reject a justification.
     */
    public function reviewJustification(int $justificationId, string $status, int $adminId, ?string $rejectionReason = null): AbsenceJustification
    {
        return DB::transaction(function () use ($justificationId, $status, $adminId, $rejectionReason) {
            $justification = AbsenceJustification::findOrFail($justificationId);
            
            $justification->update([
                'status' => $status,
                'reviewed_by' => $adminId,
                'reviewed_at' => now(),
                'rejection_reason' => $status === 'rejected' ? $rejectionReason : null,
            ]);

            // If approved, update the corresponding attendance record
            if ($status === 'approved') {
                AttendanceRecord::where('attendance_session_id', $justification->attendance_id)
                    ->where('student_id', $justification->student_id)
                    ->update([
                        'status' => 'excused',
                        'is_justified' => true,
                    ]);
            }

            return $justification;
        });
    }

    /**
     * Get global absence statistics (SARGable query).
     */
    public function getGlobalAbsenceStats(): array
    {
        $stats = DB::table('attendance_records')
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return [
            'absent' => $stats->get('absent', 0),
            'excused' => $stats->get('excused', 0),
            'late' => $stats->get('late', 0),
            'present' => $stats->get('present', 0),
        ];
    }
}
