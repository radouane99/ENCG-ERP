<?php

use App\Domain\Deliberation\Services\DeliberationEngine;
use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Deliberation;
use App\Models\DeliberationDecision;
use App\Models\ExamSession;
use App\Models\Filiere;
use App\Models\Grade;
use App\Models\GradeComponent;
use App\Models\Institution;
use App\Models\Module;
use App\Models\Semester;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

// هاد السطر كيعلم Pest باش يستعمل الـ TestCase ديال لارافيل والـ RefreshDatabase
uses(TestCase::class, RefreshDatabase::class)->group('lmd');

beforeEach(function () {
    $this->engine = new DeliberationEngine;
});

it('calculates the mention correctly', function () {
    // We use reflection to test the private calculateMention method
    $reflection = new ReflectionClass(DeliberationEngine::class);
    $method = $reflection->getMethod('calculateMention');
    $method->setAccessible(true);

    expect($method->invoke($this->engine, 9.99))->toBeNull();
    expect($method->invoke($this->engine, 10.00))->toBe('Passable');
    expect($method->invoke($this->engine, 11.99))->toBe('Passable');
    expect($method->invoke($this->engine, 12.00))->toBe('Assez Bien');
    expect($method->invoke($this->engine, 13.99))->toBe('Assez Bien');
    expect($method->invoke($this->engine, 14.00))->toBe('Bien');
    expect($method->invoke($this->engine, 15.99))->toBe('Bien');
    expect($method->invoke($this->engine, 16.00))->toBe('Très Bien');
    expect($method->invoke($this->engine, 18.50))->toBe('Très Bien');
});

it('treats only final exam types as rattrapage-replaceable, not CC2', function () {
    $reflection = new ReflectionClass(DeliberationEngine::class);
    $method = $reflection->getMethod('isExamComponentType');
    $method->setAccessible(true);

    expect($method->invoke($this->engine, 'exam'))->toBeTrue();
    expect($method->invoke($this->engine, 'examen_final'))->toBeTrue();
    expect($method->invoke($this->engine, 'CC2'))->toBeFalse();
    expect($method->invoke($this->engine, 'cc1'))->toBeFalse();
    expect($method->invoke($this->engine, 'tp'))->toBeFalse();
});

it('applies rattrapage only to the final exam component, not to CC2', function () {
    $institution = Institution::firstOrCreate(
        ['slug' => 'encg-fes'],
        ['name' => 'ENCG Fes', 'code' => 'ENCGF', 'type' => 'grande_ecole']
    );

    $academicYear = AcademicYear::firstOrCreate(
        ['label' => '2025-2026'],
        [
            'institution_id' => $institution->id,
            'start_year' => 2025,
            'end_year' => 2026,
            'start_date' => '2025-09-01',
            'end_date' => '2026-07-31',
        ]
    );

    $semester = Semester::firstOrCreate(
        ['academic_year_id' => $academicYear->id, 'number' => 1],
        ['name' => 'Semester 1', 'start_date' => '2025-09-01', 'end_date' => '2026-01-31']
    );

    $filiere = Filiere::firstOrCreate(
        ['code' => 'COM'],
        ['institution_id' => $institution->id, 'name' => 'Commerce', 'type' => 'initial']
    );

    $deliberation = Deliberation::forceCreate([
        'institution_id' => $institution->id,
        'academic_year_id' => $academicYear->id,
        'semester_id' => $semester->id,
        'filiere_id' => $filiere->id,
        'type' => 'RATTRAPAGE',
        'status' => 'pending',
    ]);

    $student = Student::forceCreate([
        'institution_id' => $institution->id,
        'student_number' => 'STU-RAT-CC2',
        'cne' => 'N987654321',
        'gender' => 'Female',
    ]);

    DB::table('student_registrations')->insert([
        'student_id' => $student->id,
        'academic_year_id' => $academicYear->id,
        'filiere_id' => $filiere->id,
        'semester_number' => 1,
        'registration_type' => 'initial',
    ]);

    $module = Module::forceCreate([
        'institution_id' => $institution->id,
        'filiere_id' => $filiere->id,
        'name' => 'Comptabilité',
        'code' => 'CPT01',
        'semester_number' => 1,
        'coefficient' => 1,
    ]);

    $cc2 = Assessment::forceCreate(['module_id' => $module->id, 'type' => 'cc2', 'weight' => 40]);
    $exam = Assessment::forceCreate(['module_id' => $module->id, 'type' => 'examen_final', 'weight' => 60]);
    $resit = Assessment::forceCreate(['module_id' => $module->id, 'type' => 'rattrapage', 'weight' => 0]);

    Grade::forceCreate(['assessment_id' => $cc2->id, 'student_id' => $student->id, 'value' => 8]);
    Grade::forceCreate(['assessment_id' => $exam->id, 'student_id' => $student->id, 'value' => 7]);
    Grade::forceCreate(['assessment_id' => $resit->id, 'student_id' => $student->id, 'value' => 16]);

    $this->engine->processDeliberation($deliberation);

    $decision = DeliberationDecision::where('student_id', $student->id)
        ->where('deliberation_id', $deliberation->id)
        ->first();

    // CC2 stays 8; only the exam is replaced: 8*0.4 + max(7,16)*0.6 = 12.8
    // Wrong CC2 replacement would yield 16.0
    expect($decision)->not->toBeNull();
    expect((float) $decision->semester_average)->toEqual(12.8);
});

