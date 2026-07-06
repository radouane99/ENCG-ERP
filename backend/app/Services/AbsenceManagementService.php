<?php

namespace App\Services;

use App\Models\AttendanceSession;
use App\Models\Attendance;
use App\Models\AbsenceJustification;
use App\Models\Student;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class AbsenceManagementService
{
    /**
     * Professor marks attendance
     */
    public function markAttendance(array $sessionData, array $studentsData, int $professorId): AttendanceSession
    {
        return DB::transaction(function () use ($sessionData, $studentsData, $professorId) {
            $session = AttendanceSession::create(array_merge($sessionData, [
                'professor_id' => $professorId,
                'created_by' => $professorId,
                'is_locked' => false
            ]));

            $attendancesToInsert = [];
            foreach ($studentsData as $studentData) {
                $attendancesToInsert[] = [
                    'attendance_session_id' => $session->id,
                    'student_id' => $studentData['student_id'],
                    'status' => $studentData['status'], // present, absent, late
                    'is_justified' => false,
                    'notes' => $studentData['notes'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            Attendance::insert($attendancesToInsert);

            return $session;
        });
    }

    /**
     * Student submits a justification for an absence
     */
    public function submitJustification(Student $student, Attendance $attendance, array $data, UploadedFile $file): AbsenceJustification
    {
        if ($attendance->student_id !== $student->id) {
            throw new Exception("This absence does not belong to the student.");
        }

        if ($attendance->status !== 'absent') {
            throw new Exception("You can only justify absences.");
        }

        return DB::transaction(function () use ($student, $attendance, $data, $file) {
            $justification = AbsenceJustification::create([
                'attendance_id' => $attendance->id,
                'student_id' => $student->id,
                'reason' => $data['reason'],
                'description' => $data['description'] ?? null,
                'status' => 'pending',
            ]);

            // Assuming AbsenceJustification implements HasMedia and uses InteractsWithMedia
            $justification->addMedia($file)
                         ->toMediaCollection('absence_justifications');

            return $justification;
        });
    }

    /**
     * Admin processes a justification
     */
    public function processJustification(AbsenceJustification $justification, string $status, int $adminId, ?string $rejectionReason = null): AbsenceJustification
    {
        return DB::transaction(function () use ($justification, $status, $adminId, $rejectionReason) {
            $justification->update([
                'status' => $status,
                'reviewed_by' => $adminId,
                'reviewed_at' => now(),
                'rejection_reason' => $status === 'rejected' ? $rejectionReason : null,
            ]);

            if ($status === 'approved') {
                $justification->attendance->update([
                    'is_justified' => true,
                    'status' => 'excused',
                ]);
            }

            return $justification;
        });
    }
}
