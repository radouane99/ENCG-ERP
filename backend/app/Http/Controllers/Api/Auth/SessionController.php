<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Mail\NewDeviceLoginAlertMail;
use App\Models\User;
use App\Services\Security\CryptoLedgerService;
use App\Support\AuthCookie;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\PersonalAccessToken;

class SessionController extends Controller
{
    public static function parseBrowserAndOs(string $ua): string
    {
        $lower = strtolower($ua);
        $os = match (true) {
            str_contains($lower, 'iphone') || str_contains($lower, 'ipad') => 'iOS',
            str_contains($lower, 'android') => 'Android',
            str_contains($lower, 'windows') => 'Windows',
            str_contains($lower, 'mac os') || str_contains($lower, 'macintosh') => 'macOS',
            str_contains($lower, 'linux') => 'Linux',
            default => 'OS Standard',
        };

        $browser = match (true) {
            str_contains($lower, 'edg/') => 'Edge',
            str_contains($lower, 'chrome/') && ! str_contains($lower, 'edg/') => 'Chrome',
            str_contains($lower, 'firefox/') => 'Firefox',
            str_contains($lower, 'safari/') && ! str_contains($lower, 'chrome/') => 'Safari',
            default => 'Navigateur Web',
        };

        return "{$browser} sur {$os}";
    }

    public static function computeDeviceFingerprint(Request $request): string
    {
        $ua = (string) $request->userAgent();
        $browserAndOs = self::parseBrowserAndOs($ua);
        $ip = (string) ($request->ip() ?? '127.0.0.1');
        $subnet = str_contains($ip, '.')
            ? implode('.', array_slice(explode('.', $ip), 0, 3)).'.0/24'
            : $ip;

        return substr(hash('sha256', "{$browserAndOs}|{$subnet}|{$ua}"), 0, 24);
    }

    public static function recordLoginEvent(User $user, Request $request, string $method, bool $remember = false): array
    {
        $key = "user_security_history:{$user->id}";
        $history = Cache::get($key, []);
        if (! is_array($history)) {
            $history = [];
        }

        $ua = (string) $request->userAgent();
        $device = str_contains(strtolower($ua), 'mobile') || str_contains(strtolower($ua), 'iphone') || str_contains(strtolower($ua), 'android')
            ? 'Appareil Mobile'
            : 'Ordinateur / Navigateur Web';
        $browserAndOs = self::parseBrowserAndOs($ua);
        $ipAddress = $request->ip() ?? '127.0.0.1';
        $fingerprint = self::computeDeviceFingerprint($request);

        $knownDevicesKey = "security_known_devices:user_{$user->id}";
        $knownDevices = Cache::get($knownDevicesKey, []);
        if (! is_array($knownDevices)) {
            $knownDevices = [];
        }

        $isNewDevice = (! empty($knownDevices) && ! isset($knownDevices[$fingerprint]))
            || (bool) $request->header('X-Simulate-New-Device', false);

        $knownDevices[$fingerprint] = [
            'fingerprint' => $fingerprint,
            'device' => $device,
            'browser_os' => $browserAndOs,
            'last_ip' => $ipAddress,
            'first_seen_at' => $knownDevices[$fingerprint]['first_seen_at'] ?? now()->toIso8601String(),
            'last_seen_at' => now()->toIso8601String(),
        ];
        Cache::put($knownDevicesKey, $knownDevices, now()->addDays(365));

        $event = [
            'id' => uniqid('sec_', true),
            'method' => $method,
            'device' => $device,
            'browser_os' => $browserAndOs,
            'device_fingerprint' => $fingerprint,
            'is_new_device' => $isNewDevice,
            'user_agent' => substr($ua, 0, 140) ?: 'Client API',
            'ip_address' => $ipAddress,
            'remember' => $remember,
            'session_duration' => $remember ? '30 jours (Remember Me)' : '8 heures (Standard)',
            'logged_in_at' => now()->toIso8601String(),
        ];

        array_unshift($history, $event);
        Cache::put($key, array_slice($history, 0, 20), now()->addDays(90));

        if ($isNewDevice && ! empty($user->email)) {
            try {
                $recipientName = trim(($user->first_name ?? '').' '.($user->last_name ?? '')) ?: ($user->name ?? 'Utilisateur ENCG Fès');
                Mail::to($user->email)->send(new NewDeviceLoginAlertMail(
                    $recipientName,
                    $device,
                    $browserAndOs,
                    $ipAddress,
                    strtoupper($method),
                    now()->format('d/m/Y à H:i')
                ));
            } catch (\Throwable) {
                // Non-blocking if mail transport is offline in local dev
            }
        }

        return $event;
    }

