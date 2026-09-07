<?php

namespace App\Services\Academic;

use App\Models\AbsenceJustification;
use App\Models\Attendance;
use App\Models\Grade;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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
    /**
     * Get student schedule.
     */
    public function getSchedule(int $studentId): Collection
    {
        $groupId = DB::table('student_pathways')
            ->where('student_id', $studentId)
            ->where('is_current', true)
            ->value('group_id')
            ?: DB::table('student_registrations')
                ->where('student_id', $studentId)
                ->value('group_id');

        if (! $groupId) {
            return collect([]);
        }

        $query = DB::table('schedules')
            ->join('modules', 'schedules.module_id', '=', 'modules.id')
            ->leftJoin('rooms', 'schedules.room_id', '=', 'rooms.id')
            ->leftJoin('professors', 'schedules.professor_id', '=', 'professors.id')
            ->leftJoin('users', 'professors.user_id', '=', 'users.id')
            ->where('schedules.group_id', $groupId)
            ->where('schedules.is_active', true);

        if (Schema::hasTable('schedule_versions')) {
            $query->leftJoin('schedule_versions', 'schedules.schedule_version_id', '=', 'schedule_versions.id')
                ->where(function ($q) {
                    $q->whereNull('schedules.schedule_version_id')
                        ->orWhere('schedule_versions.status', 'PUBLISHED');
                });
        }

        if (Schema::hasColumn('rooms', 'is_out_of_service')) {
            $query->where(function ($q) {
                $q->whereNull('rooms.id')
                    ->orWhere('rooms.is_out_of_service', false);
            });
        }

        $daysMap = [
            1 => 'Lundi',
            2 => 'Mardi',
            3 => 'Mercredi',
            4 => 'Jeudi',
            5 => 'Vendredi',
            6 => 'Samedi',
            7 => 'Dimanche',
        ];

        return $query
            ->select(
                'schedules.id',
                'schedules.day_of_week',
                'schedules.start_time',
                'schedules.end_time',
                'modules.id as module_id',
                'modules.name as module_name',
                'modules.code as module_code',
                'rooms.name as room_name',
                'schedules.session_type as type',
                DB::raw("COALESCE(NULLIF(users.name, ''), CONCAT(COALESCE(users.first_name, ''), ' ', COALESCE(users.last_name, ''))) as professor")
            )
            ->orderBy('schedules.day_of_week')
            ->orderBy('schedules.start_time')
            ->get()
            ->map(function ($s) use ($daysMap) {
                $dayName = $daysMap[(int) $s->day_of_week] ?? 'Lundi';
                $startTime = substr((string) $s->start_time, 0, 5);
                $endTime = substr((string) $s->end_time, 0, 5);
                $timeFormatted = "{$startTime} - {$endTime}";
                $rawType = strtolower((string) $s->type);
                $typeLabel = $rawType === 'cm' ? 'Cours Magistral (CM)' : ($rawType === 'td' ? 'Travaux Dirigés (TD)' : ($rawType === 'tp' ? 'Travaux Pratiques (TP)' : ucfirst((string) $s->type)));
                $profName = trim((string) $s->professor);
                if (! empty($profName) && ! str_starts_with($profName, 'Pr.') && ! str_starts_with($profName, 'Dr.')) {
                    $profName = "Pr. {$profName}";
                }

                return [
                    'id' => $s->id,
                    'day_of_week' => (int) $s->day_of_week,
                    'day' => $dayName,
                    'time' => $timeFormatted,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'module_id' => $s->module_id,
                    'module_code' => $s->module_code,
                    'module_name' => $s->module_name,
                    'module' => $s->module_name,
                    'title' => $s->module_name,
                    'room' => $s->room_name ?? 'Amphithéâtre / Salle non assignée',
                    'location' => $s->room_name ?? 'Amphithéâtre / Salle non assignée',
                    'type' => $typeLabel,
                    'raw_type' => $rawType,
                    'professor' => ! empty($profName) ? $profName : 'Enseignant non assigné',
                ];
            });
    }

    /**
     * Submit a medical certificate or other justification for an absence.
     */
    public function submitAbsenceJustification(array $data, ?UploadedFile $file, int $studentId): array
    {
        app(AcademicWindowGuard::class)->assertJustificationsOpen();

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

        $subGroupInfo = app(StudentSubGroupDispatcherService::class)->getStudentSubGroupInfo($studentId);

        return [
            'absences' => $absences,
            'published_grades' => $gradesCount,
            'classes_today' => $classesToday,
            'gpa' => $gpa,
            'upcoming_exams' => $upcomingExams,
            'recent_documents' => $recentDocuments,
            'academic_info' => $subGroupInfo,
            'section' => $subGroupInfo['section_label'] ?? null,
            'sub_group' => $subGroupInfo['sub_group'] ?? null,
            'group_name' => $subGroupInfo['group_name'] ?? null,
        ];
    }
}
