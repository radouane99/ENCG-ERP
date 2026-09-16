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
            'admin@encg-fes.ma' => ['name' => 'Directeur Général (Admin)', 'name_ar' => 'المدير العام (مشرف)'],
            'superadmin@encg-fes.ma' => ['name' => 'Super Administrateur', 'name_ar' => 'المشرف العام'],
            'admin@encg.ma' => ['name' => 'Admin Principal', 'name_ar' => 'المشرف الرئيسي'],
            'scolarite@encg.ma' => ['name' => 'Scolarité Agent', 'name_ar' => 'مصلحة الشؤون الطلابية'],
            'direction@encg.ma' => ['name' => 'Direction Adjointe', 'name_ar' => 'إدارة المؤسسة'],
        ];

        foreach ($admins as $email => $data) {
            $name = $data['name'];
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'name_ar' => $data['name_ar'],
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
            'prof@encg-fes.ma' => ['name' => 'Pr. Mohammed El Amrani', 'name_ar' => 'د. محمد العمراني'],
            'prof@encg.ma' => ['name' => 'Pr. Karim Alami', 'name_ar' => 'د. كريم العلمي'],
            'fatima.bensouda@encg-fes.ma' => ['name' => 'Pr. Fatima Bensouda', 'name_ar' => 'د. فاطمة بنسودة'],
        ];

        foreach ($professors as $email => $pData) {
            $name = $pData['name'];
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'name_ar' => $pData['name_ar'],
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
            'student@encg-fes.ma' => ['name' => 'Yassine Bennani', 'name_ar' => 'ياسين بناني', 'first_ar' => 'ياسين', 'last_ar' => 'بناني', 'cne' => 'N130094821', 'num' => '20240001'],
            'student@encg.ma' => ['name' => 'Anas Mansouri', 'name_ar' => 'أنس المنصوري', 'first_ar' => 'أنس', 'last_ar' => 'المنصوري', 'cne' => 'N130094822', 'num' => '20240002'],
            'etudiant@encg.ma' => ['name' => 'Salma Tazi', 'name_ar' => 'سلمى التازي', 'first_ar' => 'سلمى', 'last_ar' => 'التازي', 'cne' => 'N130094823', 'num' => '20240003'],
        ];

        foreach ($students as $email => $data) {
            $name = $data['name'];
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'name_ar' => $data['name_ar'],
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

            $studentPayload = [
                'user_id' => $user->id,
                'institution_id' => $institution?->id,
                'cne' => $data['cne'],
                'student_number' => $data['num'],
                'first_name_ar' => $data['first_ar'],
                'last_name_ar' => $data['last_ar'],
                'gender' => 'male',
                'status' => 'active',
            ];

            if ($existingStudent) {
                $existingStudent->update($studentPayload);
            } else {
                Student::create($studentPayload);
            }
        }
    }
}
