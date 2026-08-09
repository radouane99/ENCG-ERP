<?php

declare(strict_types=1);

namespace App\Domain\Auth\Services;

use App\Models\User;
use App\Models\AdmissionCampaign;
use App\Models\Institution;
use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Application;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RegisterUserService
{
    /**
     * Handle the registration of a new user and creation of their application.
     */
    public function registerUser(array $data, ?string $ipAddress = null): User
    {
        return DB::transaction(function () use ($data, $ipAddress) {
            // 1. Create or Update User
            $cneClean = strtoupper(trim($data['cne'] ?? ''));
            $cinClean = strtoupper(trim($data['cin'] ?? ''));
            $emailClean = strtolower(trim($data['email'] ?? ''));

            $user = null;
            if ($emailClean !== '') {
                $user = User::where('email', $emailClean)->first();
                if ($user) {
                    // Vérifier si cet email appartient à un autre candidat (CNE/CIN différent)
                    $userCne = strtoupper(trim($user->cne ?? ''));
                    $userCin = strtoupper(trim($user->cin ?? ''));
                    $isSameCandidate = false;

                    if ($cneClean && $userCne === $cneClean) $isSameCandidate = true;
                    if ($cinClean && $userCin === $cinClean) $isSameCandidate = true;

                    // Si le CNE/CIN ne correspond pas du tout, refuser la réutilisation du même email
                    if (!$isSameCandidate && $cneClean !== '') {
                        $studentByCne = \App\Models\Student::where('cne', $cneClean)->first();
                        if ($studentByCne && $studentByCne->user_id === $user->id) {
                            $isSameCandidate = true;
                        }
                    }

                    if (!$isSameCandidate && ($userCne !== '' || $userCin !== '')) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'email' => ['Cette adresse email est déjà utilisée par un autre candidat. Veuillez utiliser une adresse email unique.'],
                        ]);
                    }
                }
            }

            if (!$user && ($cneClean !== '' || $cinClean !== '')) {
                $existingApp = Application::where(function($q) use ($cneClean, $cinClean) {
                    if ($cneClean) $q->where('cne', $cneClean);
                    if ($cinClean) $q->orWhere('cin', $cinClean);
                })->first();

                if ($existingApp && !empty($existingApp->email)) {
                    $user = User::where('email', strtolower($existingApp->email))->first();
                }
            }

            if ($user) {
                $user->update([
                    'name' => trim(($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? '')),
                    'email' => $emailClean ?: $user->email,
                    'password' => !empty($data['password']) ? Hash::make($data['password']) : $user->password,
                    'phone' => $data['phone'] ?? $user->phone,
                    'is_active' => true,
                ]);
            } else {
                $user = User::create([
                    'name' => trim(($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? '')),
                    'email' => $emailClean ?: ('candidat_' . strtolower($cneClean ?: uniqid()) . '@encg-fes.ma'),
                    'password' => Hash::make($data['password'] ?? 'encg2026'),
                    'phone' => $data['phone'] ?? null,
                    'is_active' => true,
                ]);
            }

            // 2. Find an active Admission Campaign or create a default one
            $campaign = AdmissionCampaign::where('status', 'open')->first();
            
            if (!$campaign) {
                $institution = Institution::first();
                $academicYear = AcademicYear::where('is_current', true)->first();
                $filiereModel = Filiere::where('name', 'like', '%' . ($data['filiere'] ?? '') . '%')->first() 
                                ?? Filiere::first();

                if ($institution && $academicYear && $filiereModel) {
                    $campaign = AdmissionCampaign::create([
                        'institution_id' => $institution->id,
                        'academic_year_id' => $academicYear->id,
                        'filiere_id' => $filiereModel->id,
                        'name' => 'Campagne d\'Admission ' . $academicYear->label,
                        'status' => 'open',
                        'open_date' => now(),
                        'close_date' => now()->addMonths(2),
                        'target_capacity' => 500,
                    ]);
                }
            }

            // 3. Create or Update Application Record (Confirm Enrollment Intention)
            $app = Application::where(function($q) use ($cneClean, $cinClean) {
                if ($cneClean) $q->where('cne', $cneClean);
                if ($cinClean) $q->orWhere('cin', $cinClean);
            })->first();

            $appFields = [
                'admission_campaign_id' => $campaign ? $campaign->id : 1,
                'first_name' => $data['first_name'] ?? '',
                'last_name' => $data['last_name'] ?? '',
                'email' => $emailClean ?: ($user->email ?? ''),
                'phone' => $data['phone'] ?? null,
                'cin' => $cinClean,
                'cne' => $cneClean,
                'birth_date' => (!empty($data['birth_date']) && strtotime($data['birth_date']) !== false) ? date('Y-m-d', strtotime($data['birth_date'])) : null,
                'bac_average' => (!empty($data['bac_average']) && is_numeric($data['bac_average'])) ? (float)$data['bac_average'] : null,
                'bac_year' => $data['bac_year'] ?? date('Y'),
                'bac_series' => $data['bac_series'] ?? $data['bac_name'] ?? null,
                'status' => 'enrolled',
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
                $appFields['reference_number'] = 'ENCG-APP-' . date('Y') . '-' . strtoupper(substr(md5(($cneClean ?: uniqid())), 0, 6));
                Application::create($appFields);
            }


            // 4. Send Confirmation Notification Email to Candidate Personal Email (e.g. Gmail)
            try {
                $studentName = strtoupper(($data['last_name_fr'] ?? $data['last_name'] ?? '') . ' ' . ($data['first_name_fr'] ?? $data['first_name'] ?? ''));
                \Illuminate\Support\Facades\Mail::to($data['email'])->send(new \App\Mail\StudentRegistrationSuccessMail(
                    studentName: trim($studentName) ?: 'CANDIDAT ADMIS',
                    cne: $data['cne'] ?? 'N/A',
                    cin: $data['cin'] ?? 'N/A',
                    filiere: $data['filiere'] ?? 'DEUX ANNÉES PRÉPARATOIRES',
                    pdfPath: null,
                    academicYear: '2026-2027'
                ));
            } catch (\Exception $e) {
                // Log email error gracefully without rolling back transaction
                \Illuminate\Support\Facades\Log::warning("Erreur lors de l'envoi de l'email de confirmation à {$data['email']}: " . $e->getMessage());
            }

            return $user;
        });
    }
}
