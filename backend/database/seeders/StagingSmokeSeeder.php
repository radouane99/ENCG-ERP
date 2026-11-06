<?php

namespace Database\Seeders;

use App\Models\Institution;
use App\Models\DocumentType;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class StagingSmokeSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('staging') || DB::connection()->getDatabaseName() !== 'encg_staging') {
            throw new \RuntimeException('Synthetic staging users are restricted to encg_staging.');
        }
        $password = getenv('STAGING_SMOKE_PASSWORD');
        if (! is_string($password) || strlen($password) < 24) {
            throw new \RuntimeException('Generate a separate staging smoke password first.');
        }
        $institution = Institution::firstOrCreate(['id' => (int) config('erp.institution_id', 1)], ['code' => 'ENCG-STAGING', 'name' => 'ENCG — Données synthétiques', 'slug' => 'encg-staging']);
        foreach (['student', 'professor', 'institution-admin'] as $role) {
            $user = User::firstOrProvision(['email' => $role.'@staging.example.test'], [
                'name' => 'Staging '.$role, 'first_name' => 'Staging', 'last_name' => $role,
                'institution_id' => $institution->id, 'password' => $password, 'is_active' => true,
            ]);
            $user->forceFill(['institution_id' => $institution->id])->save();
            $user->assignRole(Role::findOrCreate($role, 'sanctum'));
            if ($role === 'student') {
                $student = Student::firstOrCreate(['user_id' => $user->id], [
                    'institution_id' => $institution->id,
                    'student_number' => 'STAGING-SMOKE-01',
                    'cne' => 'S000000001',
                    'first_name' => 'Staging',
                    'last_name' => 'Étudiant synthétique',
                    'gender' => 'male',
                    'status' => 'active',
                ]);
                $this->command?->info("Synthetic student ID: {$student->id}");
            }
        }
        DocumentType::firstOrCreate(['code' => 'ATT_SCOL'], [
            'name' => 'Attestation de scolarité',
            'view_name' => 'pdf.attestation_scolarite',
            'is_active' => true,
        ]);
    }
}
