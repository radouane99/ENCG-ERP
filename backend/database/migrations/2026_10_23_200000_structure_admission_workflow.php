<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $t) {
            $t->foreignId('owner_user_id')->nullable()->constrained('users')->restrictOnDelete();
            $t->index(['owner_user_id', 'admission_campaign_id'], 'admission_owner_campaign_lookup');
            $t->foreignId('student_id')->nullable()->constrained('students')->restrictOnDelete();
            $t->string('dossier_status')->default('draft')->index();
            $t->string('eligibility')->default('unconfirmed');
            $t->unsignedInteger('version')->default(1);
            $t->json('profile')->nullable();
            $t->timestamp('submitted_at')->nullable();
            $t->timestamp('approved_at')->nullable();
            $t->timestamp('invitation_expires_at')->nullable();
            $t->timestamp('contact_verified_at')->nullable();
            $t->string('official_rank_source')->nullable();
        });
        Schema::table('student_documents', function (Blueprint $t) {
            $t->unsignedInteger('version')->default(1);
            $t->boolean('is_current')->default(true);
            $t->string('content_hash', 64)->nullable();
            $t->string('storage_disk')->default('private');
            $t->timestamp('withdrawn_at')->nullable();
            $t->foreignId('uploaded_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->unique(['id', 'application_id'], 'admission_document_owner_key');
        });
        Schema::create('admission_events', function (Blueprint $t) {
            $t->id();
            $t->foreignId('application_id')->constrained('applications')->restrictOnDelete();
            $t->foreignId('actor_id')->nullable()->constrained('users')->restrictOnDelete();
            $t->string('type');
            $t->json('details')->nullable();
            $t->timestamps();
            $t->index(['application_id', 'created_at']);
        });
        Schema::create('admission_activations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('application_id')->constrained('applications')->restrictOnDelete();
            $t->string('token_hash', 64)->unique();
            $t->string('email');
            $t->timestamp('expires_at');
            $t->timestamp('used_at')->nullable();
            $t->timestamps();
        });
        Schema::create('admission_ocr_runs', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignId('application_id')->constrained('applications')->restrictOnDelete();
            $t->foreignId('document_id')->constrained('student_documents')->restrictOnDelete();
            $t->foreign(['document_id', 'application_id'], 'admission_ocr_document_owner_fk')->references(['id', 'application_id'])->on('student_documents')->restrictOnDelete();
            $t->string('status')->default('queued')->index();
            $t->string('mode')->default('local');
            $t->string('engine')->nullable();
            $t->string('parser_version')->default('admissions-v1');
            $t->json('fields')->nullable();
            $t->json('warnings')->nullable();
            $t->string('error_code')->nullable();
            $t->timestamp('started_at')->nullable();
            $t->timestamp('finished_at')->nullable();
            $t->unsignedInteger('duration_ms')->nullable();
            $t->timestamps();
        });
        Schema::create('admission_reviews', function (Blueprint $t) {
            $t->id();
            $t->foreignId('application_id')->constrained('applications')->restrictOnDelete();
            $t->foreignId('document_id')->nullable()->constrained('student_documents')->restrictOnDelete();
            $t->foreign(['document_id', 'application_id'], 'admission_review_document_owner_fk')->references(['id', 'application_id'])->on('student_documents')->restrictOnDelete();
            $t->foreignId('reviewer_id')->constrained('users')->restrictOnDelete();
            $t->string('decision');
            $t->text('reason')->nullable();
            $t->json('corrections')->nullable();
            $t->json('physical_checklist')->nullable();
            $t->timestamps();
        });
        Schema::create('admission_import_batches', function (Blueprint $t) {
            $t->id();
            $t->foreignId('admission_campaign_id')->constrained()->restrictOnDelete();
            $t->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $t->string('checksum', 64);
            $t->string('status')->default('preview');
            $t->json('rows');
            $t->json('errors');
            $t->timestamp('committed_at')->nullable();
            $t->timestamps();
        });
        Schema::create('admission_slots', function (Blueprint $t) {
            $t->id();
            $t->foreignId('admission_campaign_id')->constrained()->restrictOnDelete();
            $t->timestamp('starts_at');
            $t->timestamp('ends_at');
            $t->string('desk');
            $t->unsignedInteger('capacity');
            $t->timestamps();
            $t->unique(['admission_campaign_id', 'starts_at', 'desk']);
        });
        Schema::create('admission_appointments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('application_id')->unique()->constrained('applications')->restrictOnDelete();
            $t->foreignId('slot_id')->constrained('admission_slots')->restrictOnDelete();
            $t->uuid('entry_token')->unique();
            $t->timestamp('checked_in_at')->nullable();
            $t->foreignId('checked_in_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->timestamps();
        });
        Schema::create('admission_notifications', function (Blueprint $t) {
            $t->id();
            $t->foreignId('application_id')->constrained('applications')->restrictOnDelete();
            $t->string('type');
            $t->string('recipient');
            $t->string('status')->default('queued');
            $t->unsignedInteger('attempts')->default(0);
            $t->timestamp('sent_at')->nullable();
            $t->timestamps();
        });
        Schema::create('admission_allocation_plans', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignId('admission_campaign_id')->constrained()->restrictOnDelete();
            $t->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $t->json('assignments');
            $t->timestamp('committed_at')->nullable();
            $t->timestamp('expires_at');
            $t->timestamps();
        });

        // Preserve snapshots. Link only exact, unambiguous existing identities.
        foreach (DB::table('applications')->orderBy('id')->get() as $a) {
            $students = DB::table('students')->where('cne', $a->cne)->whereNull('deleted_at')->get();
            $s = $students->count() === 1 ? $students->first() : null;
            $eligibility = match (true) {
                str_contains(strtolower($a->status), 'attente'), $a->status === 'waitlisted' => 'waiting',
                in_array($a->status, ['admis_tafem', 'accepted', 'enrolled', 'valide']) => 'main',
                $a->status === 'rejected' => 'not_admitted',
                default => 'unconfirmed',
            };
            $profile = [];
            $source = (array) $a;
            $owner = $s?->user_id ? DB::table('users')->find($s->user_id) : null;
            if ($owner && $a->cin && $owner->cin && strtoupper(trim($a->cin)) !== strtoupper(trim($owner->cin))) {
                DB::table('data_integrity_issues')->updateOrInsert(['entity' => 'applications', 'entity_id' => $a->id, 'reason' => 'admission_identity_conflict'], ['created_at' => now(), 'updated_at' => now()]);
                $s = null; $owner = null;
            }
            foreach (['first_name', 'last_name', 'first_name_ar', 'last_name_ar', 'phone', 'birth_date', 'birth_city', 'gender', 'nationality',
                'address', 'city', 'academy', 'province', 'high_school', 'bac_series', 'bac_year', 'bac_average', 'father_name', 'mother_name',
                'emergency_contact_name', 'emergency_contact_phone', 'allergy_type', 'disability_details', 'medication_used'] as $key) {
                $value = $source[$key] ?? null;
                if ($owner && in_array($key, ['first_name', 'last_name', 'phone', 'birth_date', 'address', 'city'])) $value = $owner->{$key} ?? $value;
                if ($value !== null && $value !== '') $profile[$key] = $value;
            }
            if ($s && ! isset($profile['gender']) && in_array($s->gender, ['female', 'male'])) $profile['gender'] = $s->gender;
            DB::table('applications')->where('id', $a->id)->update([
                'student_id' => $s?->id, 'owner_user_id' => $s?->user_id, 'eligibility' => $eligibility,
                // An old label alone is not evidence of document approval.
                'dossier_status' => 'draft',
                'profile' => json_encode($profile, JSON_UNESCAPED_UNICODE),
            ]);
        }
        $types = ['cin' => 'cnie', 'cin_recto_verso' => 'cnie', 'releve' => 'releve_notes', 'baccalaureate' => 'bac'];
        foreach (DB::table('student_documents')->orderBy('id')->get() as $doc) {
            $apps = DB::table('applications')->where('cne', $doc->cne)->get();
            $app = $apps->count() === 1 ? $apps->first() : null;
            $type = $types[strtolower($doc->type)] ?? strtolower($doc->type);
            $disk = null; $hash = null;
            foreach (['private', 'local', 'public'] as $candidateDisk) {
                if (\Illuminate\Support\Facades\Storage::disk($candidateDisk)->exists($doc->file_path)) {
                    $disk = $candidateDisk;
                    $hash = hash_file('sha256', \Illuminate\Support\Facades\Storage::disk($candidateDisk)->path($doc->file_path));
                    break;
                }
            }
            DB::table('student_documents')->where('id', $doc->id)->update([
                'application_id' => $app?->id ?? $doc->application_id,
                'student_id' => $doc->student_id ?? $app?->student_id,
                'type' => $type,
                'storage_disk' => $disk ?? 'private', 'content_hash' => $hash,
            ]);
            if (! $app || ! $disk) DB::table('data_integrity_issues')->updateOrInsert(['entity' => 'student_documents', 'entity_id' => $doc->id,
                'reason' => ! $app ? 'admission_owner_requires_reconciliation' : 'document_file_missing'], ['created_at' => now(), 'updated_at' => now()]);
        }
        // Preserve older versions and select the latest legacy version, without deleting files.
        $keys = [];
        foreach (DB::table('student_documents')->whereNotNull('application_id')->orderByDesc('id')->get() as $doc) {
            $key = $doc->application_id.':'.$doc->type;
            if (isset($keys[$key])) {
                DB::table('student_documents')->where('id', $doc->id)->update(['is_current' => false]);
            }
            $keys[$key] = true;
        }
        $duplicates = DB::table('applications')->select('admission_campaign_id', 'cne')
            ->whereNotNull('cne')->groupBy('admission_campaign_id', 'cne')->havingRaw('count(*) > 1')->exists();
        if ($duplicates) {
            throw new RuntimeException('Admission migration requires manual reconciliation of duplicate campaign/CNE keys; no records were deleted.');
        }
        Schema::table('applications', fn (Blueprint $t) => $t->unique(['admission_campaign_id', 'cne'], 'applications_campaign_cne_unique'));
        DB::statement('CREATE UNIQUE INDEX admission_current_document_unique ON student_documents (application_id, type) WHERE is_current = true AND application_id IS NOT NULL');
        $keys = Schema::getForeignKeys('student_documents');
        if (! collect($keys)->contains(fn ($fk) => $fk['columns'] === ['application_id'])) {
            Schema::table('student_documents', fn (Blueprint $t) => $t->foreign('application_id', 'admission_document_application_fk')->references('id')->on('applications')->restrictOnDelete());
        }
    }

    public function down(): void
    {
        // Deliberately refuse destructive rollback after live admissions have been recorded.
        throw new RuntimeException('Restore the pre-migration backup to roll back admission workflow data.');
    }
};
