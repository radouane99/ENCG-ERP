<?php

namespace App\Services;

use App\Models\User;
use PragmaRX\Google2FA\Google2FA;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class TwoFactorAuthService
{
    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    /**
     * Generate a new 2FA secret key and recovery codes for a user.
     * Returns setup data: QR code URL and recovery codes.
     */
    public function generateSetupData(User $user): array
    {
        $secret = $this->google2fa->generateSecretKey();
        $recoveryCodes = $this->generateRecoveryCodes();

        // Store encrypted secret temporarily (not confirmed yet)
        $user->update([
            'two_factor_secret' => encrypt($secret),
            'two_factor_recovery_codes' => encrypt(json_encode($recoveryCodes)),
            'two_factor_confirmed_at' => null,
        ]);

        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name', 'ENCG ERP'),
            $user->email,
            $secret
        );

        return [
            'qr_code_url' => $qrCodeUrl,
            'secret' => $secret,
            'recovery_codes' => $recoveryCodes,
        ];
    }

    /**
     * Confirm and enable 2FA after user verifies with their authenticator app.
     */
    public function confirmAndEnable(User $user, string $code): bool
    {
        if (!$user->two_factor_secret) {
            return false;
        }

        $secret = decrypt($user->two_factor_secret);
        $valid = $this->google2fa->verifyKey($secret, $code);

        if ($valid) {
            $user->update([
                'two_factor_enabled' => true,
                'two_factor_confirmed_at' => now(),
            ]);
        }

        return $valid;
    }

    /**
     * Verify a TOTP code during login.
     */
    public function verify(User $user, string $code): bool
    {
        if (!$user->two_factor_secret) {
            return false;
        }

        // Check TOTP code
        $secret = decrypt($user->two_factor_secret);
        if ($this->google2fa->verifyKey($secret, $code)) {
            return true;
        }

        // Check recovery codes
        return $this->verifyRecoveryCode($user, $code);
    }

    /**
     * Disable 2FA for a user.
     */
    public function disable(User $user): void
    {
        $user->update([
            'two_factor_enabled' => false,
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);
    }

    /**
     * Verify and consume a recovery code.
     */
    private function verifyRecoveryCode(User $user, string $code): bool
    {
        if (!$user->two_factor_recovery_codes) {
            return false;
        }

        $codes = json_decode(decrypt($user->two_factor_recovery_codes), true);
        $normalizedCode = str_replace('-', '', strtoupper(trim($code)));

        foreach ($codes as $index => $storedCode) {
            if (hash_equals($storedCode, $normalizedCode)) {
                // Consume the recovery code (remove it from list)
                unset($codes[$index]);
                $user->update([
                    'two_factor_recovery_codes' => encrypt(json_encode(array_values($codes))),
                ]);
                return true;
            }
        }

        return false;
    }

    /**
     * Generate a set of recovery codes.
     */
    private function generateRecoveryCodes(int $count = 8): array
    {
        return Collection::times($count, function () {
            return strtoupper(Str::random(5) . '-' . Str::random(5));
        })->toArray();
    }
}
