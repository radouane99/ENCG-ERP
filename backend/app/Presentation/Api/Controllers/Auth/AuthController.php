<?php

declare(strict_types=1);

namespace App\Presentation\Api\Controllers\Auth;

use App\Domain\Auth\Services\RegisterUserService;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Application;
use App\Models\Student;
use App\Models\User;
use App\Services\TwoFactorAuthService;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
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
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::with('roles', 'permissions')->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Ces identifiants ne correspondent à aucun compte.'],
            ]);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Votre compte a été désactivé.'], 403);
        }

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // 2FA pour admins
        if ($user->two_factor_enabled && $user->hasAnyRole(['super-admin', 'institution-admin', 'director'])) {
            $challengeToken = Str::uuid()->toString();
            Cache::put('2fa_challenge_'.$challengeToken, $user->id, now()->addMinutes(10));

            return response()->json([
                'data' => [
                    'requires_two_factor' => true,
                    'two_factor_challenge_token' => $challengeToken,
                ],
            ]);
        }

        $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;

        event(new Login('sanctum', $user, false));

        return response()->json([
            'data' => [
                'requires_two_factor' => false,
                'token' => $token,
                'user' => $this->buildUserData($user),
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
            'code' => 'required|string',
        ]);

        $userId = Cache::get('2fa_challenge_'.$request->challenge_token);
        if (! $userId) {
            return response()->json(['message' => 'Session 2FA expirée ou invalide.'], 401);
        }

        $user = User::with('roles', 'permissions')->find($userId);
        if (! $user) {
            return response()->json(['message' => 'Utilisateur introuvable.'], 404);
        }

        if (! $this->twoFactorService->verify($user, $request->code)) {
            return response()->json(['message' => 'Code 2FA invalide ou expiré.'], 422);
        }

        Cache::forget('2fa_challenge_'.$request->challenge_token);

        $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;

        return response()->json([
            'data' => [
                'requires_two_factor' => false,
                'token' => $token,
                'user' => $this->buildUserData($user),
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
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => ['required', 'confirmed', Password::defaults()],
            'cne' => 'required|string|max:255',
            'cin' => 'nullable|string|max:255',
        ]);

        try {
            $user = $this->registerUserService->registerUser($validated, $request->ip());
            $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;

            return response()->json([
                'message' => 'Inscription réussie.',
                'data' => [
                    'requires_two_factor' => false,
                    'token' => $token,
                    'user' => $this->buildUserData($user),
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
        if (! $user->hasAnyRole(['super-admin', 'institution-admin', 'director'])) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $setupData = $this->twoFactorService->generateSetupData($user);

        return response()->json([
            'qr_code_url' => $setupData['qr_code_url'],
            'secret' => $setupData['secret'],
            'recovery_codes' => $setupData['recovery_codes'],
            'message' => 'Scannez le QR code avec Google Authenticator ou Authy.',
        ]);
    }

    /**
     * Confirmer 2FA.
     */
    public function confirm2FA(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string|size:6']);

        $confirmed = $this->twoFactorService->confirmAndEnable($request->user(), $request->code);

        if (! $confirmed) {
            return response()->json(['message' => 'Code incorrect.'], 422);
        }

        return response()->json([
            'success' => true,
            'message' => '2FA activée avec succès.',
        ]);
    }

    /**
     * Step-up 2FA for sensitive authenticated actions.
     */
    public function stepUpTwoFactor(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string|size:6']);

        $user = $request->user();
        if (! $user?->two_factor_enabled) {
            return response()->json([
                'message' => 'Activez la 2FA dans votre profil avant cette opération.',
                'requires_2fa_setup' => true,
            ], 403);
        }

        if (! $this->twoFactorService->verify($user, $request->code)) {
            return response()->json(['message' => 'Code 2FA invalide.'], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Autorisation 2FA confirmée.',
        ]);
    }

    /**
     * Désactiver 2FA.
     */
    public function disable2FA(Request $request): JsonResponse
    {
        $request->validate(['password' => 'required|string']);

        if (! Hash::check($request->password, $request->user()->password)) {
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
        $frontend = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            $email = strtolower((string) $googleUser->getEmail());
            $domain = Str::after($email, '@');
            $allowed = array_map('strtolower', config('services.google.allowed_domains', []));

            if ($email === '' || $domain === '' || ! in_array($domain, $allowed, true)) {
                return redirect()->to($frontend.'/login?error=domain');
            }

            $user = User::where('email', $email)->first();
            if (! $user || ! $user->is_active) {
                return redirect()->to($frontend.'/login?error=unknown_account');
            }

            $user->update([
                'last_login_at' => now(),
            ]);

            $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;
            $code = Str::random(64);
            Cache::put('oauth_exchange_'.$code, $token, now()->addMinutes(2));

            return redirect()->to($frontend.'/auth/callback?code='.$code);
        } catch (\Exception $e) {
            return redirect()->to($frontend.'/login?error=google');
        }
    }

    /**
     * Changement de mot de passe obligatoire ou volontaire.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = $request->user();
        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'Mot de passe actuel incorrect.'], 422);
        }

        $user->forceFill([
            'password' => $validated['password'],
            'must_change_password' => false,
        ])->save();

        return response()->json(['message' => 'Mot de passe mis à jour.']);
    }

    /**
     * Vérifier disponibilité CNE/CIN.
     */
    public function checkCneAvailability(Request $request): JsonResponse
    {
        $cne = strtoupper(trim((string) $request->query('cne', '')));
        $cin = strtoupper(trim((string) $request->query('cin', '')));

        $application = Application::where(function ($q) use ($cne, $cin) {
            if ($cne) {
                $q->where('cne', $cne);
            }
            if ($cin) {
                $q->orWhere('cin', $cin);
            }
        })->first();

        $cneExists = $cinExists = $isPreAdmitted = false;

        if ($application) {
            $cneExists = $cinExists = true;
            $isPreAdmitted = in_array(strtolower($application->status ?? ''), ['accepted', 'admis', 'valide', 'admis_tafem', 'liste_principale', 'submitted']);
        } else {
            if ($cne) {
                $cneExists = Student::where('cne', $cne)->exists();
            }
            if ($cin) {
                $cinExists = Student::where('cin', $cin)->exists() || User::where('cin', $cin)->exists();
            }
        }

        return response()->json([
            'cne_available' => ! $cneExists,
            'cin_available' => ! $cinExists,
            'is_pre_admitted' => $isPreAdmitted || $cneExists || $cinExists,
            'message' => $isPreAdmitted ? 'Candidat pré-admis TAFEM identifié.' : 'CNE et CNIE valides.',
        ]);
    }

    /**
     * Échange un code OAuth Google à usage unique contre le jeton Sanctum.
     */
    public function exchangeGoogleCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:128',
        ]);

        $cacheKey = 'oauth_exchange_'.$validated['code'];
        $token = Cache::pull($cacheKey);

        if (! is_string($token) || $token === '') {
            return response()->json(['message' => 'Code d\'échange invalide ou expiré.'], 422);
        }

        return response()->json([
            'data' => [
                'token' => $token,
            ],
        ]);
    }

    private function buildUserData(User $user): array
    {
        return (new UserResource($user))->resolve();
    }
}
