<?php

namespace App\Http\Controllers\Api;

use App\Actions\Admission\ActivateCandidateAction;
use App\Actions\Admission\ImportMinistryListAction;
use App\Actions\Admission\ManageDossierAction;
use App\Domain\Admission\AdmissionEntryRules;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admissions\SaveDossierRequest;
use App\Jobs\ProcessAdmissionOcrJob;
use App\Models\AcademicYear;
use App\Models\AdmissionCampaign;
use App\Models\Application;
use App\Models\Filiere;
use App\Models\Institution;
use App\Models\StudentDocument;
use App\Models\User;
use App\Services\Admission\PublicAdmissionCalendar;
use App\Services\Admissions\AdmissionNotificationService;
use App\Services\Ocr\AdmissionOcrPolicy;
use App\Support\AdmissionAccess;
use App\Support\AuthCookie;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AdmissionWorkflowController extends Controller
{
    public function publicCalendar(Request $request)
    {
        return response()->json(['data' => app(PublicAdmissionCalendar::class)->read((int) config('erp.institution_id', 1))])->header('Cache-Control', 'no-store, private');
    }

    public function __construct(private ManageDossierAction $action) {}

    public function campaigns(Request $request)
    {
        $q = AdmissionCampaign::where('institution_id', AdmissionAccess::institution($request));
        if (! AdmissionAccess::staff($request->user())) {
            $today = now(config('admissions.timezone'))->toDateString();
            $q->where('status', 'open')->whereDate('open_date', '<=', $today)->whereDate('close_date', '>=', $today);
        }

        return response()->json(['data' => $q->orderByDesc('id')->get(['id', 'name', 'open_date', 'close_date', 'academic_year_id', 'filiere_id', 'status', 'target_capacity', 'entry_route', 'entry_semester'])]);
    }

    public function ocrSettings(Request $request)
    {
        AdmissionAccess::review($request);
        $canManage = $request->user()->hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director']);
        $institution = Institution::findOrFail(AdmissionAccess::institution($request));
        if ($request->isMethod('put')) {
            abort_unless($canManage, 403);
            $data = $request->validate(['cloud_enabled' => 'required|boolean']);
            abort_if($data['cloud_enabled'] && ! AdmissionOcrPolicy::configured(), 422, 'Clé ou modèle du fournisseur non configuré sur le serveur.');
            DB::transaction(function () use ($institution, $data, $request) {
                $institution = Institution::whereKey($institution->id)->lockForUpdate()->firstOrFail();
                $settings = $institution->settings ?? [];
                $settings['admissions']['ocr_cloud_enabled'] = $data['cloud_enabled'];
                $institution->update(['settings' => $settings]);
                activity()->causedBy($request->user())->withProperties(['cloud_enabled' => $data['cloud_enabled']])->log('admission_ocr_policy_updated');
            });
        }

        return response()->json(['cloud_enabled' => AdmissionOcrPolicy::enabled($institution->id),
            'configured' => AdmissionOcrPolicy::configured(), 'can_manage' => $canManage, 'provider' => 'Groq', 'local_available' => true]);
    }

    public function references(Request $request)
    {
        AdmissionAccess::review($request);

        return response()->json(['years' => AcademicYear::where('institution_id', AdmissionAccess::institution($request))->orderByDesc('start_date')->get(['id', 'label']),
            'filieres' => Filiere::where('institution_id', AdmissionAccess::institution($request))->orderBy('name')->get(['id', 'name'])]);
    }

    public function saveCampaign(Request $request, ?int $id = null)
    {
        AdmissionAccess::review($request);
        $data = $request->validate(['name' => 'required|string|max:180', 'academic_year_id' => 'required|integer', 'filiere_id' => 'required|integer',
            'open_date' => 'required|date_format:Y-m-d', 'close_date' => 'required|date_format:Y-m-d|after_or_equal:open_date',
            'status' => 'required|in:draft,open,closed', 'target_capacity' => 'required|integer|min:1|max:20000', 'entry_route' => 'sometimes|in:tafem,cnaem', 'entry_semester' => 'sometimes|integer|in:1,5,7']);
        $previous = $id ? AdmissionCampaign::where('institution_id', AdmissionAccess::institution($request))->findOrFail($id) : null;
        $data['entry_route'] ??= $previous?->entry_route ?? 'tafem';
        $data['entry_semester'] ??= $previous?->entry_semester ?? 1;
        abort_unless(AdmissionEntryRules::validEntry($data['entry_route'], $data['entry_semester']), 422, 'TAFEM : entrée S1 ; CNAEM : entrée S5 ou S7 selon la décision officielle.');
        $inst = AdmissionAccess::institution($request);
        AcademicYear::whereKey($data['academic_year_id'])->where('institution_id', $inst)->firstOrFail();
        $filiere = Filiere::whereKey($data['filiere_id'])->where('institution_id', $inst)->firstOrFail();
        abort_if($filiere->requiresTuitionPayment(), 422, 'TAFEM et CNAEM concernent la formation initiale gratuite.');
        $campaign = DB::transaction(function () use ($id, $inst, $data) {
            $c = $id ? AdmissionCampaign::whereKey($id)->where('institution_id', $inst)->lockForUpdate()->firstOrFail() : new AdmissionCampaign(['institution_id' => $inst]);
            if ($c->exists && Application::where('admission_campaign_id', $c->id)->exists()) {
                abort_if($c->entry_route !== $data['entry_route'] || (int) $c->entry_semester !== (int) $data['entry_semester'], 409, 'Une campagne utilisée conserve son concours et son niveau d’entrée.');
                abort_if((int) $c->academic_year_id !== (int) $data['academic_year_id'] || (int) $c->filiere_id !== (int) $data['filiere_id'], 409, 'Une campagne utilisée conserve son année et sa filière. Créez une nouvelle campagne.');
                abort_if(Application::where('admission_campaign_id', $c->id)->where('dossier_status', 'approved')->count() > $data['target_capacity'], 422, 'Capacité inférieure aux inscriptions déjà validées.');
            }
            $c->fill($data)->save();

            return $c;
        });

        return response()->json(['data' => $campaign]);
    }

    public function retryNotification(Request $request, int $id)
    {
        AdmissionAccess::review($request);
        $n = DB::table('admission_notifications')->find($id);
        abort_unless($n && $n->status === 'failed', 422, 'Aucun envoi échoué à relancer.');
        $app = AdmissionAccess::dossier($request, false, $n->application_id);
        DB::transaction(function () use ($n, $app) {
            Application::whereKey($app->id)->lockForUpdate()->firstOrFail();
            $current = DB::table('admission_notifications')->where('id', $n->id)->lockForUpdate()->firstOrFail();
            abort_unless($current->status === 'failed', 409, 'Cet envoi a déjà été relancé.');
            DB::table('admission_notifications')->where('id', $n->id)->update(['status' => 'retried', 'updated_at' => now()]);
            if ($n->type === 'activation') {
                app(ActivateCandidateAction::class)->issue($app);
            } else {
                abort_unless(app(AdmissionNotificationService::class)->queue($app, $n->type), 422, 'Contact destinataire à vérifier.');
            }
        });

        return response()->json(['message' => 'Nouvelle tentative mise en file.']);
    }

    public function admissibility(Request $request)
    {
        $data = $request->validate(['cne' => 'required|string|max:30', 'cin' => 'required|string|max:30', 'campaign_id' => 'nullable|integer']);
        $campaign = AdmissionAccess::campaign($request);
        $app = Application::where('admission_campaign_id', $campaign->id)->where('cne', strtoupper(trim($data['cne'])))
            ->where('cin', strtoupper(trim($data['cin'])))->first();

        return response()->json(['found' => (bool) $app, 'eligibility' => $app?->eligibility,
            'message' => $app ? 'Consultez votre espace personnel ou demandez un lien d’activation.' : 'Aucune correspondance. Contactez le service admissions si nécessaire.']);
    }

    public function requestActivation(Request $request)
    {
        $data = $request->validate(['cne' => 'required|string|max:30', 'cin' => 'required|string|max:30']);
        $campaign = AdmissionAccess::campaign($request, true);
        $app = Application::where('admission_campaign_id', $campaign->id)->where('cne', strtoupper(trim($data['cne'])))
            ->where('cin', strtoupper(trim($data['cin'])))->first();
        if ($app?->contact_verified_at && (! $app->owner_user_id || str_ends_with(strtolower($app->owner?->email ?? ''), '@candidat.tafem.ma'))) {
            app(ActivateCandidateAction::class)->issue($app);
        }

        return response()->json(['message' => 'Si votre contact personnel est vérifié, un lien vous sera envoyé. Sinon, contactez le service admissions.']);
    }

    public function activate(Request $request)
    {
        $data = $request->validate(['token' => 'required|string|size:64', 'password' => ['required', 'confirmed', Password::defaults()]]);
        $user = app(ActivateCandidateAction::class)->redeem($data['token'], $data['password']);
        $token = $user->createToken('candidate-session', ['*'], now()->addHours(8))->plainTextToken;

        return AuthCookie::attach(response()->json(['data' => ['user' => $user->only(['id', 'name', 'email', 'cne', 'cin']), 'activated' => true]]), $token);
    }

    public function issueActivation(Request $request, int $id)
    {
        AdmissionAccess::review($request);
        $data = $request->validate(['email' => 'required|email|max:255', 'contact_verified' => 'required|accepted']);
        $app = AdmissionAccess::dossier($request, false, $id);
        abort_if($app->dossier_status === 'approved', 409, 'Compte déjà inscrit.');
        DB::transaction(function () use ($app, $data) {
            $app = Application::whereKey($app->id)->lockForUpdate()->firstOrFail();
            $email = strtolower(trim($data['email']));
            $existing = User::where('email', $email)->first();
            // An administrator must explicitly verify the personal contact; never change a personal account's password.
            if ($existing) {
                abort_unless($existing->institution_id === $app->campaign->institution_id && strtoupper((string) $existing->cin) === strtoupper((string) $app->cin), 409, 'Compte existant : identité à rapprocher manuellement.');
                abort_if($app->owner_user_id && $app->owner_user_id !== $existing->id, 409, 'Le propriétaire existant doit être conservé.');
                $app->owner_user_id = $existing->id;
            }
            $app->email = $email;
            $app->contact_verified_at = now();
            $app->version++;
            $app->save();
            $this->action->event($app, 'contact_verified');
            if (! $existing) {
                app(ActivateCandidateAction::class)->issue($app);
            }
        });

        return response()->json(['message' => 'Contact enregistré. Le candidat peut activer son dossier ou se connecter à son compte personnel existant.']);
    }

    public function show(Request $request)
    {
        return response()->json(['success' => true, 'found' => true, 'candidate' => $this->resource(AdmissionAccess::dossier($request))]);
    }

    public function resource(Application $app): array
    {
        $docs = StudentDocument::where('application_id', $app->id)->where('is_current', true)->whereNull('withdrawn_at')->get();
        $mapped = [];
        foreach ($docs as $doc) {
            $mapped[$doc->type] = $this->document($doc);
        }
        $appointment = DB::table('admission_appointments as a')->join('admission_slots as s', 'a.slot_id', '=', 's.id')
            ->where('a.application_id', $app->id)->select('a.id', 'a.entry_token', 'a.checked_in_at', 's.starts_at', 's.ends_at', 's.desk')->first();

        return array_merge($app->only(['id', 'reference_number', 'cne', 'cin', 'first_name', 'last_name', 'email', 'phone',
            'dossier_status', 'eligibility', 'version', 'submitted_at', 'approved_at', 'ranking', 'selection_score', 'invitation_expires_at']), [
                'application_id' => $app->id, 'profile' => $app->profile ?? [], 'documents' => $mapped,
                'is_locked' => ! in_array($app->dossier_status, ['draft', 'needs_correction']),
                'campaign' => $app->campaign->only(['id', 'name', 'open_date', 'close_date', 'entry_route', 'entry_semester']), 'appointment' => $appointment,
                'required_documents' => AdmissionEntryRules::documents($app->campaign->entry_route),
                'physical_requirements' => AdmissionEntryRules::physicalChecklist($app->campaign->entry_route),
                'events' => DB::table('admission_events')->where('application_id', $app->id)->orderByDesc('id')->limit(30)->get(['type', 'created_at']),
                'reviews' => DB::table('admission_reviews as r')->leftJoin('users as u', 'u.id', '=', 'r.reviewer_id')->leftJoin('student_documents as rd', 'rd.id', '=', 'r.document_id')->where('r.application_id', $app->id)->orderByDesc('r.id')->limit(30)->get(['r.id', 'r.document_id', 'r.decision', 'r.reason', 'r.physical_checklist', 'r.created_at', 'u.name as reviewer_name', 'rd.type as document_type', 'rd.version as document_version'])->map(function ($review) {
                    $review->physical_checklist = $review->physical_checklist ? json_decode($review->physical_checklist, true) : null;

                    return $review;
                }),
                'notifications' => DB::table('admission_notifications')->where('application_id', $app->id)->orderByDesc('id')->limit(10)->get(['id', 'type', 'status', 'sent_at']),
                'ocr_runs' => DB::table('admission_ocr_runs')->where('application_id', $app->id)->orderByDesc('created_at')->limit(12)->get()->map(function ($run) {
                    $run->fields = json_decode($run->fields ?? '{}', true);
                    $run->warnings = json_decode($run->warnings ?? '[]', true);

                    return $run;
                }),
                'document_history' => AdmissionAccess::staff(request()->user()) ? StudentDocument::where('application_id', $app->id)->orderByDesc('id')->limit(100)
                    ->get(['id', 'type', 'version', 'is_current', 'withdrawn_at', 'status'])->map(fn ($doc) => array_merge($doc->toArray(), ['url' => url('/api/admissions/workflow/documents/'.$doc->id.'/file')])) : [],
                'cloud_available' => AdmissionOcrPolicy::available($app->campaign->institution_id),
            ]);
    }

    public function document(StudentDocument $doc): array
    {
        $url = URL::temporarySignedRoute('admissions.document', now()->addMinutes(15), ['document' => $doc->id]);

        return array_merge($doc->only(['id', 'type', 'original_filename', 'mime_type', 'file_size', 'status', 'version']), ['file_path' => $url, 'signed_url' => $url]);
    }

    public function save(SaveDossierRequest $request)
    {
        $app = $this->action->save($request, $request->validated());

        return response()->json(['success' => true, 'candidate' => $this->resource($app->fresh())]);
    }

    public function legacySave(Request $request)
    {
        AdmissionAccess::dossier($request, true);
        $data = $request->validate((new SaveDossierRequest)->rules());
        $app = $this->action->save($request, $data);

        return response()->json(['success' => true, 'candidate' => $this->resource($app->fresh())]);
    }

    public function upload(Request $request)
    {
        $doc = $this->action->upload($request);

        return response()->json(['success' => true, 'document' => $this->document($doc), 'candidate' => $this->resource(Application::findOrFail($doc->application_id))]);
    }

    public function withdraw(Request $request)
    {
        AdmissionAccess::dossier($request, true);
        $request->validate(['application_id' => 'required|integer', 'version' => 'required|integer', 'type' => 'required|string']);
        $this->action->withdraw($request);

        return response()->json(['success' => true]);
    }

    public function download(Request $request, int $document)
    {
        $doc = StudentDocument::findOrFail($document);
        abort_if($doc->withdrawn_at && ! AdmissionAccess::staff($request->user()), 404);
        if (! $request->hasValidSignature()) {
            abort_unless($request->user(), 403, 'Accès au document refusé.');
            if ($doc->application_id) {
                AdmissionAccess::dossier($request, false, $doc->application_id);
            } else {
                AdmissionAccess::review($request);
                abort_unless(AdmissionAccess::institution($request) === (int) config('erp.institution_id', 1), 403);
            }
            abort_unless($doc->is_current || AdmissionAccess::staff($request->user()), 403);
        } else {
            abort_unless($doc->is_current, 403, 'Version remplacée. Rechargez le dossier.');
        }
        $disk = Storage::disk($doc->storage_disk);
        abort_unless($disk->exists($doc->file_path), 404);

        return response()->file($disk->path($doc->file_path), ['Content-Type' => $doc->mime_type, 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store']);
    }

    public function submit(Request $request)
    {
        return response()->json(['success' => true, 'candidate' => $this->resource($this->action->submit($request))]);
    }

    public function reviewDocument(Request $request, int $document)
    {
        $this->action->reviewDocument($request, $document);

        return $this->show($request);
    }

    public function decide(Request $request)
    {
        return response()->json(['success' => true, 'candidate' => $this->resource($this->action->decide($request))]);
    }

    public function startOcr(Request $request)
    {
        $app = AdmissionAccess::dossier($request, true);
        $data = $request->validate(['document_id' => 'required|integer', 'mode' => 'required|in:local,cloud',
            'consent' => 'required|accepted', 'consent_version' => 'required|in:admissions-v1']);
        if ($data['mode'] === 'cloud') {
            abort_unless(AdmissionOcrPolicy::available($app->campaign->institution_id), 422, 'Traitement cloud désactivé ou non configuré.');
        }
        $id = DB::transaction(function () use ($app, $data) {
            Application::whereKey($app->id)->lockForUpdate()->firstOrFail();
            $doc = StudentDocument::whereKey($data['document_id'])->where('application_id', $app->id)->where('is_current', true)->whereNull('withdrawn_at')->firstOrFail();
            abort_if($doc->type === 'photo', 422, 'La photo ne nécessite pas d’extraction de champs.');
            $active = DB::table('admission_ocr_runs')->where('application_id', $app->id)->whereIn('status', ['queued', 'processing'])->count();
            abort_if($active >= 2, 429, 'Deux documents sont déjà en cours de traitement.');
            $id = (string) Str::uuid();
            DB::table('admission_ocr_runs')->insert(['id' => $id, 'application_id' => $app->id, 'document_id' => $doc->id,
                'status' => 'queued', 'mode' => $data['mode'], 'parser_version' => 'admissions-v1', 'created_at' => now(), 'updated_at' => now()]);
            $this->action->event($app, 'ocr_consented', ['document_id' => $doc->id, 'mode' => $data['mode'], 'consent_version' => $data['consent_version']]);
            DB::afterCommit(fn () => ProcessAdmissionOcrJob::dispatch($id));

            return $id;
        });

        return response()->json(['id' => $id, 'status' => 'queued'], 202);
    }

    public function ocrStatus(Request $request, string $id)
    {
        $run = DB::table('admission_ocr_runs')->where('id', $id)->firstOrFail();
        AdmissionAccess::dossier($request, false, $run->application_id);
        if (in_array($run->status, ['queued', 'processing']) && now()->diffInMinutes($run->updated_at, true) > 10) {
            DB::table('admission_ocr_runs')->where('id', $id)->update(['status' => 'failed', 'error_code' => 'processing_expired', 'finished_at' => now()]);
            $run = DB::table('admission_ocr_runs')->where('id', $id)->first();
        }
        $run->fields = json_decode($run->fields ?? '{}', true);
        $run->warnings = json_decode($run->warnings ?? '[]', true);

        return response()->json($run);
    }

    public function cancelOcr(Request $request, string $id)
    {
        $run = DB::table('admission_ocr_runs')->where('id', $id)->firstOrFail();
        AdmissionAccess::dossier($request, true, $run->application_id);
        DB::table('admission_ocr_runs')->where('id', $id)->whereIn('status', ['queued', 'processing'])->update(['status' => 'cancelled', 'finished_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function listing(Request $request)
    {
        AdmissionAccess::review($request);
        $campaign = AdmissionAccess::campaign($request);
        $q = Application::where('admission_campaign_id', $campaign->id);
        if ($request->filled('status')) {
            $q->where('dossier_status', $request->input('status'));
        }
        if ($request->filled('eligibility')) {
            $q->where('eligibility', $request->input('eligibility'));
        }
        if ($request->filled('search')) {
            $search = mb_substr($request->string('search')->toString(), 0, 100);
            $q->where(fn ($q) => $q->where('cne', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%")->orWhere('first_name', 'like', "%{$search}%"));
        }

        return response()->json($q->orderByRaw('CASE WHEN ranking IS NULL THEN 1 ELSE 0 END')->orderBy('ranking')->orderBy('id')->paginate(min(100, max(1, $request->integer('per_page', 25)))));
    }

    public function stats(Request $request)
    {
        AdmissionAccess::review($request);
        $c = AdmissionAccess::campaign($request);
        $q = Application::where('admission_campaign_id', $c->id);
        $total = (clone $q)->count();
        $approved = (clone $q)->where('dossier_status', 'approved')->count();

        return response()->json(['success' => true, 'campaign' => $c, 'stats' => ['total_candidates' => $total, 'total_capacity' => $c->target_capacity,
            'approved' => $approved, 'submitted' => (clone $q)->whereIn('dossier_status', ['submitted', 'under_review'])->count(),
            'needs_correction' => (clone $q)->where('dossier_status', 'needs_correction')->count(), 'waiting' => (clone $q)->where('eligibility', 'waiting')->count(),
            'draft' => (clone $q)->where('dossier_status', 'draft')->count(), 'available_places' => max(0, $c->target_capacity - $approved)],
            'amphis' => [], 'regional_stats' => []]);
    }

    public function previewImport(Request $request)
    {
        return response()->json(app(ImportMinistryListAction::class)->preview($request));
    }

    public function commitImport(Request $request, int $batch)
    {
        return response()->json(app(ImportMinistryListAction::class)->commit($request, $batch));
    }

    public function promote(Request $request)
    {
        AdmissionAccess::review($request);
        $request->validate(['campaign_id' => 'required|integer', 'limit' => 'required|integer|min:1|max:100']);
        $count = DB::transaction(function () use ($request) {
            $c = AdmissionAccess::campaign($request, true);
            $c = AdmissionCampaign::whereKey($c->id)->lockForUpdate()->firstOrFail();
            $q = Application::where('admission_campaign_id', $c->id);
            (clone $q)->where('eligibility', 'main')->where('dossier_status', '!=', 'approved')->where('invitation_expires_at', '<', now())
                ->update(['eligibility' => 'invitation_expired', 'version' => DB::raw('version + 1')]);
            $reserved = (clone $q)->where('eligibility', 'main')->where('dossier_status', '!=', 'rejected')
                ->where(fn ($q) => $q->whereNull('invitation_expires_at')->orWhere('invitation_expires_at', '>', now())->orWhere('dossier_status', 'approved'))->count();
            $n = min($request->integer('limit'), max(0, $c->target_capacity - $reserved));
            $waiting = (clone $q)->where('eligibility', 'waiting')->whereNotNull('ranking')->orderBy('ranking')->orderBy('id')->limit($n)->lockForUpdate()->get();
            foreach ($waiting as $app) {
                $app->update(['eligibility' => 'main', 'invitation_expires_at' => now()->addDays(config('admissions.invitation_days', 7)), 'version' => $app->version + 1]);
                $this->action->event($app, 'waiting_invited');
                app(AdmissionNotificationService::class)->queue($app, 'waiting_invited');
            }

            return $waiting->count();
        });

        return response()->json(['success' => true, 'promoted_count' => $count, 'message' => $count.' invitation(s) enregistrée(s).']);
    }

    public function notify(Request $request)
    {
        $app = AdmissionAccess::dossier($request);
        abort_unless($app->contact_verified_at || $app->owner_user_id === $request->user()?->id, 422, 'Contact non vérifié.');
        app(AdmissionNotificationService::class)->queue($app, 'status_update');

        return response()->json(['message' => 'Notification mise en file d’envoi.']);
    }

    public function renewInvitation(Request $request)
    {
        AdmissionAccess::review($request);
        $request->validate(['application_id' => 'required|integer', 'version' => 'required|integer', 'days' => 'required|integer|min:1|max:14', 'reason' => 'required|string|min:5|max:2000']);
        DB::transaction(function () use ($request) {
            $resolved = AdmissionAccess::dossier($request);
            $campaign = $resolved->campaign()->lockForUpdate()->firstOrFail();
            abort_unless($campaign->status === 'open', 422, 'Campagne fermée.');
            $app = Application::whereKey($resolved->id)->lockForUpdate()->firstOrFail();
            $this->action->version($app, $request);
            abort_unless($app->eligibility === 'invitation_expired' || ($app->invitation_expires_at && $app->invitation_expires_at->isPast()), 422, 'Aucune invitation expirée à renouveler.');
            $reserved = Application::where('admission_campaign_id', $campaign->id)->where('eligibility', 'main')->where('id', '!=', $app->id)
                ->where('dossier_status', '!=', 'rejected')->where(fn ($q) => $q->whereNull('invitation_expires_at')->orWhere('invitation_expires_at', '>', now())->orWhere('dossier_status', 'approved'))->count();
            abort_if($reserved >= $campaign->target_capacity, 422, 'Aucune place disponible.');
            $expiry = min(now()->addDays($request->integer('days')), $campaign->close_date->endOfDay());
            abort_unless($expiry->isFuture(), 422, 'La date limite est dépassée.');
            $app->update(['eligibility' => 'main', 'invitation_expires_at' => $expiry, 'version' => $app->version + 1]);
            $this->action->event($app, 'invitation_renewed', ['reason' => $request->input('reason')]);
            app(AdmissionNotificationService::class)->queue($app, 'waiting_invited');
        });

        return $this->show($request);
    }

    public function unlinkedDocuments(Request $request)
    {
        AdmissionAccess::review($request);

        return response()->json(['data' => StudentDocument::whereNull('application_id')->where('is_current', true)->whereNull('withdrawn_at')
            ->orderBy('id')->limit(100)->get(['id', 'type', 'original_filename', 'cne', 'mime_type'])->map(fn ($doc) => array_merge($doc->toArray(), ['url' => url('/api/admissions/workflow/documents/'.$doc->id.'/file')]))]);
    }

    public function reconcileDocument(Request $request, int $document)
    {
        AdmissionAccess::review($request);
        $data = $request->validate(['application_id' => 'required|integer', 'version' => 'required|integer', 'reason' => 'required|string|min:5|max:2000', 'identity_verified' => 'required|accepted']);
        DB::transaction(function () use ($request, $document, $data) {
            $app = AdmissionAccess::dossier($request, true);
            $app = Application::whereKey($app->id)->lockForUpdate()->firstOrFail();
            $this->action->version($app, $request);
            abort_unless(in_array($app->dossier_status, ['draft', 'needs_correction']), 422, 'Le dossier doit être ouvert à correction.');
            $doc = StudentDocument::whereKey($document)->whereNull('application_id')->lockForUpdate()->firstOrFail();
            abort_if(StudentDocument::where('application_id', $app->id)->where('type', $doc->type)->where('is_current', true)->exists(), 409, 'Une pièce courante de ce type existe déjà. Conservez les versions et examinez le conflit.');
            $doc->update(['application_id' => $app->id, 'student_id' => $app->student_id, 'cne' => $app->cne, 'status' => 'pending']);
            DB::table('admission_reviews')->insert(['application_id' => $app->id, 'document_id' => $doc->id, 'reviewer_id' => auth()->id(),
                'decision' => 'identity_reconciled', 'reason' => $data['reason'], 'created_at' => now(), 'updated_at' => now()]);
            DB::table('data_integrity_issues')->where('entity', 'student_documents')->where('entity_id', $doc->id)->where('reason', 'admission_owner_requires_reconciliation')->update(['resolved_at' => now()]);
            $app->increment('version');
            $this->action->event($app, 'document_reconciled', ['document_id' => $doc->id]);
        });

        return response()->json(['message' => 'Document rapproché après vérification humaine.']);
    }
}
