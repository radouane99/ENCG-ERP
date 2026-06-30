<?php

use App\Domain\Deliberation\Services\DeliberationEngine;
use App\Models\Deliberation;
use App\Models\DeliberationDecision;
use App\Models\Student;
use App\Models\Registration;
use App\Models\Module;
use App\Models\GradeComponent;
use App\Models\Grade;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

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

    $deliberation = new Deliberation();

    // No eliminatory marks
    $moduleAveragesPassing = collect([
        (object)['final_module_score' => 12.0],
        (object)['final_module_score' => 10.5],
        (object)['final_module_score' => 7.0], // Exactly 7 is not eliminatory
    ]);
    expect($method->invoke($this->engine, $moduleAveragesPassing, $deliberation))->toBeFalse();

    // Has eliminatory mark
    $moduleAveragesEliminatory = collect([
        (object)['final_module_score' => 15.0],
        (object)['final_module_score' => 6.99], // Eliminatory
    ]);
    expect($method->invoke($this->engine, $moduleAveragesEliminatory, $deliberation))->toBeTrue();
});

it('processes a full deliberation and correctly applies compensation (rachat)', function () {
    // 1. Setup minimal database state
    $academicYearId = 1;
    $semesterId = 1;
    $filiereId = 1;

    $deliberation = Deliberation::forceCreate([
        'academic_year_id' => $academicYearId,
        'semester_id' => $semesterId,
        'filiere_id' => $filiereId,
        'status' => 'pending'
    ]);

    $student = Student::forceCreate([
        'cne' => 'N123456789',
        'first_name' => 'Youssef',
        'last_name' => 'El Amrani',
        'birth_date' => '2000-01-01',
    ]);

    // Register student
    DB::table('registrations')->insert([
        'student_id' => $student->id,
        'academic_year_id' => $academicYearId,
        'filiere_id' => $filiereId,
    ]);

    // Create a module
    $module = Module::forceCreate([
        'semester_id' => $semesterId,
        'name' => 'Math',
        'coefficient' => 1
    ]);

    $gradeComponent = GradeComponent::forceCreate([
        'module_id' => $module->id,
        'name' => 'Exam',
        'weight' => 100 // 100% of the module
    ]);

    // Scenario: Student gets exactly 9.6 which qualifies for system Rachat (Compensation)
    Grade::forceCreate([
        'student_id' => $student->id,
        'grade_component_id' => $gradeComponent->id,
        'score' => 9.6,
    ]);

    // 2. Process Deliberation
    $this->engine->processDeliberation($deliberation);

    // 3. Assertions
    $decision = DeliberationDecision::where('student_id', $student->id)
        ->where('deliberation_id', $deliberation->id)
        ->first();

    expect($decision)->not->toBeNull();
    expect($decision->semester_average)->toBe(9.6);
    expect($decision->decision)->toBe('admitted');
    expect($decision->was_compensated)->toBeTrue();
    expect($decision->compensated_average)->toBe(10.00);
    expect($decision->mention)->toBe('Passable');
    
    // Status should be updated
    expect($deliberation->fresh()->status)->toBe('completed');
});
