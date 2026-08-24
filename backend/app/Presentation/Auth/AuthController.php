<?php

declare(strict_types=1);

namespace App\Presentation\Api\Controllers\Auth;

use App\Domain\Auth\Services\RegisterUserService;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Student;
use App\Models\User;
use App\Services\TwoFactorAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function __construct(
        private TwoFactorAuthService $twoFactorService,
        private RegisterUserService $registerUserService
    ) {}

    /**
     * Connexion.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::with('roles', 'permissions')->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Ces identifiants ne correspondent à aucun compte.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Votre compte a été désactivé.'], 403);
        }

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // 2FA pour admins
        if ($user->two_factor_enabled && $user->hasAnyRole(['super-admin', 'institution-admin', 'director'])) {
            $challengeToken = Str::uuid()->toString();
            Cache::put('2fa_challenge_' . $challengeToken, $user->id, now()->addMinutes(10));

            return response()->json([
                'data' => [
                    'requires_two_factor'          => true,
                    'two_factor_challenge_token'   => $challengeToken,
                ],
            ]);
        }

        $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;

        event(new \Illuminate\Auth\Events\Login('sanctum', $user, false));

        return response()->json([
            'data' => [
                'requires_two_factor' => false,
                'token'               => $token,
                'user'                => $this->buildUserData($user),
            ],
        ]);
    }

    /**
     * Vérification 2FA.
     */
    public function verifyTwoFactor(Request $request): JsonResponse
    {
        $request->validate([
            'challenge_token' => 'required|string',
            'code'            => 'required|string',
        ]);

        $userId = Cache::get('2fa_challenge_' . $request->challenge_token);
        if (!$userId) {
            return response()->json(['message' => 'Session 2FA expirée ou invalide.'], 401);
        }

        $user = User::with('roles', 'permissions')->find($userId);
        if (!$user) {
            return response()->json(['message' => 'Utilisateur introuvable.'], 404);
        }

        if (!$this->twoFactorService->verify($user, $request->code)) {
            return response()->json(['message' => 'Code 2FA invalide ou expiré.'], 422);
        }

        Cache::forget('2fa_challenge_' . $request->challenge_token);

        $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;

        return response()->json([
            'data' => [
                'requires_two_factor' => false,
                'token'               => $token,
                'user'                => $this->buildUserData($user),
            ],
        ]);
    }

    /**
     * Profil connecté.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->buildUserData($request->user())]);
    }

    /**
     * Déconnexion.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    /**
     * Inscription.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name'  => 'required|string|max:255',
            'last_name'   => 'required|string|max:255',
            'email'       => 'required|email|max:255',
            'password'    => 'required|string|min:8',
            'cne'         => 'required|string|max:255',
            'cin'         => 'nullable|string|max:255',
        ]);

        try {
            $user  = $this->registerUserService->registerUser($validated, $request->ip());
            $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;

            return response()->json([
                'message' => 'Inscription réussie.',
                'data'    => [
                    'requires_two_factor' => false,
                    'token'               => $token,
                    'user'                => $this->buildUserData($user),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'inscription.'], 500);
        }
    }

    /**
     * Configurer 2FA.
     */
    public function setup2FA(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasAnyRole(['super-admin', 'institution-admin', 'director'])) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $setupData = $this->twoFactorService->generateSetupData($user);

        return response()->json([
            'qr_code_url'    => $setupData['qr_code_url'],
            'secret'         => $setupData['secret'],
            'recovery_codes' => $setupData['recovery_codes'],
            'message'        => 'Scannez le QR code avec Google Authenticator ou Authy.',
        ]);
    }

    /**
     * Confirmer 2FA.
     */
    public function confirm2FA(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string|size:6']);

        $confirmed = $this->twoFactorService->confirmAndEnable($request->user(), $request->code);

        if (!$confirmed) {
            return response()->json(['message' => 'Code incorrect.'], 422);
        }

        return response()->json([
            'success' => true,
            'message' => '2FA activée avec succès.',
        ]);
    }

    /**
     * Désactiver 2FA.
     */
    public function disable2FA(Request $request): JsonResponse
    {
        $request->validate(['password' => 'required|string']);

        if (!Hash::check($request->password, $request->user()->password)) {
            return response()->json(['message' => 'Mot de passe incorrect.'], 422);
        }

        $this->twoFactorService->disable($request->user());

        return response()->json([
            'success' => true,
            'message' => '2FA désactivée.',
        ]);
    }

    /**
     * Redirection Google OAuth.
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Callback Google OAuth.
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            $user = User::firstOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name'     => $googleUser->getName(),
                    'password' => bcrypt(Str::random(16)),
                ]
            );

            $token = $user->createToken('Personal Access Token')->plainTextToken;

            return redirect()->to(config('app.frontend_url', 'http://localhost:5173') . '/auth/callback?token=' . $token);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur Google.'], 500);
        }
    }

    /**
     * Vérifier disponibilité CNE/CIN.
     */
    public function checkCneAvailability(Request $request): JsonResponse
    {
        $cne = strtoupper(trim((string) $request->query('cne', '')));
        $cin = strtoupper(trim((string) $request->query('cin', '')));

        $application = Application::where(function ($q) use ($cne, $cin) {
            if ($cne) $q->where('cne', $cne);
            if ($cin) $q->orWhere('cin', $cin);
        })->first();

        $cneExists = $cinExists = $isPreAdmitted = false;

        if ($application) {
            $cneExists = $cinExists = true;
            $isPreAdmitted = in_array(strtolower($application->status ?? ''), ['accepted', 'admis', 'valide', 'admis_tafem', 'liste_principale', 'submitted']);
        } else {
            if ($cne) $cneExists = Student::where('cne', $cne)->exists();
            if ($cin) $cinExists = Student::where('cin', $cin)->exists() || User::where('cin', $cin)->exists();
        }

        return response()->json([
            'cne_available'   => true,
            'cin_available'   => true,
            'is_pre_admitted' => $isPreAdmitted || $cneExists || $cinExists,
            'cne'             => $cne,
            'cin'             => $cin,
            'candidate_name'  => $application ? trim(($application->first_name ?? '') . ' ' . ($application->last_name ?? '')) : null,
            'message'         => $isPreAdmitted ? '🟢 Candidat Pré-Admis TAFEM identifié.' : '✅ CNE et CNIE valides.',
        ]);
    }

    /**
     * Construit les données utilisateur pour l'API.
     */
    private function buildUserData(User $user): array
    {
        $user->loadMissing('roles', 'permissions');

        return [
            ...$user->toArray(),
            'roles'       => $user->roles->pluck('name')->toArray(),
            'permissions' => $user->permissions->pluck('name')->toArray(),
        ];
    }
}