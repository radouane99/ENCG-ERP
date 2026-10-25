<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Institution;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\StudentRegistration;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class RenewalCalendarE2eSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('testing') || ! str_ends_with(DB::connection()->getDatabaseName(), '_test')) {
            throw new \RuntimeException('Dedicated testing database required.');
        }
        Institution::firstOrCreate(['id' => 1], ['name' => 'ENCG Test', 'code' => 'ENCG-TEST', 'slug' => 'encg-test']);
        $year = AcademicYear::create(['institution_id' => 1, 'label' => '2026/2027', 'start_year' => 2026, 'end_year' => 2027, 'start_date' => '2026-09-01', 'end_date' => '2027-06-30', 'is_current' => true, 'is_locked' => false]);
        $filiere = Filiere::create(['institution_id' => 1, 'name' => 'Formation initiale synthétique', 'code' => 'E2E-RENEW', 'type' => 'grande_ecole', 'duration_years' => 5, 'is_active' => true]);
        foreach (['student', 'scolarite'] as $role) {
            $user = User::firstOrProvision(['email' => 'e2e.renewal.'.$role.'@example.test'], ['institution_id' => 1, 'name' => 'Synthetic '.$role, 'first_name' => 'Synthetic', 'last_name' => $role, 'password' => 'TestOnlyPassword123!', 'phone' => '0612345678', 'address' => 'Adresse synthétique', 'city' => 'Fès', 'is_active' => true]);
            $user->assignRole(Role::findOrCreate($role, 'sanctum'));
            if ($role === 'student') {
                $student = Student::create(['institution_id' => 1, 'user_id' => $user->id, 'cne' => 'SYNRENEW001', 'student_number' => 'SYN-APO-001', 'status' => 'active', 'gender' => 'male']);
                StudentPathway::create(['student_id' => $student->id, 'filiere_id' => $filiere->id, 'academic_year_id' => $year->id, 'current_semester' => 3, 'is_current' => true]);
                StudentRegistration::create(['student_id' => $student->id, 'filiere_id' => $filiere->id, 'academic_year_id' => $year->id, 'semester_number' => 3, 'registration_type' => 're_enrollment', 'status' => 'academic_validated']);
            }
        }
    }
}
