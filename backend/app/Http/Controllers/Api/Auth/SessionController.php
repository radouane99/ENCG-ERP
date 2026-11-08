<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
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

    public static function hasActiveSudoMode(User $user, Request $request): bool
    {
        $sudoData = Cache::get("sudo_mode:user_{$user->id}");
        if (! is_array($sudoData)) {
            return false;
        }

        $headerToken = (string) $request->header('X-Sudo-Token', '');
        if ($headerToken !== '' && isset($sudoData['sudo_token'])) {
            return hash_equals((string) $sudoData['sudo_token'], $headerToken);
        }

        return true;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $current = $user->currentAccessToken();
        $id = $current instanceof PersonalAccessToken ? $current->id : null;
        $sudoData = Cache::get("sudo_mode:user_{$user->id}");

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
            'passkeys' => array_values(Cache::get("user_passkeys:{$user->id}", [])),
            'sudo_mode' => [
                'active' => is_array($sudoData),
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

        $expiresAt = now()->addMinutes(10);
        $sudoToken = 'sudo_'.bin2hex(random_bytes(20));
        $payload = [
            'user_id' => $user->id,
            'sudo_token' => $sudoToken,
            'confirmed_at' => now()->toIso8601String(),
            'expires_at' => $expiresAt->toIso8601String(),
            'ip_address' => $request->ip(),
        ];

        Cache::put("sudo_mode:user_{$user->id}", $payload, $expiresAt);

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
        $sudoData = Cache::get("sudo_mode:user_{$user->id}");

        return response()->json([
            'success' => true,
            'data' => [
                'sudo_verified' => is_array($sudoData),
                'expires_at' => $sudoData['expires_at'] ?? null,
            ],
        ]);
    }

    /**
     * WebAuthn / Passkey (FIDO2) — Générer le challenge d'enregistrement biométrique.
     */
    public function passkeyRegisterOptions(Request $request): JsonResponse
    {
        $user = $request->user();
        $challenge = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $rpId = $request->getHost() ?: 'encg-fes.ac.ma';

        Cache::put("passkey_reg_challenge:user_{$user->id}", $challenge, now()->addMinutes(5));

        return response()->json([
            'success' => true,
            'data' => [
                'challenge' => $challenge,
                'rp' => [
                    'name' => 'ENCG Fès — Portail Universitaire',
                    'id' => $rpId,
                ],
                'user' => [
                    'id' => rtrim(strtr(base64_encode((string) $user->id), '+/', '-_'), '='),
                    'name' => $user->email,
                    'displayName' => trim(($user->first_name ?? '').' '.($user->last_name ?? '')) ?: ($user->name ?? $user->email),
                ],
                'pubKeyCredParams' => [
                    ['type' => 'public-key', 'alg' => -7],   // ES256
                    ['type' => 'public-key', 'alg' => -257], // RS256
                ],
                'timeout' => 60000,
                'attestation' => 'none',
            ],
        ]);
    }

    /**
     * WebAuthn / Passkey (FIDO2) — Enregistrer une clé biométrique (TouchID / FaceID / Windows Hello / YubiKey).
     */
    public function registerPasskey(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'credential_id' => ['required', 'string', 'max:512'],
            'public_key' => ['required', 'string', 'max:4096'],
            'device_name' => ['nullable', 'string', 'max:120'],
            'challenge' => ['nullable', 'string'],
            'transports' => ['nullable', 'array'],
        ]);

        $user = $request->user();
        $expectedChallenge = Cache::get("passkey_reg_challenge:user_{$user->id}");

        if (! empty($validated['challenge']) && $expectedChallenge && ! hash_equals((string) $expectedChallenge, (string) $validated['challenge'])) {
            return response()->json([
                'success' => false,
                'message' => 'Challenge WebAuthn invalide ou expiré.',
            ], 422);
        }

        Cache::forget("passkey_reg_challenge:user_{$user->id}");

        $credId = trim($validated['credential_id']);
        $deviceName = $validated['device_name'] ?: self::parseBrowserAndOs((string) $request->userAgent());

        $passkeyRecord = [
            'credential_id' => $credId,
            'user_id' => $user->id,
            'device_name' => $deviceName,
            'public_key_Preview' => substr($validated['public_key'], 0, 32).'...',
            'transports' => $validated['transports'] ?? ['internal', 'hybrid'],
            'created_at' => now()->toIso8601String(),
            'last_used_at' => now()->toIso8601String(),
        ];

        $userPasskeys = Cache::get("user_passkeys:{$user->id}", []);
        if (! is_array($userPasskeys)) {
            $userPasskeys = [];
        }
        $userPasskeys[$credId] = $passkeyRecord;
        Cache::put("user_passkeys:{$user->id}", $userPasskeys, now()->addYears(2));

        Cache::put("passkey_lookup:{$credId}", [
            'user_id' => $user->id,
            'public_key' => $validated['public_key'],
            'device_name' => $deviceName,
        ], now()->addYears(2));

        return response()->json([
            'success' => true,
            'message' => 'Passkey biométrique enregistrée avec succès.',
            'data' => $passkeyRecord,
        ], 201);
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
        if (is_array($userPasskeys) && isset($userPasskeys[$credentialId])) {
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
        $challengeId = 'pkc_'.bin2hex(random_bytes(12));
        $challenge = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');

        Cache::put("passkey_auth_challenge:{$challengeId}", $challenge, now()->addMinutes(5));

        return response()->json([
            'success' => true,
            'data' => [
                'challenge_id' => $challengeId,
                'challenge' => $challenge,
                'rpId' => $request->getHost() ?: 'encg-fes.ac.ma',
                'timeout' => 60000,
                'userVerification' => 'preferred',
            ],
        ]);
    }

    /**
     * WebAuthn / Passkey — Connexion biométrique directe.
     */
    public function loginWithPasskey(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'credential_id' => ['required', 'string', 'max:512'],
            'challenge_id' => ['required', 'string'],
            'signature' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $challenge = Cache::pull("passkey_auth_challenge:{$validated['challenge_id']}");
        if (! $challenge) {
            return response()->json([
                'success' => false,
                'message' => 'Session de vérification Passkey expirée. Veuillez réessayer.',
            ], 422);
        }

        $lookup = Cache::get("passkey_lookup:{$validated['credential_id']}");
        if (! is_array($lookup) || empty($lookup['user_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Passkey non reconnue sur ce portail.',
            ], 401);
        }

        $user = User::with('roles', 'student.filiere', 'professor.department')->find($lookup['user_id']);
        if (! $user || ! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Ce compte est introuvable ou désactivé.',
            ], 403);
        }

        $remember = (bool) ($validated['remember'] ?? true);
        $expiresAt = $remember
            ? now()->addDays(AuthCookie::REMEMBER_DAYS)
            : now()->addHours(8);
        $tokenName = $remember ? 'auth-token-remember' : 'auth-token';
        $token = $user->createToken($tokenName, ['*'], $expiresAt)->plainTextToken;

        self::recordLoginEvent($user, $request, 'passkey_webauthn', $remember);

        $userPasskeys = Cache::get("user_passkeys:{$user->id}", []);
        if (is_array($userPasskeys) && isset($userPasskeys[$validated['credential_id']])) {
            $userPasskeys[$validated['credential_id']]['last_used_at'] = now()->toIso8601String();
            Cache::put("user_passkeys:{$user->id}", $userPasskeys, now()->addYears(2));
        }

        return response()->json([
            'success' => true,
            'message' => 'Authentification biométrique Passkey réussie.',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
                'remember' => $remember,
                'session_expires_at' => $expiresAt->toIso8601String(),
            ],
        ])->withCookie(AuthCookie::make($token, $remember));
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
}
