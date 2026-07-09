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
                ]);
            }

            // Record login
            $user->update([
                'last_login_at' => now(),
                'last_login_ip' => $ipAddress
            ]);

            return $user;
        });
    }
}
