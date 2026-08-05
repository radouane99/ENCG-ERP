<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Request;
use App\Notifications\SuspiciousLoginAlert;

class LogSuccessfulLogin
{
    /**
     * Handle the event.
     */
    public function handle(Login $event): void
    {
        $user = $event->user;
        $currentIp = Request::ip();

        // Check if the user is an admin or professor to limit noise
        $isAdminOrProf = (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['super-admin', 'institution-admin', 'director', 'department-head', 'professor', 'admin']))
                         || (method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('professor')))
                         || in_array($user->role ?? null, ['admin', 'professor', 'super-admin']);

        if ($isAdminOrProf) {
            if ($user->last_login_ip && $user->last_login_ip !== $currentIp) {
                // Send alert safely without blocking login on mail failure
                try {
                    $user->notify(new SuspiciousLoginAlert($currentIp));
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed to send suspicious login alert: ' . $e->getMessage());
                }
            }
        }

        // Update the last login IP and timestamp
        $user->last_login_ip = $currentIp;
        $user->last_login_at = now();
        $user->save();
    }
}
