<?php

namespace App\Actions\Exam;

use App\Exceptions\OptimisticLockException;
use App\Models\Assessment;
use App\Models\Grade;
use App\Services\Academic\GradeService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class StoreBulkGradesAction
{
    public function __construct(
        private GradeService $gradeService
    ) {}

    /**
     * @param  list<array{student_id: int, value?: mixed, absent?: bool}>  $grades
     * @param  callable(Grade|null, ?float, bool, int, Assessment): void  $logChange
     */
    public function execute(Assessment $assessment, array $grades, array $fraudIds, callable $logChange): int
    {
        return (int) DB::transaction(function () use ($assessment, $grades, $fraudIds, $logChange) {
            $count = 0;
            foreach ($grades as $gradeData) {
                $isFraud = $this->gradeService->isStudentFraud($gradeData['student_id'], $fraudIds)
                    && $this->gradeService->isExamAssessment($assessment);

                $newValue = $isFraud ? 0.0 : (($gradeData['absent'] ?? false) ? null : ($gradeData['value'] ?? null));
                $newAbsent = $isFraud ? false : ($gradeData['absent'] ?? false);

                $oldGrade = Grade::where('student_id', $gradeData['student_id'])
                    ->where('assessment_id', $assessment->id)
                    ->lockForUpdate()->first();

                if ((int) ($gradeData['version'] ?? 0) !== (int) ($oldGrade?->version ?? 0)) {
                    throw new OptimisticLockException;
                }

                $logChange($oldGrade, $newValue, $newAbsent, $gradeData['student_id'], $assessment);

                try {
                    $grade = $oldGrade ?? new Grade([
                        'student_id' => $gradeData['student_id'], 'assessment_id' => $assessment->id,
                    ]);
                    $grade->fill([
                        'value' => $newValue,
                        'absent' => $newAbsent,
                    ])->save();
                } catch (UniqueConstraintViolationException $e) {
                    throw new OptimisticLockException(previous: $e);
                }

                $count++;
            }

            return $count;
        });
    }
}
