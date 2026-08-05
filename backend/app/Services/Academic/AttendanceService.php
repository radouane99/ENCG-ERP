<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\Group;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AttendanceService
{
    /**
     * Démarrer une session de présence.
     */
    public function startSession(int $moduleId, int $groupId, int $professorId, string $roomName, array $options = []): AttendanceSession
    {
        return DB::transaction(function () use ($moduleId, $groupId, $professorId, $roomName, $options) {
            $group = Group::with('academicYear')->findOrFail($groupId);
            $now   = Carbon::now();
            $durationMinutes = max(1, (int) ($options['duration_minutes'] ?? 15));
            $endTime = $now->copy()->addMinutes($durationMinutes);

            $session = AttendanceSession::create([
                'module_id'        => $moduleId,
                'group_id'         => $groupId,
                'academic_year_id' => $group->academic_year_id ?? AcademicYear::where('is_current', true)->value('id') ?? 1,
                'professor_id'     => $professorId,
                'professor_type'   => \App\Models\User::class,
                'session_date'     => $now->toDateString(),
                'start_time'       => $now->format('H:i:s'),
                'end_time'         => $endTime->format('H:i:s'),
                'session_type'     => $options['session_type'] ?? 'qr',
                'room'             => $roomName,
                'room_name'        => $roomName,
                'module_name'      => $options['module_name'] ?? null,
                'group_name'       => $options['group_name'] ?? null,
                'created_by'       => $professorId,
                'status'           => 'active',
                'qr_token'         => (string) Str::uuid(),
                'expires_at'       => $endTime,
                'latitude'         => $options['latitude'] ?? null,
                'longitude'        => $options['longitude'] ?? null,
            ]);

            // Créer les enregistrements d'absence par défaut
            $studentIds = $group->students()->pluck('students.id')->all();
            $records    = array_map(fn($studentId) => [
                'attendance_session_id' => $session->id,
                'student_id'            => $studentId,
                'status'                => 'absent',
                'is_justified'          => false,
                'created_at'            => $now,
                'updated_at'            => $now,
            ], $studentIds);

            foreach (array_chunk($records, 500) as $chunk) {
                Attendance::insert($chunk);
            }

            return $session;
        });
    }

    /**
     * Marquer la présence d'un étudiant.
     */
    public function markPresence(
        int $sessionId,
        int $studentId,
        string $status = 'present',
        ?float $latitude = null,
        ?float $longitude = null,
        bool $isValid = true
    ): Attendance {
        $record = Attendance::firstOrCreate(
            ['attendance_session_id' => $sessionId, 'student_id' => $studentId],
            ['status' => 'absent', 'is_justified' => false]
        );

        $record->update([
            'status'            => $status,
            'scanned_at'        => Carbon::now(),
            'scanned_latitude'  => $latitude,
            'scanned_longitude' => $longitude,
            'is_valid'          => $isValid,
        ]);

        return $record->fresh(['student.user']);
    }

    /**
     * Fermer une session de présence.
     */
    public function closeSession(int $sessionId): AttendanceSession
    {
        $session = AttendanceSession::findOrFail($sessionId);
        $session->update([
            'status'   => 'completed',
            'end_time' => Carbon::now()->format('H:i:s'),
            'qr_token' => null,
        ]);

        return $session;
    }
}