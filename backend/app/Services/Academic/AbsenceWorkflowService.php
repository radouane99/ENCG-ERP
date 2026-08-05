<?php

namespace App\Services\Academic;

use App\Models\AbsenceJustification;
use App\Models\Attendance;
use Illuminate\Support\Facades\DB;

class AbsenceWorkflowService
{
    /**
     * Approuver ou rejeter un justificatif d'absence.
     */
    public function reviewJustification(
        int $justificationId,
        string $status,
        int $adminId,
        ?string $rejectionReason = null
    ): AbsenceJustification {
        return DB::transaction(function () use ($justificationId, $status, $adminId, $rejectionReason) {
            $justification = AbsenceJustification::findOrFail($justificationId);

            $justification->update([
                'status'           => $status,
                'reviewed_by'      => $adminId,
                'reviewed_at'      => now(),
                'rejection_reason' => $status === 'rejected' ? $rejectionReason : null,
            ]);

            if ($status === 'approved') {
                Attendance::where('attendance_session_id', $justification->attendance_id)
                    ->where('student_id', $justification->student_id)
                    ->update([
                        'status'       => 'excused',
                        'is_justified' => true,
                    ]);
            }

            return $justification;
        });
    }

    /**
     * Statistiques globales des absences.
     */
    public function getGlobalAbsenceStats(): array
    {
        return [
            'absent'  => Attendance::where('status', 'absent')->count(),
            'excused' => Attendance::where('status', 'excused')->count(),
            'late'    => Attendance::where('status', 'late')->count(),
            'present' => Attendance::where('status', 'present')->count(),
        ];
    }
}