    private static function sudoCacheKey(User $user, Request $request): ?string
    {
        $token = $user->currentAccessToken();
        $session = $token instanceof PersonalAccessToken && $token->getKey() !== null
            ? 'token:'.$token->getKey()
            : ($request->hasSession() ? 'session:'.$request->session()->getId() : null);

        return $session === null ? null : "sudo_mode:user_{$user->id}:".hash('sha256', $session);
    }

    public static function hasActiveSudoMode(User $user, Request $request): bool
    {
        $key = self::sudoCacheKey($user, $request);
        $sudoData = $key ? Cache::get($key) : null;
        $headerToken = (string) $request->header('X-Sudo-Token', '');

        return is_array($sudoData) && $headerToken !== ''
            && isset($sudoData['sudo_token'])
            && hash_equals((string) $sudoData['sudo_token'], $headerToken);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $current = $user->currentAccessToken();
        $id = $current instanceof PersonalAccessToken ? $current->id : null;
        $key = self::sudoCacheKey($user, $request);
        $sudoData = $key ? Cache::get($key) : null;

        return response()->json([
            'data' => $user->tokens()
                ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
                ->latest('id')
                ->get()
                ->map(fn ($token) => [
                    'id' => $token->id,
                    'name' => $token->name,
                    'session_type' => $token->name === 'auth-token-remember' ? 'remember_30d' : 'standard_8h',
                    'created_at' => $token->created_at,
                    'last_used_at' => $token->last_used_at,
                    'expires_at' => $token->expires_at,
                    'is_current' => $token->id === $id,
                ]),
            'security_history' => Cache::get("user_security_history:{$user->id}", []),
            'known_devices' => array_values(Cache::get("security_known_devices:user_{$user->id}", [])),
            'passkey_available' => false,
            'passkeys' => array_values(Cache::get("user_passkeys:{$user->id}", [])),
            'sudo_mode' => [
                'active' => self::hasActiveSudoMode($user, $request),
                'expires_at' => $sudoData['expires_at'] ?? null,
            ],
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Cache::get("user_security_history:{$request->user()->id}", []),
        ]);
    }

