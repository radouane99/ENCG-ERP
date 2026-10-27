<?php

namespace App\Actions\Admission;

use App\Domain\Admission\AdmissionEntryRules;
use App\Http\Requests\Admissions\SaveDossierRequest;
use App\Models\AcademicYear;
use App\Models\Application;
use App\Models\Group;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\StudentPathway;
use App\Models\StudentRegistration;
use App\Models\User;
use App\Services\Admissions\AdmissionNotificationService;
use App\Services\Admissions\CnieDocumentComposer;
use App\Support\AdmissionAccess;
use App\Support\AdmissionDeskAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ManageDossierAction
{
    public const TYPES = ['bac', 'cnie', 'releve_notes', 'photo'];

    public static function type(string $type): string
    {
        return match (strtolower($type)) {
            'cin', 'cin_recto_verso', 'id_card' => 'cnie', 'releve', 'transcript' => 'releve_notes',
            'baccalaureate' => 'bac', default => strtolower($type),
        };
    }

    public function event(Application $app, string $type, array $details = []): void
    {
        DB::table('admission_events')->insert(['application_id' => $app->id, 'actor_id' => auth()->id(),
            'type' => $type, 'details' => json_encode($details), 'created_at' => now(), 'updated_at' => now()]);
    }

    public function version(Application $app, Request $request): void
    {
        abort_unless($request->integer('version') === $app->version, 409, 'Le dossier a changé. Rechargez les données avant de réessayer.');
    }

    private function locked(Request $request): Application
    {
        $found = AdmissionAccess::dossier($request, true);
        $app = Application::whereKey($found->id)->lockForUpdate()->firstOrFail();
        if (AdmissionAccess::staff($request->user())) {
            AdmissionDeskAccess::assertAvailable($app, $request->user()->id);
        }
        abort_unless(in_array($app->dossier_status, ['draft', 'needs_correction']), 403, 'Le dossier est en cours de revue. Une demande de correction est nécessaire.');
        $this->version($app, $request);

        return $app;
    }

    public function save(Request $request, array $data): Application
    {
        return DB::transaction(function () use ($request, $data) {
            $app = $this->locked($request);
            unset($data['application_id'], $data['version']);
            foreach (['father', 'mother'] as $parent) {
                if (array_key_exists($parent.'_first_name', $data) || array_key_exists($parent.'_last_name', $data)) {
                    $first = trim($data[$parent.'_first_name'] ?? $app->profile[$parent.'_first_name'] ?? '');
                    $last = trim($data[$parent.'_last_name'] ?? $app->profile[$parent.'_last_name'] ?? '');
                    if (($first !== '' && $last !== '') || empty($app->profile[$parent.'_name'])) {
                        $data[$parent.'_name'] = trim($first.' '.$last);
                    }
                }
            }
            $profile = array_replace($app->profile ?? [], $data);
            $app->profile = $profile;
            // Only explicit, validated profile fields are mirrored. Identifiers/contact ownership are immutable here.
            $columns = ['first_name', 'last_name', 'phone', 'birth_date', 'bac_year', 'bac_average', 'bac_series'];
            foreach ($columns as $key) {
                if (array_key_exists($key, $data) && (! $app->official_rank_source || in_array($key, ['phone', 'birth_date']))) {
                    $app->{$key} = $data[$key];
                }
            }
            if ($app->owner_user_id) {
                $u = User::whereKey($app->owner_user_id)->lockForUpdate()->firstOrFail();
                $u->fill(array_intersect_key($data, array_flip(['first_name', 'last_name', 'phone', 'birth_date', 'address', 'city'])));
                $u->name = trim(($data['first_name'] ?? $u->first_name).' '.($data['last_name'] ?? $u->last_name));
                $u->save();
            }
            $app->version++;
            $app->save();
            $this->event($app, 'draft_saved', ['fields' => array_keys($data)]);

            return $app;
        });
    }

    public function upload(Request $request): StudentDocument
    {
        AdmissionAccess::dossier($request, true);
        $type = self::type($request->string('type')->toString());
        $request->merge(['type' => $type]);
        $request->validate(['application_id' => 'required|integer', 'version' => 'required|integer',
            'type' => 'required|in:'.implode(',', AdmissionEntryRules::uploadTypes()),
            'file' => ['required', 'file', 'max:10240', $type === 'photo' ? 'mimes:jpg,jpeg,png,webp' : 'mimes:pdf,jpg,jpeg,png,webp'],
            'file_verso' => ['nullable', 'file', 'max:10240', 'mimes:jpg,jpeg,png,webp']]);
        $file = $request->file('file');
        $mime = $file->getMimeType();
        $verso = $request->file('file_verso');
        if ($type === 'cnie' && str_starts_with($mime, 'image/') && ! $verso) {
            throw ValidationException::withMessages(['file_verso' => 'Ajoutez le verso de la CNIE ou un PDF contenant les deux faces.']);
        }
        if ($verso) {
            abort_unless($type === 'cnie' && str_starts_with($mime, 'image/'), 422, 'Les deux faces sont réservées aux images CNIE.');
        }
        foreach (array_filter([$file, $verso]) as $imageFile) {
            if (! str_starts_with($imageFile->getMimeType(), 'image/')) {
                continue;
            }
            $size = @getimagesize($imageFile->getRealPath());
            if (! $size || min($size[0], $size[1]) < 200 || max($size[0], $size[1]) > 12000) {
                throw ValidationException::withMessages(['file' => 'Image illisible ou trop petite. Minimum 200 pixels ; maximum 12000 pixels par côté.']);
            }
        }
        $content = $verso ? app(CnieDocumentComposer::class)->compose($file, $verso) : file_get_contents($file->getRealPath());
        abort_if(strlen($content) > 10 * 1024 * 1024, 422, 'Le document CNIE assemblé dépasse 10 Mo.');
        $hash = hash('sha256', $content);
        if ($verso) {
            $mime = 'application/pdf';
        }
        $path = null;
        try {
            return DB::transaction(function () use ($request, $type, $content, $mime, $hash, &$path) {
                $app = $this->locked($request);
                $old = StudentDocument::where('application_id', $app->id)->where('type', $type)->where('is_current', true)->first();
                abort_if($app->dossier_status === 'needs_correction' && $old?->status === 'verified', 422, 'Cette pièce est déjà validée. Remplacez uniquement les pièces à corriger ou contactez la scolarité.');
                if ($old && $old->content_hash === $hash) {
                    app(QueueAutomaticOcrAction::class)->execute($old);

                    return $old;
                }
                $version = StudentDocument::where('application_id', $app->id)->where('type', $type)->max('version') + 1;
                $ext = match ($mime) {
                    'application/pdf' => 'pdf', 'image/png' => 'png', 'image/webp' => 'webp', default => 'jpg'
                };
                $path = 'admissions/'.$app->id.'/'.Str::uuid().'.'.$ext;
                Storage::disk('private')->put($path, $content);
                if ($old) {
                    $old->update(['is_current' => false]);
                }
                $doc = StudentDocument::create(['application_id' => $app->id, 'student_id' => $app->student_id,
                    'cne' => $app->cne, 'type' => $type, 'file_path' => $path, 'storage_disk' => 'private',
                    'original_filename' => $type.'.'.$ext, 'mime_type' => $mime, 'file_size' => strlen($content),
                    'version' => $version, 'content_hash' => $hash, 'is_current' => true, 'status' => 'pending', 'uploaded_by' => auth()->id()]);
                $app->increment('version');
                $this->event($app, 'document_uploaded', ['document_id' => $doc->id, 'type' => $type, 'version' => $version]);
                app(QueueAutomaticOcrAction::class)->execute($doc);

                return $doc;
            });
        } catch (\Throwable $e) {
            if ($path) {
                Storage::disk('private')->delete($path);
            }
            throw $e;
        }
    }

    public function withdraw(Request $request): void
    {
        DB::transaction(function () use ($request) {
            $app = $this->locked($request);
            $doc = StudentDocument::where('application_id', $app->id)->where('type', self::type($request->input('type', '')))
                ->where('is_current', true)->lockForUpdate()->firstOrFail();
            abort_if($app->dossier_status === 'needs_correction' && $doc->status === 'verified', 422, 'Une pièce validée doit être conservée pendant la correction.');
            // Keep the immutable file/version for audit; it is no longer visible to the candidate.
            $doc->update(['is_current' => false, 'withdrawn_at' => now()]);
            $app->increment('version');
            $this->event($app, 'document_withdrawn', ['document_id' => $doc->id]);
        });
    }

    public function submit(Request $request): Application
    {
        return DB::transaction(function () use ($request) {
            $app = $this->locked($request);
            abort_unless($app->eligibility === 'main', 422, 'Une admission sur la liste principale est requise avant soumission.');
            $data = array_replace($app->profile ?? [], ['first_name' => $app->first_name, 'last_name' => $app->last_name]);
            validator($data, ['first_name' => 'required', 'last_name' => 'required', 'phone' => 'required',
                'birth_date' => 'required|date_format:Y-m-d|before:today', 'gender' => 'required|in:male,female',
                'address' => 'required', 'bac_average' => 'required|numeric|between:0,20', 'bac_year' => 'required|integer'])->validate();
            $types = StudentDocument::where('application_id', $app->id)->where('is_current', true)->whereNull('withdrawn_at')->pluck('type')->all();
            abort_if(array_diff(AdmissionEntryRules::documents($app->campaign->entry_route), $types), 422, 'Ajoutez toutes les pièces requises pour ce concours avant de soumettre.');
            abort_if(StudentDocument::where('application_id', $app->id)->where('is_current', true)->whereNull('withdrawn_at')->where('status', 'rejected')->exists(), 422, 'Remplacez les pièces signalées à corriger avant de soumettre à nouveau.');
            $app->update(['dossier_status' => 'submitted', 'status' => 'submitted', 'submitted_at' => now(), 'version' => $app->version + 1]);
            $this->event($app, 'submitted');
            app(AdmissionNotificationService::class)->queue($app, 'submitted');

            return $app;
        });
    }

    public function reviewDocument(Request $request, int $documentId): void
    {
        AdmissionAccess::review($request);
        $data = $request->validate(['application_id' => 'required|integer', 'version' => 'required|integer',
            'decision' => 'required|in:verified,rejected', 'reason' => 'required_if:decision,rejected|nullable|string|max:2000', 'corrections' => 'nullable|array']);
        $corrections = $request->input('corrections', []);
        if ($corrections) {
            $rules = (new SaveDossierRequest)->rules();
            unset($rules['application_id'], $rules['version']);
            $data['corrections'] = validator($corrections, $rules)->validate();
            abort_unless(trim((string) ($data['reason'] ?? '')) !== '', 422, 'Expliquez la correction de champ dans l’observation.');
        }
        DB::transaction(function () use ($request, $documentId, $data) {
            $app = AdmissionAccess::dossier($request);
            $app = Application::whereKey($app->id)->lockForUpdate()->firstOrFail();
            AdmissionDeskAccess::assertAvailable($app, $request->user()->id);
            $this->version($app, $request);
            abort_unless(in_array($app->dossier_status, ['submitted', 'under_review', 'needs_correction']), 422, 'Le candidat doit soumettre son dossier avant la revue.');
            $doc = StudentDocument::where('application_id', $app->id)->whereKey($documentId)->where('is_current', true)->whereNull('withdrawn_at')->firstOrFail();
            $doc->update(['status' => $data['decision']]);
            DB::table('admission_reviews')->insert(['application_id' => $app->id, 'document_id' => $doc->id,
                'reviewer_id' => auth()->id(), 'decision' => $data['decision'], 'reason' => $data['reason'] ?? null,
                'corrections' => ! empty($data['corrections']) ? json_encode($data['corrections'], JSON_UNESCAPED_UNICODE) : null,
                'created_at' => now(), 'updated_at' => now()]);
            if (! empty($data['corrections'])) {
                $app->profile = array_replace($app->profile ?? [], $data['corrections']);
            }
            $requiresCorrection = $data['decision'] === 'rejected' || StudentDocument::where('application_id', $app->id)->where('is_current', true)->whereNull('withdrawn_at')->where('status', 'rejected')->exists();
            $app->update(['dossier_status' => $requiresCorrection || $app->dossier_status === 'needs_correction' ? 'needs_correction' : 'under_review', 'version' => $app->version + 1]);
            $this->event($app, 'document_reviewed', ['document_id' => $doc->id, 'decision' => $data['decision']]);
            if ($data['decision'] === 'rejected') {
                $this->event($app, 'needs_correction', ['document_id' => $doc->id]);
                app(AdmissionNotificationService::class)->queue($app, 'needs_correction');
            }
        });
    }

    public function decide(Request $request): Application
    {
        AdmissionAccess::review($request);
        $data = $request->validate(['application_id' => 'required|integer', 'version' => 'required|integer',
            'decision' => 'required|in:needs_correction,rejected,approved', 'reason' => 'required_unless:decision,approved|nullable|string|max:2000',
            'official_number' => 'required_if:decision,approved|nullable|string|max:40|regex:/^[A-Za-z0-9-]+$/',
            'group_id' => 'nullable|integer', 'physical_checklist' => 'required_if:decision,approved|array',
            'physical_checklist.bac_original' => 'required_if:decision,approved|accepted',
            'physical_checklist.releve_notes' => 'required_if:decision,approved|accepted',
            'physical_checklist.cin_copy' => 'required_if:decision,approved|accepted',
            'physical_checklist.photos' => 'required_if:decision,approved|accepted',
            'physical_checklist.attestation_admission' => 'sometimes|accepted',
            'physical_checklist.releve_parcours' => 'sometimes|accepted']);

        return DB::transaction(function () use ($request, $data) {
            $resolved = AdmissionAccess::dossier($request);
            $campaign = $resolved->campaign()->lockForUpdate()->firstOrFail();
            $entrySemester = (int) $campaign->entry_semester;
            abort_unless(AdmissionEntryRules::validEntry($campaign->entry_route, $entrySemester), 422, 'Niveau d’entrée de campagne incohérent.');
            abort_if(AcademicYear::findOrFail($campaign->academic_year_id)->is_locked, 422, 'Année universitaire verrouillée.');
            $app = Application::whereKey($resolved->id)->lockForUpdate()->firstOrFail();
            AdmissionDeskAccess::assertAvailable($app, $request->user()->id);
            if ($app->dossier_status === 'approved') {
                abort_unless($data['decision'] === 'approved' && Student::find($app->student_id)?->student_number === $data['official_number'], 409, 'Décision déjà enregistrée.');

                return $app;
            }
            $this->version($app, $request);
            abort_unless(in_array($app->dossier_status, ['submitted', 'under_review']), 422, 'Le dossier doit être soumis avant revue.');
            if ($data['decision'] === 'approved') {
                foreach (AdmissionEntryRules::physicalChecklist($campaign->entry_route) as $key => $label) {
                    validator($data, ['physical_checklist.'.$key => 'required|accepted'])->validate();
                }
                abort_if($campaign->filiere->requiresTuitionPayment(), 422, 'Une admission TAFEM/CNAEM doit concerner une formation initiale gratuite.');
                AdmissionAccess::invitationActive($app);
                abort_unless($app->eligibility === 'main' && $app->owner_user_id, 422, 'Dossier non admissible ou non activé.');
                $verified = StudentDocument::where('application_id', $app->id)->where('is_current', true)->whereNull('withdrawn_at')->where('status', 'verified')->pluck('type')->all();
                abort_if(array_diff(AdmissionEntryRules::documents($campaign->entry_route), $verified), 422, 'Vérifiez chaque pièce numérique avant la validation définitive.');
                $already = Application::where('admission_campaign_id', $campaign->id)->where('dossier_status', 'approved')->count();
                abort_if($already >= $campaign->target_capacity, 422, 'Capacité de la campagne atteinte.');
                $student = Student::where('cne', $app->cne)->lockForUpdate()->first();
                abort_if(Student::where('institution_id', $campaign->institution_id)->where('cne', '!=', $app->cne)->where(fn ($q) => $q->where('user_id', $app->owner_user_id)->orWhereHas('user', fn ($u) => $u->whereRaw('UPPER(TRIM(cin)) = ?', [strtoupper(trim($app->cin))])))->exists(), 409, 'Identité déjà liée à un autre dossier étudiant : rapprochement manuel requis.');
                if ($student) {
                    abort_if($student->registrations()->where('academic_year_id', $campaign->academic_year_id)->where(fn ($q) => $q->where('filiere_id', '!=', $campaign->filiere_id)->orWhere('semester_number', '!=', $entrySemester))->exists(), 409, 'Une inscription existe déjà pour cette année à un autre niveau ou cursus.');
                }
                abort_if($student && $student->user_id !== $app->owner_user_id, 409, 'Conflit de propriétaire : rapprochement manuel requis.');
                $number = trim($data['official_number']);
                abort_if($number === $app->cne || in_array(strtolower($number), ['en-attente', 'pending']), 422, 'Renseignez un numéro officiel vérifié.');
                abort_if(Student::where('student_number', $number)->when($student, fn ($q) => $q->where('id', '!=', $student->id))->exists(), 422, 'Numéro officiel déjà attribué.');
                if ($student && $student->status === 'active' && $student->student_number !== $number) {
                    abort(409, 'Le numéro officiel existant doit être conservé.');
                }
                $profile = $app->profile ?? [];
                validator($profile, ['gender' => 'required|in:male,female'])->validate();
                $owner = User::whereKey($app->owner_user_id)->lockForUpdate()->firstOrFail();
                $owner->fill(array_intersect_key($profile, array_flip(['first_name', 'last_name', 'phone', 'birth_date', 'address', 'city'])));
                $owner->name = trim(($profile['first_name'] ?? $app->first_name).' '.($profile['last_name'] ?? $app->last_name));
                $owner->save();
                $student ??= new Student(['institution_id' => $campaign->institution_id, 'cne' => $app->cne, 'user_id' => $app->owner_user_id]);
                $student->fill(['student_number' => $number, 'status' => 'active', 'inscription_status' => 'DOSSIER_CONFORME', 'gender' => $profile['gender']]);
                $student->save();
                $group = empty($data['group_id']) ? null : Group::whereKey($data['group_id'])->where('filiere_id', $campaign->filiere_id)
                    ->where('academic_year_id', $campaign->academic_year_id)->where('semester_number', $entrySemester)->firstOrFail();
                StudentPathway::where('student_id', $student->id)->where('is_current', true)->update(['is_current' => false]);
                StudentPathway::updateOrCreate(['student_id' => $student->id, 'academic_year_id' => $campaign->academic_year_id, 'current_semester' => $entrySemester],
                    ['filiere_id' => $campaign->filiere_id, 'group_id' => $group?->id, 'is_current' => true]);
                StudentRegistration::updateOrCreate(['student_id' => $student->id, 'academic_year_id' => $campaign->academic_year_id, 'semester_number' => $entrySemester],
                    ['filiere_id' => $campaign->filiere_id, 'group_id' => $group?->id, 'registration_type' => 'initial', 'status' => 'admin_validated', 'payment_status' => 'not_applicable', 'admin_validated_at' => now()]);
                StudentDocument::where('application_id', $app->id)->whereNull('student_id')->update(['student_id' => $student->id]);
                $app->student_id = $student->id;
                $app->approved_at = now();
                $app->status = 'enrolled';
            }
            $app->dossier_status = $data['decision'];
            $app->version++;
            $app->save();
            DB::table('admission_reviews')->insert(['application_id' => $app->id, 'reviewer_id' => auth()->id(),
                'decision' => $data['decision'], 'reason' => $data['reason'] ?? null,
                'physical_checklist' => isset($data['physical_checklist']) ? json_encode($data['physical_checklist']) : null,
                'created_at' => now(), 'updated_at' => now()]);
            $this->event($app, $data['decision']);
            app(AdmissionNotificationService::class)->queue($app, $data['decision']);

            return $app;
        });
    }
}
