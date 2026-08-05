<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Mail\ResetPasswordMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    /**
     * Envoyer le lien de réinitialisation.
     */
    public function sendResetLinkEmail(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return $this->genericResetResponse();
        }

        $token = Str::random(60);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => Hash::make($token), 'created_at' => Carbon::now()]
        );

        $resetUrl = config('app.frontend_url', 'http://localhost:5173') . '/reset-password?token=' . $token . '&email=' . urlencode($request->email);

        Mail::to($request->email)->send(new ResetPasswordMail($resetUrl));

        return $this->genericResetResponse();
    }

    /**
     * Réinitialiser le mot de passe.
     */
    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'token'    => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $resetRecord = DB::table('password_reset_tokens')->where('email', $request->email)->first();

        if (!$resetRecord || !Hash::check($request->token, $resetRecord->token)) {
            return response()->json(['success' => false, 'message' => 'Token invalide ou expiré.'], 400);
        }

        if (Carbon::parse($resetRecord->created_at)->addMinutes(60)->isPast()) {
            return response()->json(['success' => false, 'message' => 'Token expiré.'], 400);
        }

        try {
            $user = User::where('email', $request->email)->first();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Token invalide ou expiré.'], 400);
            }

            $user->password = $request->password; // Cast 'hashed' dans le modèle
            $user->save();

            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            return response()->json(['success' => true, 'message' => 'Mot de passe réinitialisé avec succès.']);
        } catch (\Throwable $e) {
            Log::error('Reset password error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
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