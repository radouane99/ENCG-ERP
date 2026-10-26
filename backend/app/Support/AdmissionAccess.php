<?php

namespace App\Support;

use App\Models\AdmissionCampaign;
use App\Models\Application;
use App\Models\User;
use Illuminate\Http\Request;

final class AdmissionAccess
{
    public const REVIEW_ROLES = ['super-admin', 'admin', 'institution-admin', 'director', 'scolarite'];

    public static function staff(?User $user): bool
    {
        return $user && $user->hasAnyRole(self::REVIEW_ROLES);
    }

    public static function institution(Request $request): int
    {
        return (int) ($request->user()?->institution_id ?: config('erp.institution_id', 1));
    }

    public static function review(Request $request): void
    {
        abort_unless(self::staff($request->user()), 403, 'Accès réservé au service des admissions.');
    }

    public static function campaign(Request $request, bool $open = false): AdmissionCampaign
    {
        $q = AdmissionCampaign::where('institution_id', self::institution($request));
        if ($request->filled('campaign_id') || $request->filled('admission_campaign_id')) {
            $q->whereKey($request->input('campaign_id', $request->input('admission_campaign_id')));
        } else {
            $q->whereHas('institution')->where('status', 'open')->orderByDesc('id');
            if ($open) {
                $today = now(config('admissions.timezone'))->toDateString();
                $q->whereDate('open_date', '<=', $today)->whereDate('close_date', '>=', $today);
            }
        }
        $campaign = $q->firstOrFail();
        if ($open) {
            abort_unless($campaign->registrationState() === 'open', 422, 'La campagne est fermée.');
        }

        return $campaign;
    }

    public static function dossier(Request $request, bool $mutate = false, ?int $id = null): Application
    {
        $user = $request->user();
        if (! $user) {
            if (! $request->filled('cne') || ! $request->filled('cin')) {
                abort(422, 'Connectez-vous ou activez votre dossier. CNE et CIN sont requis pour la recherche.');
            }
            abort(403, 'Activez votre dossier ou connectez-vous pour accéder à ses données.');
        }
        $q = Application::whereHas('campaign', fn ($c) => $c->where('institution_id', self::institution($request)));
        if ($id || $request->filled('application_id')) {
            $q->whereKey($id ?? $request->integer('application_id'));
        } elseif ($request->filled('cne')) {
            $q->where('cne', strtoupper(trim($request->input('cne'))));
        } elseif ($request->filled('student_id') && self::staff($user)) {
            $q->where('student_id', $request->integer('student_id'));
        }
        if (! self::staff($user)) {
            $q->where('owner_user_id', $user->id);
        }
        $app = $q->latest('id')->firstOrFail();
        if ($mutate) {
            abort_if($app->dossier_status === 'approved', 403, 'Dossier validé : modification interdite.');
            self::campaignOpen($app);
        }

        return $app;
    }

    public static function campaignOpen(Application $app): void
    {
        $c = $app->campaign;
        abort_unless($c && $c->registrationState() === 'open', 422, 'La campagne est fermée.');
        self::invitationActive($app);
    }

    public static function invitationActive(Application $app): void
    {
        abort_if($app->eligibility === 'invitation_expired' || ($app->invitation_expires_at && now()->greaterThan($app->invitation_expires_at)), 422, 'Votre invitation a expiré. Contactez le service admissions.');
    }
}
