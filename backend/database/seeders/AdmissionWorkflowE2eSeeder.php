<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\AdmissionCampaign;
use App\Models\Application;
use App\Models\Department;
use App\Models\Filiere;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class AdmissionWorkflowE2eSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('testing') || ! str_ends_with((string) DB::connection()->getDatabaseName(), '_test')) throw new \RuntimeException('Dedicated testing database required.');
        Institution::firstOrCreate(['id' => 1], ['name' => 'ENCG Test', 'code' => 'ENCG-TEST', 'slug' => 'encg-test']);
        $year = AcademicYear::firstOrCreate(['institution_id' => 1, 'start_year' => 2026], ['label' => '2026/2027', 'end_year' => 2027,
            'start_date' => '2026-09-01', 'end_date' => '2027-06-30', 'is_current' => true]);
        $department = Department::firstOrCreate(['institution_id' => 1, 'code' => 'E2E'], ['name' => 'Test department']);
        $filiere = Filiere::firstOrCreate(['institution_id' => 1, 'code' => 'E2E-TC'], ['department_id' => $department->id, 'name' => 'Tronc commun test', 'duration_years' => 2, 'type' => 'grande_ecole']);
        $campaign = AdmissionCampaign::create(['institution_id' => 1, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id,
            'name' => 'Campagne synthétique E2E', 'status' => 'open', 'open_date' => now()->subMonth(), 'close_date' => now()->addMonth(), 'target_capacity' => 10]);
        $user = User::firstOrProvision(['email' => 'e2e.candidate@example.test'], ['name' => 'Synthetic Candidate', 'first_name' => 'Synthetic',
            'last_name' => 'Candidate', 'cin' => 'XY123456', 'institution_id' => 1, 'password' => 'TestOnlyPassword123!', 'is_active' => true]);
        $user->assignRole(Role::findOrCreate('student', 'sanctum'));
        Application::create(['admission_campaign_id' => $campaign->id, 'reference_number' => 'E2E-TAFEM-001', 'cne' => 'Z123456789', 'cin' => 'XY123456',
            'owner_user_id' => $user->id, 'first_name' => 'Synthetic', 'last_name' => 'Candidate', 'email' => $user->email,
            'status' => 'pending', 'dossier_status' => 'draft', 'eligibility' => 'main', 'ranking' => 1, 'selection_score' => 170,
            'official_rank_source' => 'e2e-fixture', 'contact_verified_at' => now(),
            'profile' => ['phone' => '0612345678', 'birth_date' => '2006-02-12', 'address' => 'Adresse synthétique', 'gender' => 'female', 'bac_average' => 16.5, 'bac_year' => 2026]]);
        $admin = User::firstOrProvision(['email' => 'e2e.admissions.admin@example.test'], ['name' => 'Admissions Test', 'first_name' => 'Admissions',
            'last_name' => 'Test', 'institution_id' => 1, 'password' => 'TestOnlyPassword123!', 'is_active' => true]);
        $admin->assignRole(Role::findOrCreate('scolarite', 'sanctum'));
    }
}
