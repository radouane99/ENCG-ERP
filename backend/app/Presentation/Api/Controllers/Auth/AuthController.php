<?php

declare(strict_types=1);

namespace App\Presentation\Api\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\TwoFactorAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

use App\Domain\Auth\Services\RegisterUserService;

class AuthController extends Controller
{
    public function __construct(
        protected TwoFactorAuthService $twoFactorService,
        protected RegisterUserService $registerUserService
    ) {}


    /**
     * POST /api/v1/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = \App\Models\User::with('roles', 'permissions')->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Ces identifiants ne correspondent \u00e0 aucun compte.'],
            ]);
        }

        if (isset($user->is_active) && !$user->is_active) {
            return response()->json(['message' => 'Votre compte a \u00e9t\u00e9 d\u00e9sactiv\u00e9.'], 403);
        }

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip()
        ]);

        // 🔒 2FA Check for admins
        if ($user->two_factor_enabled && $user->hasRole('admin')) {
            // Create a temporary challenge token (valid 10 min)
            $challengeToken = Str::uuid()->toString();
            Cache::put('2fa_challenge_' . $challengeToken, $user->id, now()->addMinutes(10));

            return response()->json([
                'data' => [
                    'requires_two_factor' => true,
                    'two_factor_challenge_token' => $challengeToken,
                    'user' => null,
                    'token' => null,
                ]
            ]);
        }

        $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;

        return response()->json([
            'data' => [
                'requires_two_factor' => false,
                'token'               => $token,
                'user'                => $this->buildUserData($user),
            ]
        ]);
    }

    /**
     * POST /api/v1/auth/two-factor/verify
     * Verify a TOTP code after login challenge.
     */
    public function verifyTwoFactor(Request $request): JsonResponse
    {
        $request->validate([
            'challenge_token' => 'required|string',
            'code' => 'required|string',
        ]);

        $userId = Cache::get('2fa_challenge_' . $request->challenge_token);

        if (!$userId) {
            return response()->json(['message' => 'Session 2FA expir\u00e9e ou invalide. Veuillez vous reconnecter.'], 401);
        }

        $user = \App\Models\User::with('roles', 'permissions')->find($userId);

        if (!$user) {
            return response()->json(['message' => 'Utilisateur introuvable.'], 404);
        }

        $valid = $this->twoFactorService->verify($user, $request->code);

        if (!$valid) {
            return response()->json(['message' => 'Code 2FA invalide ou expir\u00e9.'], 422);
        }

        // Consume challenge token
        Cache::forget('2fa_challenge_' . $request->challenge_token);

        $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;

        return response()->json([
            'data' => [
                'requires_two_factor' => false,
                'token' => $token,
                'user' => $this->buildUserData($user),
            ]
        ]);
    }


    /**
     * GET /api/v1/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json([
            'data' => $this->buildUserData($user)
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }
        
        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    /**
     * POST /api/v1/auth/register
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email|max:255',
            'password' => 'required|min:8',
            'cne' => 'required|string|max:255',
            'cin' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'birth_date' => 'required|date',
            'birth_city' => 'required|string|max:255',
            'father_name' => 'nullable|string|max:255',
            'father_cin' => 'nullable|string|max:255',
            'father_job' => 'nullable|string|max:255',
            'mother_name' => 'nullable|string|max:255',
            'mother_cin' => 'nullable|string|max:255',
            'mother_job' => 'nullable|string|max:255',
            'bac_type' => 'required|string|max:255',
            'bac_series' => 'required|string|max:255',
            'bac_average' => 'required|numeric|min:0|max:20',
            'bac_year' => 'required|numeric',
            'high_school_city' => 'required|string|max:255',
            'filiere' => 'required|string|max:255',
        ]);

        try {
            $user = $this->registerUserService->registerUser($validated, $request->ip());

            $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;

            return response()->json([
                'message' => 'Inscription réussie',
                'data' => [
                    'requires_two_factor' => false,
                    'token'               => $token,
                    'user'                => $this->buildUserData($user),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Une erreur est survenue lors de l\'inscription.',
            ], 500);
        }
    }

    /**
     * POST /api/v1/auth/two-factor/setup
     * Generate 2FA secret and QR code for the authenticated user (admin only).
     */
    public function setup2FA(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->hasRole('admin')) {
            return response()->json(['message' => 'Non autorisé. Réservé aux administrateurs.'], 403);
        }

        $setupData = $this->twoFactorService->generateSetupData($user);

        return response()->json([
            'qr_code_url'    => $setupData['qr_code_url'],
            'secret'         => $setupData['secret'],
            'recovery_codes' => $setupData['recovery_codes'],
            'message'        => 'Scannez le QR code avec votre application Google Authenticator ou Authy.',
        ]);
    }

    /**
     * POST /api/v1/auth/two-factor/confirm
     * Confirm 2FA setup by verifying the first TOTP code.
     */
    public function confirm2FA(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string|size:6']);

        $user = $request->user();
        $confirmed = $this->twoFactorService->confirmAndEnable($user, $request->code);

        if (!$confirmed) {
            return response()->json(['message' => 'Code incorrect. Vérifiez votre application d\'authentification.'], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Authentification à deux facteurs activée avec succès.',
        ]);
    }

    /**
     * DELETE /api/v1/auth/two-factor/disable
     * Disable 2FA for the authenticated user.
     */
    public function disable2FA(Request $request): JsonResponse
    {
        $request->validate(['password' => 'required|string']);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Mot de passe incorrect.'], 422);
        }

        $this->twoFactorService->disable($user);

        return response()->json([
            'success' => true,
            'message' => 'Authentification à deux facteurs désactivée.',
        ]);
    }

    /**
     * Build a consistent user data array for API responses.
     */
    private function buildUserData(\App\Models\User $user): array
    {
        $user->loadMissing('roles', 'permissions');
        $data = $user->toArray();
        $data['roles'] = $user->roles->pluck('name')->toArray();
        $data['permissions'] = $user->permissions->pluck('name')->toArray();
        return $data;
    }

    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirectToGoogle()
    {
        // Require laravel/socialite package installed
        return \Laravel\Socialite\Facades\Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = \Laravel\Socialite\Facades\Socialite::driver('google')->stateless()->user();
            
            // Check if user exists by email
            $user = \App\Models\User::where('email', $googleUser->getEmail())->first();

            if (!$user) {
                // Auto-register user (assuming student by default or require manual admin approval)
                $user = \App\Models\User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'password' => bcrypt(\Illuminate\Support\Str::random(16)), // Random password
                ]);
            }

            // Create Sanctum Token
            $tokenResult = $user->createToken('Personal Access Token');
            $token = $tokenResult->plainTextToken;

            // Redirect back to frontend with token
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return redirect()->to($frontendUrl . '/auth/callback?token=' . $token);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur lors de la connexion via Google.'], 500);
        }
    }
}
