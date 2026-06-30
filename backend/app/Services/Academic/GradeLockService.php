<?php

namespace App\Services\Academic;

use App\Models\GradeEntryPeriod;
use Exception;

class GradeLockService
{
    /**
     * Check if grade entry is permitted.
     * Throws an exception if locked.
     *
     * @param int $academicYearId
     * @param int $semesterId
     * @param int $examSessionId
     * @throws Exception
     */
    public function authorizeGradeEntry(int $academicYearId, int $semesterId, int $examSessionId): void
    {
        $period = GradeEntryPeriod::where('academic_year_id', $academicYearId)
            ->where('semester_id', $semesterId)
            ->where('exam_session_id', $examSessionId)
            ->first();

        if (!$period) {
            throw new Exception("Opération refusée : Aucune période de saisie de notes n'a été définie pour cette session par l'administration.");
        }

        if (!$period->isActive()) {
            throw new Exception("Opération refusée : La période de saisie de notes pour cette session est fermée.");
        }
    }

    /**
     * Open a grade entry period.
     */
    public function openPeriod(int $academicYearId, int $semesterId, int $examSessionId, string $startDate, string $endDate, int $adminId): GradeEntryPeriod
    {
        return GradeEntryPeriod::updateOrCreate(
            [
                'academic_year_id' => $academicYearId,
                'semester_id' => $semesterId,
                'exam_session_id' => $examSessionId,
            ],
            [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'is_open' => true,
                'opened_by' => $adminId,
            ]
        );
    }

    /**
     * Close a grade entry period.
     */
    public function closePeriod(int $academicYearId, int $semesterId, int $examSessionId, int $adminId): ?GradeEntryPeriod
    {
        $period = GradeEntryPeriod::where('academic_year_id', $academicYearId)
            ->where('semester_id', $semesterId)
            ->where('exam_session_id', $examSessionId)
            ->first();

        if ($period) {
            $period->update([
                'is_open' => false,
                'closed_by' => $adminId,
            ]);
        }

        return $period;
    }
}
