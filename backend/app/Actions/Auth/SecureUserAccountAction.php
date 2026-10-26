<?php

namespace App\Actions\Auth;

use App\Mail\ResetPasswordMail;
use App\Models\User;
use App\Services\TwoFactorAuthService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

final class SecureUserAccountAction
{
    public function execute(User $actor, User $target, array $data): User
    {
        abort_unless($actor->can('users.manage'), 403);
        app(ManageUserAccessAction::class)->assertManageable($actor, $target);
        abort_if($actor->id === $target->id, 422, 'Utilisez votre profil pour votre propre compte.');

        return DB::transaction(function () use ($actor, $target, $data) {
            $target = User::whereKey($target->id)->lockForUpdate()->firstOrFail();
            app(ManageUserAccessAction::class)->assertManageable($actor, $target);
            $operation = $data['operation'];
            if ($operation === 'suspend') {
                abort_if($target->hasAnyRole(['super-admin', 'super_admin']), 422, 'Un super administrateur ne peut pas être suspendu ici.');
                $target->forceFill(['is_active' => false])->save();
            } elseif ($operation === 'reactivate') {
                $target->forceFill(['is_active' => true])->save();
            } elseif ($operation === 'require_2fa') {
                $target->forceFill(['two_factor_required' => true])->save();
            } elseif ($operation === 'recover_2fa') {
                abort_unless($data['identity_verified'] ?? false, 422, 'Le contrôle d’identité est obligatoire.');
                app(TwoFactorAuthService::class)->disable($target);
                $target->forceFill(['two_factor_required' => true, 'must_change_password' => true])->save();
            } elseif ($operation === 'password_reset_link') {
                abort_unless($target->is_active, 422, 'Réactivez le compte avant de demander un lien.');
                $token = Str::random(60);
                DB::table('password_reset_tokens')->updateOrInsert(['email' => strtolower($target->email)], ['token' => Hash::make($token), 'created_at' => now()]);
                $url = rtrim(config('app.frontend_url'), '/').'/reset-password?token='.$token.'&email='.urlencode($target->email);
                Mail::to($target->email)->send(new ResetPasswordMail($url));
            }
            $revoked = $target->tokens()->delete();
            activity()->causedBy($actor)->performedOn($target)->withProperties([
                'operation' => $operation, 'reason' => $data['reason'],
                'identity_verified' => (bool) ($data['identity_verified'] ?? false), 'revoked_sessions' => $revoked,
            ])->log('account_security_changed');

            return $target->fresh('roles', 'permissions');
        });
    }
}