    /**
     * Step-Up Authentication (Sudo Mode 10 minutes) pour les opérations sensibles.
     */
    public function confirmSudoMode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['nullable', 'string'],
            'otp_code' => ['nullable', 'string', 'size:6'],
        ]);

        $user = $request->user();
        $verified = false;

        if (! empty($validated['password']) && Hash::check($validated['password'], $user->password)) {
            $verified = true;
        } elseif (! empty($validated['otp_code'])) {
            $cachedOtp = Cache::get("auth_email_otp:{$user->id}") ?? Cache::get("auth_email_otp:user_{$user->id}");
            $otpHash = (string) ($cachedOtp['hash'] ?? $cachedOtp['code_hash'] ?? '');
            if (is_array($cachedOtp) && $otpHash !== '' && Hash::check($validated['otp_code'], $otpHash)) {
                $verified = true;
                Cache::forget("auth_email_otp:{$user->id}");
                Cache::forget("auth_email_otp:user_{$user->id}");
            }
        }

        if (! $verified) {
            return response()->json([
                'success' => false,
                'message' => 'Identifiants de re-vérification Sudo invalides.',
            ], 422);
        }

        $key = self::sudoCacheKey($user, $request);
        abort_unless($key, 403, 'Session non identifiable. Reconnectez-vous.');

        $expiresAt = now()->addMinutes(10);
        $sudoToken = 'sudo_'.bin2hex(random_bytes(20));
        $payload = [
            'user_id' => $user->id,
            'sudo_token' => $sudoToken,
            'confirmed_at' => now()->toIso8601String(),
            'expires_at' => $expiresAt->toIso8601String(),
            'ip_address' => $request->ip(),
        ];

        Cache::put($key, $payload, $expiresAt);

        return response()->json([
            'success' => true,
            'message' => 'Mode Sudo activé pour 10 minutes (opérations critiques déverrouillées).',
            'data' => [
                'sudo_verified' => true,
                'sudo_token' => $sudoToken,
                'expires_at' => $payload['expires_at'],
            ],
        ]);
    }

    public function sudoStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        $key = self::sudoCacheKey($user, $request);
        $sudoData = $key ? Cache::get($key) : null;

        return response()->json([
            'success' => true,
            'data' => [
                'sudo_verified' => self::hasActiveSudoMode($user, $request),
                'expires_at' => $sudoData['expires_at'] ?? null,
            ],
        ]);
    }

    /**
     * WebAuthn / Passkey (FIDO2) — Générer le challenge d'enregistrement biométrique.
     */
    public function passkeyRegisterOptions(Request $request): JsonResponse
    {
        // Fail closed until standards-compliant WebAuthn assertion and attestation verification is installed.
        return response()->json([
            'success' => false,
            'code' => 'PASSKEY_UNAVAILABLE',
            'message' => 'Connexion Passkey temporairement indisponible. Utilisez votre mot de passe ou le code OTP.',
        ], 503);
    }

    /**
     * WebAuthn / Passkey (FIDO2) — Enregistrer une clé biométrique (TouchID / FaceID / Windows Hello / YubiKey).
     */
    public function registerPasskey(Request $request): JsonResponse
    {
        // Fail closed until standards-compliant WebAuthn assertion and attestation verification is installed.
        return response()->json([
            'success' => false,
            'code' => 'PASSKEY_UNAVAILABLE',
            'message' => 'Connexion Passkey temporairement indisponible. Utilisez votre mot de passe ou le code OTP.',
        ], 503);
    }

    public function listPasskeys(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => array_values(Cache::get("user_passkeys:{$request->user()->id}", [])),
        ]);
    }

    public function revokePasskey(Request $request, string $credentialId): JsonResponse
    {
        $user = $request->user();
        $userPasskeys = Cache::get("user_passkeys:{$user->id}", []);
        $lookup = Cache::get("passkey_lookup:{$credentialId}");
        abort_unless(is_array($userPasskeys) && isset($userPasskeys[$credentialId])
            && is_array($lookup) && (int) ($lookup['user_id'] ?? 0) === (int) $user->id, 404);
        if (isset($userPasskeys[$credentialId])) {
            unset($userPasskeys[$credentialId]);
            Cache::put("user_passkeys:{$user->id}", $userPasskeys, now()->addYears(2));
        }
        Cache::forget("passkey_lookup:{$credentialId}");

        return response()->json([
            'success' => true,
            'message' => 'Passkey biométrique révoquée.',
        ]);
    }

    /**
     * WebAuthn / Passkey — Générer le challenge d'authentification sans mot de passe.
     */
    public function passkeyLoginOptions(Request $request): JsonResponse
    {
        // Fail closed until standards-compliant WebAuthn assertion and attestation verification is installed.
        return response()->json([
            'success' => false,
            'code' => 'PASSKEY_UNAVAILABLE',
            'message' => 'Connexion Passkey temporairement indisponible. Utilisez votre mot de passe ou le code OTP.',
        ], 503);
    }

    /**
     * WebAuthn / Passkey — Connexion biométrique directe.
     */
    public function loginWithPasskey(Request $request): JsonResponse
    {
        // Fail closed until standards-compliant WebAuthn assertion and attestation verification is installed.
        return response()->json([
            'success' => false,
            'code' => 'PASSKEY_UNAVAILABLE',
            'message' => 'Connexion Passkey temporairement indisponible. Utilisez votre mot de passe ou le code OTP.',
        ], 503);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $token = $request->user()->tokens()->findOrFail($id);
        $current = $request->user()->currentAccessToken();
        abort_if($current instanceof PersonalAccessToken && $token->id === $current->id, 409, 'Utilisez Déconnexion pour fermer la session actuelle.');
        $token->delete();

        return response()->json(['message' => 'Session révoquée.']);
    }

    public function others(Request $request): JsonResponse
    {
        $current = $request->user()->currentAccessToken();
        abort_unless($current instanceof PersonalAccessToken, 409, 'Session actuelle non identifiable.');
        $count = $request->user()->tokens()->where('id', '!=', $current->id)->delete();

        return response()->json(['message' => 'Les autres sessions ont été fermées.', 'revoked' => $count]);
    }

    /**
     * Portail public de vérification anti-fraude des documents officiels signés HMAC-SHA256.
     */
    public function verifyPublicOfficialDocument(string $code, CryptoLedgerService $ledger): JsonResponse
    {
        $record = $ledger->verifyOfficialDocument($code);

        if (! $record) {
            return response()->json([
                'success' => false,
                'verified' => false,
                'message' => 'Code ou signature cryptographique introuvable ou non authentique.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'verified' => true,
            'data' => $record,
        ]);
    }

    /**
     * Bouton d'Urgence "Panic Lock / Gel Instantané du Compte" (Self-Service Account Freeze).
     */
    public function emergencyLockdown(Request $request): JsonResponse
    {
        $user = $request->user();
        $revokedTokensCount = $user->tokens()->count();
        $user->tokens()->delete();

        Cache::forget("sudo_mode:user_{$user->id}");
        Cache::forget("auth_email_otp:{$user->id}");
        Cache::forget("auth_email_otp:user_{$user->id}");

        self::recordLoginEvent($user, $request, 'emergency_lockdown', false);

        return response()->json([
            'success' => true,
            'message' => 'Verrouillage d\'urgence exécuté : toutes vos sessions actives et jetons ont été révoqués immédiatement.',
            'data' => [
                'revoked_sessions_count' => $revokedTokensCount,
                'locked_at' => now()->toIso8601String(),
            ],
        ])->withCookie(AuthCookie::forget());
    }

    /**
     * Vérifier un Badge Campus Numérique Dynamique (TOTP Anti-Capture d'Écran 60s).
     */
    public function verifyDynamicCampusPass(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_payload' => ['required', 'string'],
        ]);

        $parts = explode('|', trim($validated['qr_payload']));
        if (count($parts) !== 4 || $parts[0] !== 'ENCG-PASS') {
            return response()->json([
                'success' => false,
                'valid' => false,
                'message' => 'Format de badge numérique invalide.',
            ], 422);
        }

        [, $studentNumber, $timeStepStr, $totpCode] = $parts;
        $timeStep = (int) $timeStepStr;
        $currentStep = intdiv(time(), 60);

        // Accepter uniquement la fenêtre de 60s courante ou immédiatement précédente (rejette les captures d'écran anciennes)
        if (abs($currentStep - $timeStep) > 1) {
            return response()->json([
                'success' => false,
                'valid' => false,
                'code' => 'SCREENSHOT_EXPIRED',
                'message' => 'Ce QR Code dynamique a expiré (plus de 60 secondes). Les captures d\'écran ne sont pas autorisées.',
            ], 422);
        }

        $expectedCode = strtoupper(substr(
            hash_hmac('sha256', "CAMPUS-PASS:{$studentNumber}:{$timeStep}", (string) config('app.key', 'encg-secret')),
            0,
            12
        ));

        if (! hash_equals($expectedCode, strtoupper($totpCode))) {
            return response()->json([
                'success' => false,
                'valid' => false,
                'message' => 'Signature cryptographique TOTP du badge invalide.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'valid' => true,
            'message' => 'Badge Campus ENCG Fès authentique et actif (TOTP 60s vérifié).',
            'data' => [
                'student_number' => $studentNumber,
                'time_step' => $timeStep,
                'verified_at' => now()->toIso8601String(),
            ],
        ]);
    }
}
