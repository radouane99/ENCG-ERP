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
            // 1. Create User
            $user = User::create([
                'name' => $data['first_name'] . ' ' . $data['last_name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'phone' => $data['phone'],
                'is_active' => true,
            ]);

            // 2. Find an active Admission Campaign or create a default one
            $campaign = AdmissionCampaign::where('status', 'open')->first();
            
            if (!$campaign) {
                $institution = Institution::first();
                $academicYear = AcademicYear::where('is_current', true)->first();
                $filiereModel = Filiere::where('name', 'like', '%' . $data['filiere'] . '%')->first() 
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

            if ($campaign) {
                // 3. Create Application
                Application::create([
                    'admission_campaign_id' => $campaign->id,
                    'reference_number' => 'ENCG-APP-' . date('Y') . '-' . strtoupper(uniqid()),
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'cin' => $data['cin'],
                    'cne' => $data['cne'],
                    'birth_date' => $data['birth_date'],
                    'bac_average' => $data['bac_average'],
                    'bac_year' => $data['bac_year'],
                    'bac_series' => $data['bac_series'],
                    'status' => 'submitted',
                    // Handicap / Accessibilité (MESRSFC / RAMED)
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
                ]);
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
