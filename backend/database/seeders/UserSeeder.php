<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Professor;
use App\Models\Student;
use App\Models\Department;
use App\Models\Institution;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('fr_FR');
        $password = Hash::make('password');

        // 1. ADMINS
        $adminUsers = [
            [
                'name' => 'Admin Principal',
                'first_name' => 'Admin',
                'last_name' => 'Principal',
                'email' => 'admin@encg.ma',
                'password' => $password,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Scolarité Agent',
                'first_name' => 'Scolarité',
                'last_name' => 'Agent',
                'email' => 'scolarite@encg.ma',
                'password' => $password,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Direction Adjointe',
                'first_name' => 'Direction',
                'last_name' => 'Adjointe',
                'email' => 'direction@encg.ma',
                'password' => $password,
                'email_verified_at' => now(),
            ],
        ];

        foreach ($adminUsers as $adminData) {
            $user = User::create($adminData);
            $user->assignRole('super-admin');
        }

        // 2. PROFESSORS
        $institution = Institution::first();
        $departments = Department::all();

        // Main Prof
        $profUser = User::create([
            'name' => 'Professeur Test',
            'first_name' => 'Professeur',
            'last_name' => 'Test',
            'email' => 'prof@encg.ma',
            'password' => $password,
            'email_verified_at' => now(),
        ]);
        $profUser->assignRole('professor');

        Professor::create([
            'user_id' => $profUser->id,
            'institution_id' => $institution->id,
            'department_id' => $departments->random()->id,
            'specialty' => 'Informatique',
            'hire_date' => now()->subYears(rand(1, 15))->format('Y-m-d'),
            'is_active' => true,
            'grade' => 'PES',
            'contract_type' => 'permanent',
            'email' => 'prof@encg.ma',
        ]);

        for ($i = 0; $i < 14; $i++) {
            $firstName = $faker->firstName;
            $lastName = $faker->lastName;
            $u = User::create([
                'name' => "{$firstName} {$lastName}",
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $faker->unique()->safeEmail,
                'password' => $password,
                'email_verified_at' => now(),
            ]);
            $u->assignRole('professor');

            Professor::create([
                'user_id' => $u->id,
                'institution_id' => $institution->id,
                'department_id' => $departments->random()->id,
                'specialty' => $faker->word,
                'hire_date' => $faker->date(),
                'is_active' => true,
                'grade' => $faker->randomElement(['PA', 'PH', 'PES']),
                'contract_type' => 'permanent',
                'email' => $u->email,
            ]);
        }

        // 3. STUDENTS
        $studentUser = User::create([
            'name' => 'Student Test',
            'first_name' => 'Student',
            'last_name' => 'Test',
            'email' => 'student@encg.ma',
            'password' => $password,
            'email_verified_at' => now(),
        ]);
        $studentUser->assignRole('student');

        Student::create([
            'user_id' => $studentUser->id,
            'institution_id' => $institution->id,
            'cne' => 'N123456789',
            'student_number' => '1234567',
            'birth_date' => '2000-01-01',
            'birth_city' => 'Fès',
            'nationality' => 'Marocaine',
            'gender' => 'M',
            'status' => 'active',
            'email' => 'student@encg.ma',
        ]);

        for ($i = 0; $i < 99; $i++) {
            $firstName = $faker->firstName;
            $lastName = $faker->lastName;
            $u = User::create([
                'name' => "{$firstName} {$lastName}",
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => "student{$i}@encg.ma",
                'password' => $password,
                'email_verified_at' => now(),
            ]);
            $u->assignRole('student');

            Student::create([
                'user_id' => $u->id,
                'institution_id' => $institution->id,
                'cne' => 'N' . $faker->randomNumber(9, true),
                'student_number' => (string) $faker->randomNumber(7, true),
                'birth_date' => $faker->date('Y-m-d', '2005-01-01'),
                'birth_city' => $faker->city,
                'nationality' => 'Marocaine',
                'gender' => $faker->randomElement(['M', 'F']),
                'status' => 'active',
                'email' => $u->email,
            ]);
        }
    }
}
