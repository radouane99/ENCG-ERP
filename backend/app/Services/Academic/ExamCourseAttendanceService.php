<?php

namespace App\Services\Academic;

use App\Models\Attendance;
use App\Models\DisciplinaryCase;
use App\Models\ExamIncident;
use App\Models\ExamSeating;
use App\Models\User;
use Illuminate\Support\Facades\Notification;

class ExamCourseAttendanceService
{
    public function courseAbsenceCount(int $studentId): int
    {
        return $this->courseAbsenceCountsByStudent([$studentId])[$studentId] ?? 0;
    }

    /**
     * @param  list<int>  $studentIds
     * @return array<int, int>
     */
    public function courseAbsenceCountsByStudent(array $studentIds): array
    {
        $ids = array_values(array_unique(array_filter($studentIds)));
        if ($ids === []) {
            return [];
        }

        return Attendance::query()
            ->whereIn('student_id', $ids)
            ->where('status', 'absent')
            ->selectRaw('student_id, COUNT(*) as aggregate')
            ->groupBy('student_id')
            ->pluck('aggregate', 'student_id')
            ->map(fn ($count) => (int) $count)
            ->all();
    }

    public function examAbsenceCount(int $studentId): int
    {
        return ExamSeating::where('student_id', $studentId)
            ->where(function ($q) {
                $q->where('is_present', false)->orWhereNull('is_present');
            })
            ->count();
    }

    /**
     * @return array{course_absences: int, exam_absences: int}
     */
    public function splitCounters(int $studentId): array
    {
        return [
            'course_absences' => $this->courseAbsenceCount($studentId),
            'exam_absences' => $this->examAbsenceCount($studentId),
        ];
    }

    public function reportFraudIncident(ExamIncident $incident): void
    {
        $type = strtolower((string) ($incident->incident_type ?? $incident->type ?? ''));
        if (! in_array($type, ['fraud', 'fraude', 'cheating'], true)) {
            return;
        }

        $student = $incident->student;
        DisciplinaryCase::create([
            'institution_id' => $student?->institution_id ?? 1,
            'student_id' => $incident->student_id,
            'case_number' => 'DISC-EXAM-'.$incident->id.'-'.now()->format('YmdHis'),
            'infraction_type' => 'cheating',
            'description' => $incident->description ?? 'Incident de fraude en examen',
            'incident_date' => now()->toDateString(),
            'status' => 'pending',
        ]);

        try {
            foreach (User::role('discipline-committee')->get() as $user) {
                $user->notify(new \App\Notifications\SystemNotification(
                    'Incident examen — conseil de discipline',
                    'Un cas de fraude a été ouvert pour instruction.'
                ));
            }
        } catch (\Throwable) {
            // Spatie role may be absent in some test DBs
        }
    }
}
