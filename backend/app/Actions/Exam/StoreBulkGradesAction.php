<?php

namespace App\Actions\Exam;

use App\Models\Assessment;
use App\Models\Grade;
use App\Services\Academic\GradeService;
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

                $newValue = $isFraud ? 0.0 : ($gradeData['absent'] ? null : ($gradeData['value'] ?? null));
                $newAbsent = $isFraud ? false : ($gradeData['absent'] ?? false);

                $oldGrade = Grade::where('student_id', $gradeData['student_id'])
                    ->where('assessment_id', $assessment->id)
                    ->first();

                $logChange($oldGrade, $newValue, $newAbsent, $gradeData['student_id'], $assessment);

                Grade::updateOrCreate(
                    [
                        'student_id' => $gradeData['student_id'],
                        'assessment_id' => $assessment->id,
                    ],
                    [
                        'value' => $newValue,
                        'absent' => $newAbsent,
                    ]
                );

                $count++;
            }

            return $count;
        });
    }
}
