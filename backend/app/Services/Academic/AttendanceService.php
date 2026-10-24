<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\Group;
use App\Models\User;
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
            $actor = auth()->user(); abort_unless($actor && (int) $actor->id === $professorId, 403);
            $module = \App\Models\Module::findOrFail($moduleId);
            app(\App\Services\Security\ClassroomAccessService::class)->authorize($actor, $module, $group, write: true);
            $teacherId = $actor->professor?->id;
            if (! $teacherId) {
                $teachers = \App\Models\ModuleProfessor::where('module_id', $moduleId)->where('academic_year_id', $group->academic_year_id)->where(fn ($q) => $q->where('group_id', $groupId)->orWhereNull('group_id'))->pluck('professor_id')->unique();
                abort_unless($teachers->count() === 1, 422, 'Un enseignant unique doit être affecté au groupe pour démarrer l’appel administratif.');
                $teacherId = $teachers->first();
            }
            abort_if($group->academicYear->is_locked, 409, 'Année académique verrouillée.');
            Group::whereKey($groupId)->lockForUpdate()->firstOrFail();
            $now = Carbon::now();
            $date = $options['date'] ?? $now->toDateString();
            $existing = AttendanceSession::where('module_id', $moduleId)->where('group_id', $groupId)->where('created_by', $actor->id)->where('session_date', $date)->where('status', 'active')->where('expires_at', '>=', $now)->first();
            if ($existing) return $existing;
            $durationMinutes = max(1, (int) ($options['duration_minutes'] ?? 15));
            $endTime = $now->copy()->addMinutes($durationMinutes);

            $session = AttendanceSession::create([
                'module_id' => $moduleId,
                'group_id' => $groupId,
                'academic_year_id' => $group->academic_year_id ?? AcademicYear::where('is_current', true)->value('id') ?? 1,
                'professor_id' => $teacherId,
                'professor_type' => \App\Models\Professor::class,
                'session_date' => $date,
                'start_time' => $now->format('H:i:s'),
                'end_time' => $endTime->format('H:i:s'),
                'session_type' => $options['session_type'] ?? 'qr',
                'room' => $roomName,
                'room_name' => $roomName,
                'module_name' => $options['module_name'] ?? null,
                'group_name' => $options['group_name'] ?? null,
                'created_by' => $professorId,
                'status' => 'active',
                'qr_token' => (string) Str::uuid(),
                'expires_at' => $endTime,
                'latitude' => $options['latitude'] ?? null,
                'longitude' => $options['longitude'] ?? null,
            ]);

            // Créer les enregistrements d'absence par défaut
            $studentIds = \App\Models\Student::where('institution_id', $module->institution_id)->where(fn ($q) =>
                $q->whereHas('pathways', fn ($p) => $p->where('academic_year_id', $group->academic_year_id)->where('group_id', $groupId))
                    ->orWhereHas('registrations', fn ($r) => $r->where('academic_year_id', $group->academic_year_id)->where('group_id', $groupId)))->pluck('id')->all();
            $records = array_map(fn ($studentId) => [
                'attendance_session_id' => $session->id,
                'student_id' => $studentId,
                'status' => 'absent',
                'is_justified' => false,
                'created_at' => $now,
                'updated_at' => $now,
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
        return DB::transaction(function () use ($sessionId, $studentId, $status, $latitude, $longitude, $isValid) {
        abort_unless(in_array($status, ['present', 'absent', 'late', 'excused'], true), 422, 'Statut de présence invalide.');
        $session = AttendanceSession::whereKey($sessionId)->lockForUpdate()->firstOrFail();
        $this->authorizeSession($session);
        abort_unless($session->status === 'active', 409, 'Session fermée.');
        $student = \App\Models\Student::findOrFail($studentId);
        $member = $student->pathways()->where('academic_year_id', $session->academic_year_id)->where('group_id', $session->group_id)->exists()
            || $student->registrations()->where('academic_year_id', $session->academic_year_id)->where('group_id', $session->group_id)->exists();
        abort_unless($member, 403, 'Étudiant hors du groupe de cette session.');
        if (auth()->user()->hasRole('student')) {
            abort_unless((int) auth()->user()->student?->id === $studentId && $status === 'present', 403);
            abort_if($session->expires_at?->isPast(), 409, 'QR expiré. Demandez la vérification à votre enseignant.');
        }
        $record = Attendance::firstOrCreate(
            ['attendance_session_id' => $sessionId, 'student_id' => $studentId],
            ['status' => 'absent', 'is_justified' => false]
        );

        $record->update([
            'status' => $status,
            'scanned_at' => Carbon::now(),
            'scanned_latitude' => $latitude,
            'scanned_longitude' => $longitude,
            'is_valid' => $isValid,
        ]);

        return $record->fresh(['student.user']);
        });
    }

    /**
     * Fermer une session de présence.
     */
    public function closeSession(int $sessionId): AttendanceSession
    {
        return DB::transaction(function () use ($sessionId) {
        $session = AttendanceSession::whereKey($sessionId)->lockForUpdate()->firstOrFail();
        $this->authorizeSession($session, false);
        if ($session->status === 'completed') return $session;
        $session->update([
            'status' => 'completed',
            'end_time' => Carbon::now()->format('H:i:s'),
            'qr_token' => null,
        ]);

        return $session;
        });
    }

    public function authorizeSession(AttendanceSession $session, bool $allowStudent = true): void
    {
        $actor = auth()->user(); abort_unless($actor, 403);
        $module = \App\Models\Module::findOrFail($session->module_id);
        abort_unless((int) $module->institution_id === (int) $actor->institution_id, 403);
        abort_if(AcademicYear::whereKey($session->academic_year_id)->value('is_locked'), 409, 'Année académique verrouillée.');
        if ($allowStudent && $actor->hasRole('student')) return;
        $staff = $actor->hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director', 'scolarite']);
        abort_unless($staff || (int) $session->created_by === (int) $actor->id, 403, 'Session réservée à son enseignant.');
        app(\App\Services\Security\ClassroomAccessService::class)->authorize($actor, $module, Group::findOrFail($session->group_id), write: true);
        abort_if(AcademicYear::whereKey($session->academic_year_id)->value('is_locked'), 409, 'Année académique verrouillée.');
    }
}
