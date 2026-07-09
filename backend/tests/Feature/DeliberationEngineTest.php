<?php

use App\Models\Module;
use App\Models\Student;
use App\Models\Assessment;
use App\Models\Grade;
use App\Services\Academic\DeliberationEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('calculates average correctly and returns V (Validé) for >= 10', function () {
    $student = Student::factory()->create();
    $module = Module::factory()->create();

    $assessmentCC = Assessment::create([
        'module_id' => $module->id,
        'type' => 'CC',
        'weight' => 40
    ]);
    
    $assessmentExam = Assessment::create([
        'module_id' => $module->id,
        'type' => 'Exam',
        'weight' => 60
    ]);

    // CC = 12, Exam = 14 => Avg = (12*0.4) + (14*0.6) = 4.8 + 8.4 = 13.2
    Grade::create(['student_id' => $student->id, 'assessment_id' => $assessmentCC->id, 'value' => 12]);
    Grade::create(['student_id' => $student->id, 'assessment_id' => $assessmentExam->id, 'value' => 14]);

    $engine = new DeliberationEngine();
    $result = $engine->calculateModuleResult($student, $module);

    expect($result['average'])->toBe(13.2)
          ->and($result['status'])->toBe('V')
          ->and($result['missing_grades'])->toBeFalse();
});

it('returns RAT (Rattrapage) for average < 10', function () {
    $student = Student::factory()->create();
    $module = Module::factory()->create();

    $assessmentCC = Assessment::create(['module_id' => $module->id, 'type' => 'CC', 'weight' => 40]);
    $assessmentExam = Assessment::create(['module_id' => $module->id, 'type' => 'Exam', 'weight' => 60]);

    // CC = 10, Exam = 8 => Avg = 4 + 4.8 = 8.8
    Grade::create(['student_id' => $student->id, 'assessment_id' => $assessmentCC->id, 'value' => 10]);
    Grade::create(['student_id' => $student->id, 'assessment_id' => $assessmentExam->id, 'value' => 8]);

    $engine = new DeliberationEngine();
    $result = $engine->calculateModuleResult($student, $module);

    expect($result['average'])->toBe(8.8)
          ->and($result['status'])->toBe('RAT');
});

it('returns NV (Non Validé) if Exam is strictly eliminatory (< 5)', function () {
    $student = Student::factory()->create();
    $module = Module::factory()->create();

    $assessmentCC = Assessment::create(['module_id' => $module->id, 'type' => 'CC', 'weight' => 40]);
    $assessmentExam = Assessment::create(['module_id' => $module->id, 'type' => 'Exam', 'weight' => 60]);

    // CC = 20, Exam = 4 => Avg = 8 + 2.4 = 10.4
    // Even though avg > 10, Exam is < 5, so NV!
    Grade::create(['student_id' => $student->id, 'assessment_id' => $assessmentCC->id, 'value' => 20]);
    Grade::create(['student_id' => $student->id, 'assessment_id' => $assessmentExam->id, 'value' => 4]);

    $engine = new DeliberationEngine();
    $result = $engine->calculateModuleResult($student, $module);

    expect($result['average'])->toBe(10.4)
          ->and($result['status'])->toBe('NV');
});

it('handles missing grades', function () {
    $student = Student::factory()->create();
    $module = Module::factory()->create();

    Assessment::create(['module_id' => $module->id, 'type' => 'CC', 'weight' => 100]);

    $engine = new DeliberationEngine();
    $result = $engine->calculateModuleResult($student, $module);

    expect($result['missing_grades'])->toBeTrue()
          ->and($result['status'])->toBe('RAT'); // Avg is 0
});

it('treats absent as 0', function () {
    $student = Student::factory()->create();
    $module = Module::factory()->create();

    $assessment = Assessment::create(['module_id' => $module->id, 'type' => 'CC', 'weight' => 100]);

    Grade::create([
        'student_id' => $student->id, 
        'assessment_id' => $assessment->id, 
        'value' => 18, 
        'absent' => true // Should override 18 to 0
    ]);

    $engine = new DeliberationEngine();
    $result = $engine->calculateModuleResult($student, $module);

    expect($result['average'])->toBe(0.0);
});
