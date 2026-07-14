<?php

namespace App\Services\Academic;

use Illuminate\Support\Facades\DB;
use App\Models\Grade;
use App\Models\AbsenceJustification;
use Illuminate\Support\Collection;

class StudentPortalService
{
    /**
     * Get validated and published grades for the student.
     * APOGEE Rule: Students only see grades when explicitly published/unlocked by admin/jury.
     */
    public function getGrades(int $studentId): Collection
    {
        return Grade::with(['gradeComponent.module', 'examSession'])
            ->where('student_id', $studentId)
            ->whereHas('examSession', function ($q) {
                // Assuming 'is_locked' = true means the grades are locked and published.
                // In some systems, another field like 'is_published' might be used.
                $q->where('is_locked', true);
            })
            ->get();
    }

    /**
     * Get student schedule. 
     */
    public function getSchedule(int $studentId): Collection
    {
        // Find current active pathway group
        $pathway = DB::table('student_pathways')
            ->where('student_id', $studentId)
            ->where('is_current', true)
            ->first();

        if (!$pathway || !$pathway->group_id) {
            return collect([]);
        }

        return DB::table('schedules')
            ->join('modules', 'schedules.module_id', '=', 'modules.id')
            ->join('rooms', 'schedules.room_id', '=', 'rooms.id')
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
                DB::raw("CONCAT(users.first_name, ' ', users.last_name) as professor")
            )
            ->orderBy('schedules.day_of_week')
            ->orderBy('schedules.start_time')
            ->get();
    }

    /**
     * Submit a medical certificate or other justification for an absence.
     */
    public function submitAbsenceJustification(array $data, $file): array
    {
        $path = null;
        if ($file) {
            // Save file in public storage 'justifications' folder
            $path = $file->store('justifications', 'public');
        }

        // Create the justification record.
        $justification = AbsenceJustification::create([
            'student_id' => $data['student_id'],
            'attendance_id' => $data['attendance_id'],
            'reason' => $data['reason'],
            'description' => $data['description'] ?? null,
            'document_path' => $path,
            'status' => 'pending'
        ]);

        return [
            'success' => true,
            'message' => 'Justificatif soumis avec succès. En attente de validation.',
            'data' => $justification
        ];
    }

    /**
     * Dashboard specific stats
     */
    public function getDashboardStats(int $studentId): array
    {
        // Get un-justified absences
        $absences = DB::table('attendance_records')
            ->where('student_id', $studentId)
            ->where('status', 'absent')
            ->count();

        // Fetch grades to calculate GPA
        $grades = $this->getGrades($studentId);
        $gradesCount = $grades->count();
        $gpa = 0;
        if ($gradesCount > 0) {
            $sum = 0;
            foreach ($grades as $grade) {
                $sum += $grade->value;
            }
            $gpa = round($sum / $gradesCount, 2);
        } else {
            $gpa = 14.5; // Demo fallback
        }

        // Check if there are scheduled classes today
        $dayOfWeek = now()->dayOfWeekIso; // 1 = Monday, 7 = Sunday
        $pathway = DB::table('student_pathways')
            ->where('student_id', $studentId)
            ->where('is_current', true)
            ->first();

        $classesToday = 0;
        if ($pathway && $pathway->group_id) {
            $classesToday = DB::table('schedules')
                ->where('group_id', $pathway->group_id)
                ->where('day_of_week', $dayOfWeek)
                ->where('is_active', true)
                ->count();
        }

        return [
            'absences' => $absences,
            'published_grades' => $gradesCount,
            'classes_today' => $classesToday,
            'gpa' => $gpa,
            'upcoming_exams' => 3, // Mocked for demo
            'recent_documents' => [
                ['title' => 'Attestation de scolarité', 'date' => '2026-06-15'],
                ['title' => 'Relevé de notes S5', 'date' => '2026-06-10']
            ]
        ];
    }
}
