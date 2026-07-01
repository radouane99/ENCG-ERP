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

class AuthController extends Controller
{
    public function __construct(protected TwoFactorAuthService $twoFactorService) {}


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
            \Illuminate\Support\Facades\DB::beginTransaction();

            // 1. Create User
            $user = \App\Models\User::create([
                'name' => $validated['first_name'] . ' ' . $validated['last_name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'],
                'is_active' => true,
            ]);

            // 2. Find an active Admission Campaign or create a default one
            $campaign = \App\Models\AdmissionCampaign::where('status', 'open')->first();
            
            if (!$campaign) {
                // Get default institution and filiere (Tronc Commun or the chosen one)
                $institution = \App\Models\Institution::first();
                $academicYear = \App\Models\AcademicYear::where('is_current', true)->first();
                // Map filiere name to code (simple matching or default to TC)
                $filiereModel = \App\Models\Filiere::where('name', 'like', '%' . $validated['filiere'] . '%')->first() 
                                ?? \App\Models\Filiere::first();

                if ($institution && $academicYear && $filiereModel) {
                    $campaign = \App\Models\AdmissionCampaign::create([
                        'institution_id' => $institution->id,
                        'academic_year_id' => $academicYear->id,
                        'filiere_id' => $filiereModel->id,
                        'name' => 'Campagne d\'Admission ' . $academicYear->label,
                        'status' => 'open',
                        'open_date' => now(),
                        'close_date' => now()->addMonths(2),
                        'target_capacity' => 500,
                    ]);
                }
            }

            if ($campaign) {
                // 3. Create Application
                $application = \App\Models\Application::create([
                    'admission_campaign_id' => $campaign->id,
                    'reference_number' => 'ENCG-APP-' . date('Y') . '-' . strtoupper(uniqid()),
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'],
                    'cin' => $validated['cin'],
                    'cne' => $validated['cne'],
                    'birth_date' => $validated['birth_date'],
                    'bac_average' => $validated['bac_average'],
                    'bac_year' => $validated['bac_year'],
                    'bac_series' => $validated['bac_series'],
                    'status' => 'submitted',
                ]);
            }

            \Illuminate\Support\Facades\DB::commit();

            // Auto-login
            $user->update([
                'last_login_at' => now(),
                'last_login_ip' => $request->ip()
            ]);

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
            \Illuminate\Support\Facades\DB::rollBack();
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
}
