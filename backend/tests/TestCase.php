<?php

namespace Tests;

use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Institution;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Semester;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected bool $seed = false;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureInstitution();
    }

    protected function ensureInstitution(): Institution
    {
        $existing = Institution::query()->find(1);
        if ($existing) {
            return $existing;
        }

        $institution = new Institution([
            'name' => 'ENCG Fès',
            'code' => 'ENCG_FES',
            'slug' => 'encg-fes',
            'city' => 'Fès',
            'type' => 'grande_ecole',
        ]);
        $institution->id = 1;
        $institution->save();

        return $institution;
    }

    protected function ensureAcademicYear(array $overrides = []): AcademicYear
    {
        $existing = AcademicYear::query()->find(1);
        if ($existing) {
            return $existing;
        }

        $year = new AcademicYear(array_merge([
            'institution_id' => 1,
            'label' => '2026/2027',
            'start_year' => 2026,
            'end_year' => 2027,
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
            'is_current' => true,
            'is_locked' => false,
        ], $overrides));
        $year->id = 1;
        $year->save();

        return $year;
    }

    protected function makeTestAcademicYear(array $overrides = []): AcademicYear
    {
        unset($overrides['id']);

        return AcademicYear::create(array_merge([
            'institution_id' => 1,
            'label' => '2026/2027',
            'start_year' => 2026,
            'end_year' => 2027,
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
            'is_current' => true,
            'is_locked' => false,
        ], $overrides));
    }

    protected function makeTestFiliere(array $overrides = []): Filiere
    {
        return Filiere::create(array_merge([
            'institution_id' => 1,
            'name' => 'Tronc Commun ENCG',
            'code' => 'TC_'.uniqid(),
            'type' => 'grande_ecole',
            'duration_years' => 5,
            'is_active' => true,
        ], $overrides));
    }

    protected function makeTestStudent(array $overrides = []): Student
    {
        $firstName = $overrides['first_name'] ?? 'Karim';
        $lastName = $overrides['last_name'] ?? 'BENNANI';
        unset($overrides['first_name'], $overrides['last_name']);

        $user = $overrides['user'] ?? User::factory()->create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'name' => "{$firstName} {$lastName}",
        ]);
        unset($overrides['user']);

        return Student::create(array_merge([
            'institution_id' => 1,
            'user_id' => $user->id,
            'student_number' => 'STU-'.uniqid(),
            'cne' => 'N'.rand(100000000, 999999999),
            'gender' => 'male',
            'status' => 'active',
        ], $overrides));
    }

    protected function makeTestModule(int $filiereId, array $overrides = []): Module
    {
        return Module::create(array_merge([
            'institution_id' => 1,
            'filiere_id' => $filiereId,
            'name' => 'Management Stratégique',
            'code' => 'MOD_'.uniqid(),
            'semester_number' => 1,
            'coefficient' => 1.0,
            'credit_hours' => 48.0,
        ], $overrides));
    }

    protected function makeTestSemester(int $academicYearId, array $overrides = []): Semester
    {
        return Semester::create(array_merge([
            'academic_year_id' => $academicYearId,
            'name' => 'Semestre 1',
            'number' => 1,
            'start_date' => '2026-09-01',
            'end_date' => '2027-01-31',
            'is_current' => true,
        ], $overrides));
    }

    protected function makeTestProfessor(array $overrides = []): Professor
    {
        $firstName = $overrides['first_name'] ?? 'Rachid';
        $lastName = $overrides['last_name'] ?? 'EL AMRANI';
        $email = $overrides['email'] ?? fake()->unique()->safeEmail();
        unset($overrides['first_name'], $overrides['last_name'], $overrides['email']);

        $user = $overrides['user'] ?? User::factory()->create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'name' => "{$firstName} {$lastName}",
        ]);
        unset($overrides['user']);

        return Professor::create(array_merge([
            'institution_id' => 1,
            'user_id' => $user->id,
            'employee_number' => 'PROF-'.uniqid(),
            'grade' => 'PES',
            'contract_type' => 'permanent',
            'hire_date' => '2020-09-01',
            'is_active' => true,
        ], $overrides));
    }
}
