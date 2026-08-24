<?php

namespace App\Services;

use App\Models\AbsenceJustification;
use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\Student;
use App\Services\Academic\AcademicWindowGuard;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class AbsenceManagementService
{
    /**
     * Enregistrer les présences d'une séance.
     */
    public function markAttendance(array $sessionData, array $studentsData, int $professorId): AttendanceSession
    {
        return DB::transaction(function () use ($sessionData, $studentsData, $professorId) {
            $session = AttendanceSession::create([
                ...$sessionData,
                'professor_id' => $professorId,
                'created_by' => $professorId,
                'is_locked' => false,
            ]);

            $attendances = array_map(fn ($s) => [
                'attendance_session_id' => $session->id,
                'student_id' => $s['student_id'],
                'status' => $s['status'],
                'is_justified' => false,
                'notes' => $s['notes'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ], $studentsData);

            Attendance::insert($attendances);

            return $session->fresh();
        });
    }

    /**
     * Soumettre un justificatif d'absence.
     */
    public function submitJustification(Student $student, Attendance $attendance, array $data, UploadedFile $file): AbsenceJustification
    {
        app(AcademicWindowGuard::class)->assertJustificationsOpen();

        if ($attendance->student_id !== $student->id) {
            throw new Exception("Cette absence n'appartient pas à l'étudiant.");
        }

        if ($attendance->status !== 'absent') {
            throw new Exception('Seules les absences peuvent être justifiées.');
        }

        return DB::transaction(function () use ($student, $attendance, $data, $file) {
            $justification = AbsenceJustification::create([
                'attendance_id' => $attendance->id,
                'student_id' => $student->id,
                'reason' => $data['reason'],
                'description' => $data['description'] ?? null,
                'status' => 'pending',
            ]);

            if (method_exists($justification, 'addMedia')) {
                $justification->addMedia($file)->toMediaCollection('absence_justifications');
            }

            return $justification;
        });
    }

    /**
     * Traiter un justificatif (admin).
     */
    public function processJustification(
        AbsenceJustification $justification,
        string $status,
        int $adminId,
        ?string $rejectionReason = null
    ): AbsenceJustification {
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

            return $justification->fresh();
        });
    }
}
