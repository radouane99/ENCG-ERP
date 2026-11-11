<?php

namespace App\Actions\Attendance;

use App\Models\{AttendanceSession, User};
use App\Services\Academic\AttendanceService;
use Illuminate\Support\Facades\DB;

class ReopenAttendanceSessionAction
{
    public function execute(User $user, int $sessionId, string $reason): AttendanceSession
    {
        abort_unless($user->hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director', 'scolarite']), 403);
        return DB::transaction(function () use ($user, $sessionId, $reason) {
            $session = AttendanceSession::whereKey($sessionId)->lockForUpdate()->firstOrFail();
            app(AttendanceService::class)->authorizeSession($session, false);
            if ($session->status === 'active' && ! $session->is_locked) return $session;
            $session->update(['status' => 'active', 'is_locked' => false, 'qr_token' => null, 'expires_at' => now()]);
            activity()->causedBy($user)->performedOn($session)->withProperties(['reason' => $reason])->log('attendance_session_reopened');
            return $session;
        });
    }
}
