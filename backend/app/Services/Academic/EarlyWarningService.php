<?php

namespace App\Services\Academic;

use App\Domain\Deliberation\LmdRules;
use App\Models\Grade;
use Illuminate\Support\Facades\Schema;

class EarlyWarningService
{
    public function __construct(
        private ExamCourseAttendanceService $attendance,
        private AcademicWindowGuard $windows
    ) {}

    /**
     * @return list<array{student_id: int, module: string, exam_or_cc: string, course_absences: int, window_open: bool}>
     */
    public function list(): array
    {
        if (! Schema::hasTable('grades')) {
            return [];
        }

        $grades = Grade::query()
            ->with(['student', 'assessment.module'])
            ->whereNotNull('value')
            ->where('value', '<', LmdRules::ELIMINATORY_THRESHOLD)
            ->latest('id')
            ->take(40)
            ->get();

        $windowOpen = $this->windows->isGradesOpen();
        $absenceCounts = $this->attendance->courseAbsenceCountsByStudent(
            $grades->pluck('student_id')->map(fn ($id) => (int) $id)->all()
        );

        return $grades->map(function (Grade $grade) use ($windowOpen, $absenceCounts) {
            $module = $grade->assessment?->module;
            $type = strtolower((string) ($grade->assessment?->type ?? 'cc'));
            $examOrCc = str_contains($type, 'exam') || str_contains($type, 'examen') ? 'exam' : 'cc';
            $studentId = (int) $grade->student_id;

            return [
                'student_id' => $studentId,
                'module' => $module?->code ?? $module?->name ?? 'Module',
                'exam_or_cc' => $examOrCc,
                'course_absences' => $absenceCounts[$studentId] ?? 0,
                'window_open' => $windowOpen,
            ];
        })->unique(fn ($row) => $row['student_id'].'-'.$row['module'])->values()->all();
    }
}
