<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Institution;
use App\Models\Professor;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class EnsureDemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $password = Hash::make('password');

        $guards = ['web', 'sanctum'];
        $roleNames = [
            'super-admin',
            'admin',
            'institution-admin',
            'director',
            'professor',
            'student',
            'pedagogy_officer',
            'department_head',
            'hr-officer',
            'finance-officer',
            'library-manager',
        ];

        foreach ($guards as $guard) {
            foreach ($roleNames as $roleName) {
                Role::firstOrCreate(['name' => $roleName, 'guard_name' => $guard]);
            }
        }

        $institution = Institution::first();
        $department = Department::first();

        // 1. Admin Accounts
        $admins = [
            'admin@encg-fes.ma' => 'Directeur Général (Admin)',
            'superadmin@encg-fes.ma' => 'Super Administrateur',
            'admin@encg.ma' => 'Admin Principal',
            'scolarite@encg.ma' => 'Scolarité Agent',
            'direction@encg.ma' => 'Direction Adjointe',
        ];

        foreach ($admins as $email => $name) {
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'first_name' => explode(' ', $name)[0],
                    'last_name' => explode(' ', $name)[1] ?? 'Admin',
                    'password' => $password,
                    'email_verified_at' => now(),
                    'is_active' => true,
                    'institution_id' => $institution?->id,
                ]
            );
            $user->syncRoles(['super-admin', 'admin', 'institution-admin']);
        }

        // 2. Professor Accounts
        $professors = [
            'prof@encg-fes.ma' => 'Pr. Mohammed El Amrani',
            'prof@encg.ma' => 'Pr. Karim Alami',
            'fatima.bensouda@encg-fes.ma' => 'Pr. Fatima Bensouda',
        ];

        foreach ($professors as $email => $name) {
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'first_name' => explode(' ', $name)[1] ?? 'Prof',
                    'last_name' => explode(' ', $name)[2] ?? 'ENCG',
                    'password' => $password,
                    'email_verified_at' => now(),
                    'is_active' => true,
                    'institution_id' => $institution?->id,
                ]
            );
            $user->syncRoles(['professor']);

            Professor::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'institution_id' => $institution?->id,
                    'department_id' => $department?->id,
                    'grade' => 'PES',
                    'contract_type' => 'permanent',
                    'specialty' => 'Finance & Management',
                    'hire_date' => '2016-09-01',
                    'is_active' => true,
                ]
            );
        }

        // 3. Student Accounts
        $students = [
            'student@encg-fes.ma' => ['name' => 'Yassine Bennani', 'cne' => 'N130094821', 'num' => '20240001'],
            'student@encg.ma' => ['name' => 'Anas Mansouri', 'cne' => 'N130094822', 'num' => '20240002'],
            'etudiant@encg.ma' => ['name' => 'Salma Tazi', 'cne' => 'N130094823', 'num' => '20240003'],
        ];

        foreach ($students as $email => $data) {
            $name = $data['name'];
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'first_name' => explode(' ', $name)[0],
                    'last_name' => explode(' ', $name)[1] ?? 'Étudiant',
                    'password' => $password,
                    'email_verified_at' => now(),
                    'is_active' => true,
                    'institution_id' => $institution?->id,
                ]
            );
            $user->syncRoles(['student']);

            $existingStudent = Student::where('cne', $data['cne'])
                ->orWhere('student_number', $data['num'])
                ->orWhere('user_id', $user->id)
                ->first();

            if ($existingStudent) {
                $existingStudent->update([
                    'user_id' => $user->id,
                    'institution_id' => $institution?->id,
                    'cne' => $data['cne'],
                    'student_number' => $data['num'],
                    'gender' => 'male',
                    'status' => 'active',
                ]);
            } else {
                Student::create([
                    'user_id' => $user->id,
                    'institution_id' => $institution?->id,
                    'cne' => $data['cne'],
                    'student_number' => $data['num'],
                    'gender' => 'male',
                    'status' => 'active',
                ]);
            }
        }
    }
}
