<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class LoginChallengeService
{
    public static function stamp(User $user): string
    {
        return hash('sha256', (string) $user->password.'|'.(string) $user->two_factor_secret);
    }

    public function create(User $user, bool $remember = false): array
    {
        $token = Str::random(64);
        Cache::put('2fa_challenge_'.$token, ['user_id' => $user->id, 'stamp' => self::stamp($user), 'remember' => $remember], now()->addMinutes(10));

        return ['requires_two_factor' => true, 'two_factor_challenge_token' => $token];
    }

    public function verify(string $challenge, string $code): ?array
    {
        return Cache::lock('2fa_verify_'.hash('sha256', $challenge), 10)->get(function () use ($challenge, $code) {
            $key = '2fa_challenge_'.$challenge;
            $data = Cache::get($key);
            if (! is_array($data)) {
                return null;
            }
            $limit = 'challenge_attempts:'.hash('sha256', $challenge);
            if (RateLimiter::tooManyAttempts($limit, 5)) {
                Cache::forget($key);

                return null;
            }
            $user = User::with('roles', 'permissions')->find($data['user_id']);
            if (! $user || ! $user->is_active || ! $user->two_factor_enabled || ! hash_equals($data['stamp'], self::stamp($user))) {
                Cache::forget($key);

                return null;
            }
            if (! app(TwoFactorAuthService::class)->verify($user, $code)) {
                RateLimiter::hit($limit, 600);

                return null;
            }
            Cache::forget($key);
            RateLimiter::clear($limit);

            return ['user' => $user, 'remember' => (bool) $data['remember']];
        }) ?: null;
    }
}
