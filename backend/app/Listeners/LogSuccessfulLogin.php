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
        $isAdminOrProf = (method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('professor')))
                         || in_array($user->role, ['admin', 'professor']);

        if ($isAdminOrProf) {
            if ($user->last_login_ip && $user->last_login_ip !== $currentIp) {
                // Send alert
                $user->notify(new SuspiciousLoginAlert($currentIp));
            }
        }

        // Update the last login IP
        $user->last_login_ip = $currentIp;
        $user->save();
    }
}
