<?php

declare(strict_types=1);

namespace App\Presentation\Api\Controllers\Auth;

use App\Domain\Auth\Services\RegisterUserService;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Application;
use App\Models\Student;
use App\Models\User;
use App\Services\LoginChallengeService;
use App\Services\TwoFactorAuthService;
use App\Support\AuthCookie;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

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
            'password' => 'required|string|max:4096',
            'remember' => 'sometimes|boolean',
        ]);

        $request->merge(['email' => strtolower(trim($request->email))]);

        $user = User::with('roles', 'permissions')->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Ces identifiants ne correspondent à aucun compte.'],
            ]);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Votre compte a été désactivé.'], 403);
        }

        if ($user->two_factor_enabled) {
            return response()->json(['data' => app(LoginChallengeService::class)->create($user, $request->boolean('remember'))])->withCookie(AuthCookie::forget());
        }

        $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;

        event(new Login('sanctum', $user, false));

        return $this->authenticatedResponse($request, $user, $token);
    }

    /**
     * Vérification 2FA.
     */
    public function verifyTwoFactor(Request $request): JsonResponse
    {
        $request->validate([
            'challenge_token' => 'required|string|max:128',
            'code' => 'required|string|max:32',
        ]);

        $result = app(LoginChallengeService::class)->verify($request->challenge_token, $request->code);
        if (! $result) {
            return response()->json(['message' => 'Code 2FA invalide ou expiré.'], 422);
        }
        $user = $result['user'];
        $request->merge(['remember' => $result['remember']]);

        $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;
        event(new Login('sanctum', $user, false));

        return $this->authenticatedResponse($request, $user, $token);
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
        $current = $request->user()?->currentAccessToken();
        if ($current instanceof PersonalAccessToken) {
            $current->delete();
        }

        return response()->json(['message' => 'Déconnexion réussie.'])
            ->withCookie(AuthCookie::forget());
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
            'campaign_id' => 'nullable|integer',
        ]);

        try {
            $user = $this->registerUserService->registerUser($validated, $request->ip());
            $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;

            return $this->authenticatedResponse($request, $user, $token, 'Inscription réussie.');
        } catch (ValidationException $e) {
            throw $e;
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
        $request->validate(['password' => 'required|string']);
        abort_unless(Hash::check($request->password, $user->password), 422, 'Mot de passe incorrect.');
        abort_if($user->two_factor_enabled, 409, 'Désactivez la 2FA existante avant de la reconfigurer.');

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

        $this->revokeOtherTokens($request);

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
        abort_if($request->user()->two_factor_required, 403, 'La 2FA est obligatoire pour ce compte. Contactez l’administration en cas de perte du téléphone.');
        $request->validate(['password' => 'required|string']);

        if (! Hash::check($request->password, $request->user()->password)) {
            return response()->json(['message' => 'Mot de passe incorrect.'], 422);
        }

        $request->validate(['code' => 'required|string|max:32']);
        abort_unless($this->twoFactorService->verify($request->user(), $request->code), 422, 'Code 2FA invalide.');
        $this->twoFactorService->disable($request->user());
        $this->revokeOtherTokens($request);

        return response()->json([
            'success' => true,
            'message' => '2FA désactivée.',
        ]);
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

        $user->tokens()->delete();
        $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;

        return $this->authenticatedResponse($request, $user, $token, 'Mot de passe mis à jour. Les anciennes sessions ont été fermées.');
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
                $cinExists = User::where('cin', $cin)->exists()
                    || Student::query()->whereCin($cin)->exists();
            }
        }

        return response()->json([
            'cne_available' => ! $cneExists,
            'cin_available' => ! $cinExists,
            'is_pre_admitted' => $isPreAdmitted || $cneExists || $cinExists,
            'message' => $isPreAdmitted ? 'Candidat pré-admis TAFEM identifié.' : 'CNE et CNIE valides.',
        ]);
    }

    private function revokeOtherTokens(Request $request): void
    {
        $token = $request->user()->currentAccessToken();
        $id = $token instanceof PersonalAccessToken ? $token->id : null;
        $request->user()->tokens()->when($id, fn ($q) => $q->where('id', '!=', $id))->delete();
    }

    private function authenticatedResponse(Request $request, User $user, string $token, ?string $message = null): JsonResponse
    {
        $data = [
            'requires_two_factor' => false,
            'user' => $this->buildUserData($user),
        ];

        if (strtolower((string) $request->header('X-Client')) === 'mobile') {
            $data['token'] = $token;
        }

        $payload = ['data' => $data];
        if ($message !== null) {
            $payload['message'] = $message;
        }

        return AuthCookie::attach(response()->json($payload), $token, $request->boolean('remember'));
    }

    private function buildUserData(User $user): array
    {
        return (new UserResource($user))->resolve();
    }
}
