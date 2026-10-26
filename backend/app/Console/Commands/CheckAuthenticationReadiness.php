<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CheckAuthenticationReadiness extends Command
{
    protected $signature = 'security:auth-readiness {--json}';

    protected $description = 'Read-only authentication readiness checks; never changes accounts or configuration.';

    public function handle(): int
    {
        $admins = User::where('is_active', true)->whereHas('roles', fn ($q) => $q->whereIn('name', ['super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'admin', 'director', 'directeur', 'scolarite']));
        $pending = (clone $admins)->where(fn ($q) => $q->where('two_factor_enabled', false)->orWhereNull('two_factor_confirmed_at'))->count();
        $checks = [
            'production_environment' => app()->environment('production'),
            'debug_disabled' => ! config('app.debug'),
            'app_https' => parse_url(config('app.url'), PHP_URL_SCHEME) === 'https',
            'frontend_https' => parse_url(config('app.frontend_url'), PHP_URL_SCHEME) === 'https',
            'explicit_cors_origins' => ! in_array('*', config('cors.allowed_origins', []), true),
            'administrators_enrolled' => $pending === 0 && (clone $admins)->exists(),
        ];
        $result = ['ready' => ! in_array(false, $checks, true), 'checks' => $checks, 'administrators_pending_2fa' => $pending, 'accounts_required_2fa' => User::where('two_factor_required', true)->count(), 'sso_real_login_verified' => false];
        if ($this->option('json')) {
            $this->line(json_encode($result, JSON_PRETTY_PRINT));
        } else {
            foreach ($checks as $name => $passed) {
                $this->line(($passed ? 'OK ' : 'TODO ').$name);
            }
            $this->line('Administrators pending 2FA: '.$pending);
            $this->line('A real provider login and public-browser cookie inspection remain manual checks.');
        }

        return $result['ready'] ? self::SUCCESS : self::FAILURE;
    }
}