it('identifies eliminatory marks based on the 6.0 threshold', function () {
    $reflection = new ReflectionClass(DeliberationEngine::class);
    $method = $reflection->getMethod('checkEliminatoryMarks');
    $method->setAccessible(true);

    $moduleAveragesPassing = collect([
        (object) ['final_module_score' => 12.0],
        (object) ['final_module_score' => 10.5],
        (object) ['final_module_score' => 6.0],
    ]);

    expect($method->invoke($this->engine, $moduleAveragesPassing))->toBeFalse();

    $moduleAveragesEliminatory = collect([
        (object) ['final_module_score' => 15.0],
        (object) ['final_module_score' => 5.99],
    ]);

    expect($method->invoke($this->engine, $moduleAveragesEliminatory))->toBeTrue();
});

it('processes a full deliberation and correctly applies compensation (rachat)', function () {
    // 1. Setup Database State (Respecting the 99-table architecture)

    $institution = Institution::firstOrCreate(
        ['slug' => 'encg-fes'],
        [
            'name' => 'ENCG Fes',
            'code' => 'ENCGF',
            'type' => 'grande_ecole',
        ]
    );

    $academicYear = AcademicYear::firstOrCreate(
        ['label' => '2025-2026'],
        [
            'institution_id' => $institution->id,
            'start_year' => 2025,
            'end_year' => 2026,
            'start_date' => '2025-09-01',
            'end_date' => '2026-07-31',
        ]
    );

    $semester = Semester::firstOrCreate(
        ['academic_year_id' => $academicYear->id, 'number' => 1],
        [
            'name' => 'Semester 1',
            'start_date' => '2025-09-01',
            'end_date' => '2026-01-31',
        ]
    );

    $filiere = Filiere::firstOrCreate(
        ['code' => 'COM'],
        [
            'institution_id' => $institution->id,
            'name' => 'Commerce',
            'type' => 'initial',
        ]
    );

    $deliberation = Deliberation::forceCreate([
        'institution_id' => $institution->id,
        'academic_year_id' => $academicYear->id,
        'semester_id' => $semester->id,
        'filiere_id' => $filiere->id,
        'type' => 'normale',
        'status' => 'pending',
    ]);

    $student = Student::forceCreate([
        'institution_id' => $institution->id,
        'student_number' => 'STU12345',
        'cne' => 'N123456789',
        'gender' => 'Male',
    ]);

    // Register student
    DB::table('student_registrations')->insert([
        'student_id' => $student->id,
        'academic_year_id' => $academicYear->id,
        'filiere_id' => $filiere->id,
        'semester_number' => 1,
        'registration_type' => 'initial',
    ]);

    // Create a module
    $module = Module::forceCreate([
        'institution_id' => $institution->id,
        'filiere_id' => $filiere->id,
        'name' => 'Math',
        'code' => 'MTH01',
        'semester_number' => 1, // Correct column according to the DB schema
        'coefficient' => 1,
    ]);

    // To create GradeComponent, we need an ExamSession
    $examSession = ExamSession::forceCreate([
        'institution_id' => $institution->id,
        'academic_year_id' => $academicYear->id,
        'semester_id' => $semester->id,
        'name' => 'Session Normale',
        'type' => 'normale',
        'start_date' => '2026-01-01',
        'end_date' => '2026-01-15',
    ]);

    $assessment = Assessment::forceCreate([
        'module_id' => $module->id,
        'type' => 'Exam',
        'weight' => 100, // 100% of the module
    ]);

    // Scenario: Student gets exactly 9.6 which qualifies for system Rachat (Compensation)
    Grade::forceCreate([
        'assessment_id' => $assessment->id,
        'student_id' => $student->id,
        'value' => 9.6,
    ]);

    // 2. Process Deliberation
    $this->engine->processDeliberation($deliberation);

    // 3. Assertions
    $decision = DeliberationDecision::where('student_id', $student->id)
        ->where('deliberation_id', $deliberation->id)
        ->first();

    expect($decision)->not->toBeNull();
    expect((float) $decision->semester_average)->toEqual(9.6);
    expect($decision->decision)->toBe('admitted');
    expect((bool) $decision->was_compensated)->toBeTrue();
    expect((float) $decision->compensated_average)->toEqual(10.00);
    expect($decision->mention)->toBe('Passable');

    // Status should be updated
    expect($deliberation->fresh()->status)->toBe('completed');
});
