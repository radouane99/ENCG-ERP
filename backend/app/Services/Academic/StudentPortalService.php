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
     * In a real system, this would join with schedules, groups, and modules.
     */
    public function getSchedule(int $studentId): array
    {
        // For demonstration, returning a structured mockup.
        // A real implementation would query the `schedules` table using the student's group_id.
        return [
            ['id' => 1, 'day' => 1, 'time' => '08:30 - 10:30', 'module' => 'Comptabilité Générale II', 'room' => 'Amphi A', 'type' => 'CM', 'professor' => 'Pr. Benchekroun'],
            ['id' => 2, 'day' => 2, 'time' => '10:45 - 12:45', 'module' => 'Algèbre Linéaire', 'room' => 'Salle 302', 'type' => 'TD', 'professor' => 'Pr. Alaoui'],
            ['id' => 3, 'day' => 3, 'time' => '14:00 - 16:00', 'module' => 'Marketing Stratégique', 'room' => 'Salle 105', 'type' => 'TP', 'professor' => 'Pr. Tazi'],
        ];
    }

    /**
     * Submit a medical certificate or other justification for an absence.
     */
    public function submitAbsenceJustification(array $data, $file): array
    {
        // 1. Validate the attendance record exists and belongs to the student.
        // 2. Handle file upload (mocking path for demo).
        $path = 'justifications/cert_' . time() . '.' . ($file ? $file->getClientOriginalExtension() : 'pdf');
        
        if ($file) {
            // $file->storeAs('public/justifications', $path);
        }

        // 3. Create the justification record.
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
}
