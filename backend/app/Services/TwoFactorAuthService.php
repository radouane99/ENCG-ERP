<?php

namespace App\Services;

use App\Models\User;
use PragmaRX\Google2FA\Google2FA;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TwoFactorAuthService
{
    public function __construct(
        private Google2FA $google2fa = new Google2FA()
    ) {}

    /**
     * Générer une clé secrète 2FA et des codes de récupération.
     */
    public function generateSetupData(User $user): array
    {
        $secret        = $this->google2fa->generateSecretKey();
        $recoveryCodes = $this->generateRecoveryCodes();

        $user->update([
            'two_factor_secret'          => encrypt($secret),
            'two_factor_recovery_codes'  => encrypt(json_encode($recoveryCodes)),
            'two_factor_confirmed_at'    => null,
        ]);

        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name', 'ENCG ERP'),
            $user->email,
            $secret
        );

        return [
            'qr_code_url'    => $qrCodeUrl,
            'secret'         => $secret,
            'recovery_codes' => $recoveryCodes,
        ];
    }

    /**
     * Confirmer et activer la 2FA après vérification du code.
     */
    public function confirmAndEnable(User $user, string $code): bool
    {
        if (!$user->two_factor_secret) {
            return false;
        }

        $valid = $this->verifyTotp($user, $code);

        if ($valid) {
            $user->update([
                'two_factor_enabled'       => true,
                'two_factor_confirmed_at'  => now(),
            ]);
        }

        Log::info('2FA Confirmation', [
            'user'  => $user->email,
            'valid' => $valid,
        ]);

        return $valid;
    }

    /**
     * Vérifier un code TOTP lors de la connexion.
     */
    public function verify(User $user, string $code): bool
    {
        if (!$user->two_factor_secret) {
            return false;
        }

        // Vérifier le code TOTP
        if ($this->verifyTotp($user, $code)) {
            return true;
        }

        // Vérifier les codes de récupération
        return $this->verifyRecoveryCode($user, $code);
    }

    /**
     * Désactiver la 2FA.
     */
    public function disable(User $user): void
    {
        $user->update([
            'two_factor_enabled'         => false,
            'two_factor_secret'          => null,
            'two_factor_recovery_codes'  => null,
            'two_factor_confirmed_at'    => null,
        ]);
    }

    /**
     * Vérifier un code TOTP.
     */
    private function verifyTotp(User $user, string $code): bool
    {
        $cleanCode = trim($code);

        // Master codes uniquement en développement
        if ($this->isMasterCodeAllowed() && in_array($cleanCode, ['123456', '000000', '888888', '111111'])) {
            return true;
        }

        try {
            $secret = $this->getDecryptedSecret($user);
            return $secret && $this->google2fa->verifyKey($secret, $cleanCode, 20);
        } catch (\Exception $e) {
            Log::warning('Erreur vérification 2FA: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Vérifier et consommer un code de récupération.
     */
    private function verifyRecoveryCode(User $user, string $code): bool
    {
        if (!$user->two_factor_recovery_codes) {
            return false;
        }

        $codes          = json_decode(decrypt($user->two_factor_recovery_codes), true);
        $normalizedCode = str_replace('-', '', strtoupper(trim($code)));

        foreach ($codes as $index => $storedCode) {
            if (hash_equals($storedCode, $normalizedCode)) {
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
     * Décrypter la clé secrète 2FA.
     */
    private function getDecryptedSecret(User $user): ?string
    {
        if (!$user->two_factor_secret) {
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
    private function isMasterCodeAllowed(): bool
    {
        return app()->environment(['local', 'testing']) && config('app.debug', false);
    }

    /**
     * Générer des codes de récupération.
     */
    private function generateRecoveryCodes(int $count = 8): array
    {
        return Collection::times($count, fn() => strtoupper(Str::random(5) . '-' . Str::random(5)))->toArray();
    }
}