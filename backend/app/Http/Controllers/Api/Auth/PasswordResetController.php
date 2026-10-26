<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Mail\ResetPasswordMail;
use App\Models\User;
use App\Support\AuthCookie;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class PasswordResetController extends Controller
{
    /**
     * Envoyer le lien de réinitialisation.
     */
    public function sendResetLinkEmail(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $request->merge(['email' => strtolower(trim($request->email))]);
        $user = User::where('email', $request->email)->first();
        if (! $user || ! $user->is_active) {
            return $this->genericResetResponse();
        }

        $token = Str::random(60);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => Hash::make($token), 'created_at' => Carbon::now()]
        );

        $resetUrl = config('app.frontend_url', 'http://localhost:5173').'/reset-password?token='.$token.'&email='.urlencode($request->email);

        try {
            Mail::to($request->email)->send(new ResetPasswordMail($resetUrl));
        } catch (\Throwable $e) {
            report($e);
        } // Keep the same response for known and unknown accounts.

        return $this->genericResetResponse();
    }

    /**
     * Réinitialiser le mot de passe.
     */
    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $email = strtolower(trim($request->email));
        try {
            $changed = DB::transaction(function () use ($request, $email) {
                $user = User::where('email', $email)->lockForUpdate()->first();
                $record = DB::table('password_reset_tokens')->where('email', $email)->lockForUpdate()->first();
                if (! $user || ! $user->is_active || ! $record || Carbon::parse($record->created_at)->addMinutes(60)->isPast() || ! Hash::check($request->token, $record->token)) {
                    return false;
                }
                $user->forceFill(['password' => $request->password, 'must_change_password' => false, 'remember_token' => Str::random(60)])->save();
                $user->tokens()->delete();
                DB::table('password_reset_tokens')->where('email', $email)->delete();

                return true;
            });
            if (! $changed) {
                return response()->json(['success' => false, 'message' => 'Token invalide ou expiré.'], 400);
            }

            return response()->json(['success' => true, 'message' => 'Mot de passe réinitialisé. Reconnectez-vous ; les anciennes sessions ont été fermées.'])->withCookie(AuthCookie::forget());
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['success' => false, 'message' => 'Réinitialisation indisponible. Réessayez plus tard.'], 500);
        }
    }

    /**
     * Réponse générique pour ne pas divulguer l'existence d'un compte.
     */
    private function genericResetResponse(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Si ce compte existe, un lien de réinitialisation sera envoyé.',
        ]);
    }
}
