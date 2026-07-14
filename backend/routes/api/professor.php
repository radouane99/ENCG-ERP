<?php

use Illuminate\Support\Facades\Route;

// Professor API
Route::middleware(['auth:sanctum', 'role:professor|vacataire'])->prefix('v1/professor')->group(function () {
    Route::post('/attendance/session', [\App\Http\Controllers\Api\AttendanceController::class, 'createSession']);
    Route::get('/attendance/session/{id}/stats', [\App\Http\Controllers\Api\AttendanceController::class, 'sessionStats']);
    
    // Grade Grid Entry
    Route::get('/grades/grid', [\App\Http\Controllers\Api\GradeGridController::class, 'getGrid']);
    Route::post('/grades/save', [\App\Http\Controllers\Api\GradeGridController::class, 'saveGrades']);

    // Apogée Deliberation Engine - Grade Entry
    Route::post('/assessments/{assessment}/grades', [\App\Http\Controllers\Api\GradeController::class, 'storeBulk']);
    Route::get('/assessments/{assessment}/grades', [\App\Http\Controllers\Api\GradeController::class, 'getForAssessment']);
});

Route::middleware(['auth:sanctum', 'role:professor|vacataire'])->group(function () {
    // Professor Availability
    Route::prefix('professor-availability')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ProfessorAvailabilityController::class, 'index']);
        Route::post('/alert', [\App\Http\Controllers\Api\ProfessorAvailabilityController::class, 'alert']);
    });
    
    // AI Tools for Professor
    Route::post('/professor/ai/generate-qcm', [\App\Http\Controllers\Api\AiAssistantController::class, 'generateQuiz']);
    Route::post('/professor/smart-grading/process', [\App\Http\Controllers\Api\Professor\SmartGradingController::class, 'process']);
    Route::post('/professor/smart-grading/export', [\App\Http\Controllers\Api\Professor\SmartGradingController::class, 'export']);
    
    // PDF Exports for Professor
    Route::get('/professor/exams/{exam}/pv/pdf', [\App\Http\Controllers\Api\PdfExportController::class, 'pvExamen']);

    // Attendance Module
    Route::prefix('professor/attendance')->group(function () {
        Route::post('/start', [\App\Http\Controllers\Api\Professor\ProfessorAttendanceController::class, 'startSession']);
        Route::post('/{session}/manual-call', [\App\Http\Controllers\Api\Professor\ProfessorAttendanceController::class, 'manualCall']);
        Route::post('/{session}/close', [\App\Http\Controllers\Api\Professor\ProfessorAttendanceController::class, 'closeSession']);
    });

    // Internships
    Route::prefix('professor/internships')->group(function () {
        Route::get('/supervised', [\App\Http\Controllers\Api\Professor\ProfessorInternshipController::class, 'supervised']);
        Route::post('/soutenances/{id}/evaluate', [\App\Http\Controllers\Api\Professor\ProfessorInternshipController::class, 'evaluate']);
    });
});