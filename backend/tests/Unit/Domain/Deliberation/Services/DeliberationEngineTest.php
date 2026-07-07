<?php

use App\Domain\Deliberation\Services\DeliberationEngine;
use App\Models\Deliberation;
use App\Models\DeliberationDecision;
use App\Models\Student;
use App\Models\Module;
use App\Models\GradeComponent;
use App\Models\Grade;
use App\Models\Institution;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\Filiere;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

// هاد السطر كيعلم Pest باش يستعمل الـ TestCase ديال لارافيل والـ RefreshDatabase
uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->engine = new DeliberationEngine();
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

it('identifies eliminatory marks based on the 7.0 threshold', function () {
    $reflection = new ReflectionClass(DeliberationEngine::class);
    $method = $reflection->getMethod('checkEliminatoryMarks');
    $method->setAccessible(true);

    // 1. Create a dummy Deliberation object (Fix for ArgumentCountError)
    $deliberation = new Deliberation();

    // No eliminatory marks
    $moduleAveragesPassing = collect([
        (object)['final_module_score' => 12.0],
        (object)['final_module_score' => 10.5],
        (object)['final_module_score' => 7.0], // Exactly 7 is not eliminatory
    ]);
    
    // 2. Pass $deliberation as the second argument
    expect($method->invoke($this->engine, $moduleAveragesPassing, $deliberation))->toBeFalse();

    // Has eliminatory mark
    $moduleAveragesEliminatory = collect([
        (object)['final_module_score' => 15.0],
        (object)['final_module_score' => 6.99], // Eliminatory
    ]);
    
    // 3. Pass $deliberation here as well
    expect($method->invoke($this->engine, $moduleAveragesEliminatory, $deliberation))->toBeTrue();
});

it('processes a full deliberation and correctly applies compensation (rachat)', function () {
    // 1. Setup Database State (Respecting the 99-table architecture)
    
    $institution = Institution::forceCreate([
        'name' => 'ENCG Fes',
        'code' => 'ENCGF',
        'slug' => 'encg-fes',
        'type' => 'grande_ecole'
    ]);

    $academicYear = AcademicYear::forceCreate([
        'institution_id' => $institution->id,
        'label' => '2025-2026',
        'start_year' => 2025,
        'end_year' => 2026,
        'start_date' => '2025-09-01',
        'end_date' => '2026-07-31'
    ]);

    $semester = Semester::forceCreate([
        'academic_year_id' => $academicYear->id,
        'name' => 'Semester 1',
        'number' => 1,
        'start_date' => '2025-09-01',
        'end_date' => '2026-01-31'
    ]);

    $filiere = Filiere::forceCreate([
        'institution_id' => $institution->id,
        'name' => 'Commerce',
        'code' => 'COM',
        'type' => 'initial'
    ]);

    $deliberation = Deliberation::forceCreate([
        'institution_id' => $institution->id,
        'academic_year_id' => $academicYear->id,
        'semester_id' => $semester->id,
        'filiere_id' => $filiere->id,
        'type' => 'normale',
        'status' => 'pending'
    ]);

    $student = Student::forceCreate([
        'institution_id' => $institution->id,
        'student_number' => 'STU12345',
        'cne' => 'N123456789',
        'gender' => 'Male'
    ]);

    // Register student
    DB::table('student_registrations')->insert([
        'student_id' => $student->id,
        'academic_year_id' => $academicYear->id,
        'filiere_id' => $filiere->id,
        'semester_number' => 1,
        'registration_type' => 'initial'
    ]);

    // Create a module
    $module = Module::forceCreate([
        'institution_id' => $institution->id,
        'filiere_id' => $filiere->id,
        'name' => 'Math',
        'code' => 'MTH01',
        'semester_number' => 1, // Correct column according to the DB schema
        'coefficient' => 1
    ]);

    // To create GradeComponent, we need an ExamSession
    $examSession = \App\Models\ExamSession::forceCreate([
        'institution_id' => $institution->id,
        'academic_year_id' => $academicYear->id,
        'semester_id' => $semester->id,
        'name' => 'Session Normale',
        'type' => 'normale',
        'start_date' => '2026-01-01',
        'end_date' => '2026-01-15'
    ]);

    $gradeComponent = GradeComponent::forceCreate([
        'module_id' => $module->id,
        'exam_session_id' => $examSession->id,
        'name' => 'Exam',
        'code' => 'EX',
        'weight' => 100 // 100% of the module
    ]);

    // Scenario: Student gets exactly 9.6 which qualifies for system Rachat (Compensation)
    Grade::forceCreate([
        'grade_component_id' => $gradeComponent->id,
        'student_id' => $student->id,
        'exam_session_id' => $examSession->id,
        'score' => 9.6,
        'final_score' => 9.6
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