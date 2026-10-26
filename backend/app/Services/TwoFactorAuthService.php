<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorAuthService
{
    public function __construct(
        private Google2FA $google2fa = new Google2FA
    ) {}

    /**
     * Générer une clé secrète 2FA et des codes de récupération.
     */
    public function generateSetupData(User $user): array
    {
        $secret = $this->google2fa->generateSecretKey();
        $recoveryCodes = $this->generateRecoveryCodes();

        $user->forceFill([
            'two_factor_secret' => encrypt($secret),
            'two_factor_recovery_codes' => encrypt(json_encode($recoveryCodes)),
            'two_factor_confirmed_at' => null,
        ])->save();

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
     * Confirmer et activer la 2FA après vérification du code.
     */
    public function confirmAndEnable(User $user, string $code): bool
    {
        if (! $user->two_factor_secret) {
            return false;
        }

        $valid = $this->verifyTotp($user, $code);

        if ($valid) {
            $user->update([
                'two_factor_enabled' => true,
                'two_factor_confirmed_at' => now(),
            ]);
        }

        Log::info('2FA Confirmation', [
            'user' => $user->email,
            'valid' => $valid,
        ]);

        return $valid;
    }

    /**
     * Vérifier un code TOTP lors de la connexion.
     */
    public function verify(User $user, string $code): bool
    {
        if (! $user->two_factor_secret) {
            return false;
        }

        // Vérifier le code TOTP
        if ($this->verifyTotp($user, $code)) {
            return Cache::add('used_totp:'.$user->id.':'.hash('sha256', trim($code)), true, 90);
        }

        // Vérifier les codes de récupération
        return $this->verifyRecoveryCode($user, $code);
    }

    /**
     * Désactiver la 2FA.
     */
    public function disable(User $user): void
    {
        $user->forceFill([
            'two_factor_enabled' => false,
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();
    }

    /**
     * Vérifier un code TOTP.
     */
    private function verifyTotp(User $user, string $code): bool
    {
        $cleanCode = trim($code);

        try {
            $secret = $this->getDecryptedSecret($user);

            return $secret && $this->google2fa->verifyKey($secret, $cleanCode, 1);
        } catch (\Exception $e) {
            Log::warning('Erreur vérification 2FA: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Vérifier et consommer un code de récupération.
     */
    private function verifyRecoveryCode(User $user, string $code): bool
    {
        return DB::transaction(function () use ($user, $code) {
            $locked = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            if (! $locked->two_factor_recovery_codes) {
                return false;
            }
            try {
                $codes = json_decode(decrypt($locked->two_factor_recovery_codes), true);
            } catch (\Throwable) {
                return false;
            }
            if (! is_array($codes)) {
                return false;
            }
            $normalize = fn ($value) => str_replace('-', '', strtoupper(trim($value)));
            foreach ($codes as $index => $stored) {
                if (hash_equals($normalize($stored), $normalize($code))) {
                    unset($codes[$index]);
                    $locked->forceFill(['two_factor_recovery_codes' => encrypt(json_encode(array_values($codes)))])->save();

                    return true;
                }
            }

            return false;
        });
    }

    /**
     * Décrypter la clé secrète 2FA.
     */
    private function getDecryptedSecret(User $user): ?string
    {
        if (! $user->two_factor_secret) {
            return null;
        }

        try {
            return decrypt($user->two_factor_secret);
        } catch (\Throwable $e) {
            // Si stocké en clair (seeders)
            return $user->two_factor_secret;
        }
    }

    /**
     * Vérifier si les master codes sont autorisés.
     */
    /**
     * Générer des codes de récupération.
     */
    private function generateRecoveryCodes(int $count = 8): array
    {
        return Collection::times($count, fn () => strtoupper(Str::random(5).'-'.Str::random(5)))->toArray();
    }
}
