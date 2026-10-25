<?php

namespace App\Actions\Admission;

use App\Models\Application;
use App\Models\User;
use App\Services\Admissions\AdmissionNotificationService;
use App\Support\AdmissionAccess;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class ActivateCandidateAction
{
    public function issue(Application $app): void
    {
        abort_unless($app->contact_verified_at && filter_var($app->email, FILTER_VALIDATE_EMAIL)
            && ! str_ends_with(strtolower($app->email), '@candidat.tafem.ma'), 422, 'Le service admissions doit vérifier un contact personnel avant activation.');
        DB::transaction(function () use ($app) {
            Application::whereKey($app->id)->lockForUpdate()->firstOrFail();
            DB::table('admission_activations')->where('application_id', $app->id)->whereNull('used_at')->update(['used_at' => now()]);
            $token = Str::random(64);
            DB::table('admission_activations')->insert(['application_id' => $app->id, 'token_hash' => hash('sha256', $token),
                'email' => $app->email, 'expires_at' => now()->addMinutes(30), 'created_at' => now(), 'updated_at' => now()]);
            app(AdmissionNotificationService::class)->queue($app, 'activation', $token);
            app(ManageDossierAction::class)->event($app, 'activation_requested');
        });
    }

    public function redeem(string $token, string $password): User
    {
        return DB::transaction(function () use ($token, $password) {
            $grant = DB::table('admission_activations')->where('token_hash', hash('sha256', $token))->lockForUpdate()->first();
            abort_unless($grant && ! $grant->used_at && now()->lessThan($grant->expires_at), 422, 'Lien expiré ou déjà utilisé. Demandez un nouveau lien.');
            $app = Application::whereKey($grant->application_id)->lockForUpdate()->firstOrFail();
            AdmissionAccess::campaignOpen($app);
            // Never change the password or contact of a pre-existing personal account through this flow.
            $existing = User::withTrashed()->where('email', $grant->email)->first();
            if ($existing && $existing->id !== $app->owner_user_id) {
                throw ValidationException::withMessages(['email' => 'Un compte personnel existe déjà. Connectez-vous et demandez un rattachement au service admissions.']);
            }
            $owner = $app->owner_user_id ? User::findOrFail($app->owner_user_id) : null;
            abort_if($owner && ! $owner->is_active, 403, 'Compte désactivé. Contactez l’administrateur des comptes.');
            abort_if(User::withTrashed()->where('cin', $app->cin)->when($owner, fn ($q) => $q->where('id', '!=', $owner->id))->exists(), 409, 'Une identité existe déjà. Le service admissions doit rapprocher les comptes.');
            if ($owner && ! str_ends_with(strtolower($owner->email), '@candidat.tafem.ma')) {
                throw ValidationException::withMessages(['email' => 'Votre compte est déjà activé. Utilisez la connexion ou la récupération de mot de passe.']);
            }
            $attrs = ['name' => trim($app->first_name.' '.$app->last_name), 'first_name' => $app->first_name,
                'last_name' => $app->last_name, 'email' => $grant->email,
                'cin' => $app->cin, 'institution_id' => $app->campaign->institution_id,
                'password' => Hash::make($password), 'must_change_password' => false, 'is_active' => true];
            if ($owner) {
                $owner->forceFill($attrs)->save();
                $user = $owner;
            } else {
                $user = User::provision($attrs);
            }
            $user->forceFill(['email_verified_at' => now()])->save();
            $user->assignRole(Role::findOrCreate('student', 'sanctum'));
            $app->update(['owner_user_id' => $user->id, 'version' => $app->version + 1]);
            DB::table('admission_activations')->where('id', $grant->id)->update(['used_at' => now()]);
            app(ManageDossierAction::class)->event($app, 'activated');

            return $user;
        });
    }
}
