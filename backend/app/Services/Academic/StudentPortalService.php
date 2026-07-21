<?php

namespace App\Services\Academic;

use App\Models\AbsenceJustification;
use App\Models\Attendance;
use App\Models\Grade;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StudentPortalService
{
    /**
     * Get published grades for the student.
     */
    public function getGrades(int $studentId): Collection
    {
        return Grade::with(['assessment.module'])
            ->where('student_id', $studentId)
            ->get();
    }

    /**
     * Get student schedule.
     */
    public function getSchedule(int $studentId): Collection
    {
        $pathway = DB::table('student_pathways')
            ->where('student_id', $studentId)
            ->where('is_current', true)
            ->first();

        if (! $pathway || ! $pathway->group_id) {
            return collect([]);
        }

        return DB::table('schedules')
            ->join('modules', 'schedules.module_id', '=', 'modules.id')
            ->leftJoin('rooms', 'schedules.room_id', '=', 'rooms.id')
            ->leftJoin('users', 'schedules.professor_id', '=', 'users.id')
            ->where('schedules.group_id', $pathway->group_id)
            ->where('schedules.is_active', true)
            ->select(
                'schedules.id',
                'schedules.day_of_week as day',
                DB::raw("CONCAT(schedules.start_time, ' - ', schedules.end_time) as time"),
                'modules.name as module',
                'rooms.name as room',
                'schedules.session_type as type',
                DB::raw("CONCAT(COALESCE(users.first_name, ''), ' ', COALESCE(users.last_name, '')) as professor")
            )
            ->orderBy('schedules.day_of_week')
            ->orderBy('schedules.start_time')
            ->get();
    }

    /**
     * Submit a medical certificate or other justification for an absence.
     */
    public function submitAbsenceJustification(array $data, ?UploadedFile $file, int $studentId): array
    {
        $attendance = Attendance::where('student_id', $studentId)
            ->whereKey($data['attendance_id'])
            ->firstOrFail();

        $path = $file ? $file->store('justifications', 'private') : null;

        $justification = AbsenceJustification::create([
            'student_id' => $studentId,
            'attendance_id' => $attendance->id,
            'reason' => $data['reason'],
            'description' => $data['description'] ?? null,
            'document_path' => $path,
            'status' => 'pending',
        ]);

        return [
            'success' => true,
            'message' => 'Justificatif soumis avec succès. En attente de validation.',
            'data' => $justification,
        ];
    }

    /**
     * Dashboard specific stats.
     */
    public function getDashboardStats(int $studentId): array
    {
        $absences = DB::table('attendances')
            ->where('student_id', $studentId)
            ->where('status', 'absent')
            ->count();

        $grades = $this->getGrades($studentId);
        $gradesCount = $grades->count();
        $gpa = $gradesCount > 0 ? round((float) $grades->avg('value'), 2) : 0;

        $pathway = DB::table('student_pathways')
            ->where('student_id', $studentId)
            ->where('is_current', true)
            ->first();

        $classesToday = 0;
        $upcomingExams = 0;

        if ($pathway && $pathway->group_id) {
            $classesToday = DB::table('schedules')
                ->where('group_id', $pathway->group_id)
                ->where('day_of_week', now()->dayOfWeekIso)
                ->where('is_active', true)
                ->count();

            $upcomingExams = DB::table('exams')
                ->where('group_id', $pathway->group_id)
                ->whereDate('exam_date', '>=', now()->toDateString())
                ->count();
        }

        $recentDocuments = DB::table('document_requests')
            ->join('document_types', 'document_requests.document_type_id', '=', 'document_types.id')
            ->where('document_requests.student_id', $studentId)
            ->where('document_requests.status', 'ready')
            ->orderByDesc('document_requests.created_at')
            ->limit(5)
            ->get(['document_types.name as title', 'document_requests.created_at as date'])
            ->map(fn ($document) => [
                'title' => $document->title,
                'date' => substr((string) $document->date, 0, 10),
            ])
            ->toArray();

        return [
            'absences' => $absences,
            'published_grades' => $gradesCount,
            'classes_today' => $classesToday,
            'gpa' => $gpa,
            'upcoming_exams' => $upcomingExams,
            'recent_documents' => $recentDocuments,
        ];
    }
}
