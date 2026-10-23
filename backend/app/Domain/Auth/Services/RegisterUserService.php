<?php

declare(strict_types=1);

namespace App\Domain\Auth\Services;

use App\Mail\StudentRegistrationSuccessMail;
use App\Models\AcademicYear;
use App\Models\AdmissionCampaign;
use App\Models\Application;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class RegisterUserService
{
    /**
     * Handle the registration of a new user and creation of their application.
     */
    public function registerUser(array $data, ?string $ipAddress = null): User
    {
        return DB::transaction(function () use ($data) {
            // 1. Create or Update User
            $cneClean = strtoupper(trim($data['cne'] ?? ''));
            $cinClean = strtoupper(trim($data['cin'] ?? ''));
            $emailClean = strtolower(trim($data['email'] ?? ''));

            // Public registration must never activate or overwrite an existing identity.
            $existingApp = $this->findApplicationForCandidate($cneClean, $cinClean);
            $existingUser = User::withTrashed()->where('email', $emailClean)->exists()
                || Student::withTrashed()->where('cne', $cneClean)->exists();
            if ($cinClean !== '' && Schema::hasColumn('users', 'cin')) {
                $existingUser = $existingUser || User::withTrashed()->where('cin', $cinClean)->exists();
            }
            if ($existingUser || $existingApp) {
                throw ValidationException::withMessages([
                    'email' => ['Un dossier ou un compte existe déjà. Connectez-vous ou utilisez la récupération de mot de passe.'],
                ]);
            }

            $institutionId = (int) config('erp.institution_id', 1);
            $academicYear = AcademicYear::where('institution_id', $institutionId)->where('is_current', true)->first();
            $campaign = AdmissionCampaign::where('institution_id', $institutionId)
                ->where('academic_year_id', $academicYear?->id)->where('status', 'open')->latest('id')->first();
            if (! $campaign) {
                throw ValidationException::withMessages(['email' => ['Les inscriptions sont actuellement fermées.']]);
            }
            \App\Support\AdmissionAccess::campaignOpen(new Application(['admission_campaign_id' => $campaign->id]));

            $userAttributes = [
                'first_name' => $data['first_name'] ?? '',
                'last_name' => $data['last_name'] ?? '',
                'name' => trim(($data['first_name'] ?? '').' '.($data['last_name'] ?? '')),
                'email' => $emailClean,
                'phone' => $data['phone'] ?? null,
                'is_active' => true,
                'institution_id' => $institutionId,
            ];
            if (Schema::hasColumn('users', 'cin') && $cinClean !== '') {
                $userAttributes['cin'] = $cinClean;
            }
            if (Schema::hasColumn('users', 'cne') && $cneClean !== '') {
                $userAttributes['cne'] = $cneClean;
            }

            $plainPassword = $data['password'] ?? throw new \InvalidArgumentException('Password required');
            $userAttributes['password'] = Hash::make($plainPassword);
            $user = User::provision($userAttributes);
            $user->assignRole(Role::findOrCreate('student', 'sanctum'));

            // 3. Create or Update Application Record (Confirm Enrollment Intention)
            $app = $existingApp ?? $this->findApplicationForCandidate($cneClean, $cinClean);

            $appFields = [
                'admission_campaign_id' => $campaign ? $campaign->id : 1,
                'first_name' => $data['first_name'] ?? '',
                'last_name' => $data['last_name'] ?? '',
                'email' => $emailClean ?: ($user->email ?? ''),
                'phone' => $data['phone'] ?? null,
                'cin' => $cinClean,
                'cne' => $cneClean,
                'birth_date' => (! empty($data['birth_date']) && strtotime($data['birth_date']) !== false) ? date('Y-m-d', strtotime($data['birth_date'])) : null,
                'bac_average' => (! empty($data['bac_average']) && is_numeric($data['bac_average'])) ? (float) $data['bac_average'] : null,
                'bac_year' => $data['bac_year'] ?? date('Y'),
                'bac_series' => $data['bac_series'] ?? $data['bac_name'] ?? null,
                'status' => 'pending',
                'dossier_status' => 'draft',
                'owner_user_id' => $user->id,
                'eligibility' => 'unconfirmed',
                // Handicap / Accessibilité
                'has_disability' => $data['has_disability'] ?? false,
                'disability_type' => $data['disability_type'] ?? null,
                'disability_details' => $data['disability_details'] ?? null,
                // Parents & Contact d'urgence
                'father_phone' => $data['father_phone'] ?? null,
                'mother_phone' => $data['mother_phone'] ?? null,
                'parent_phone' => $data['parent_phone'] ?? $data['father_phone'] ?? null,
                'emergency_contact_name' => $data['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $data['emergency_contact_phone'] ?? null,
                // Fiche Médicale / Santé
                'allergy_type' => $data['allergy_type'] ?? null,
                'has_medical_followup' => $data['has_medical_followup'] ?? false,
                'medication_used' => $data['medication_used'] ?? null,
                'treating_doctor_info' => $data['treating_doctor_info'] ?? null,
            ];

            if ($app) {
                $app->update($appFields);
            } else {
                $appFields['reference_number'] = 'ENCG-APP-'.date('Y').'-'.strtoupper(substr(md5(($cneClean ?: uniqid())), 0, 6));
                $app = Application::create($appFields);
            }

            app(\App\Actions\Admission\ManageDossierAction::class)->event($app, 'account_created');
            app(\App\Services\Admissions\AdmissionNotificationService::class)->queue($app, 'account_created');

            return $user;
        });
    }

    private function findApplicationForCandidate(string $cneClean, string $cinClean): ?Application
    {
        if ($cneClean === '' && $cinClean === '') {
            return null;
        }

        if ($cneClean !== '') {
            $byCne = Application::where('cne', $cneClean)->first();
            if ($byCne) {
                $appCin = strtoupper(trim((string) ($byCne->cin ?? '')));
                if ($cinClean !== '' && $appCin !== '' && $appCin !== $cinClean) {
                    throw ValidationException::withMessages([
                        'cin' => ['Ce CNE est déjà associé à une autre CIN.'],
                    ]);
                }

                return $byCne;
            }
        }

        if ($cinClean !== '') {
            $byCin = Application::where('cin', $cinClean)->first();
            if ($byCin) {
                $appCne = strtoupper(trim((string) ($byCin->cne ?? '')));
                if ($cneClean !== '' && $appCne !== '' && $appCne !== $cneClean) {
                    throw ValidationException::withMessages([
                        'cne' => ['Cette CIN est déjà associée à un autre CNE.'],
                    ]);
                }

                return $byCin;
            }
        }

        return null;
    }
}
