<?php

use Illuminate\Support\Facades\Route;

// Professor API — Accessible to Professors, Vacataires, and Academic Coordinators/Admins
Route::middleware(['auth:sanctum', 'role:professor|vacataire|department-head|filiere-head|super-admin|institution-admin|director'])->prefix('v1/professor')->group(function () {
    Route::post('/attendance/session', [\App\Http\Controllers\Api\AttendanceController::class, 'createSession']);
    Route::get('/attendance/session/{id}/stats', [\App\Http\Controllers\Api\AttendanceController::class, 'sessionStats']);
    
    // Grade Grid Entry
    Route::get('/grades/grid', [\App\Http\Controllers\Api\GradeGridController::class, 'getGrid']);
    Route::post('/grades/save', [\App\Http\Controllers\Api\GradeGridController::class, 'saveGrades']);

    // Apogée Deliberation Engine - Grade Entry
    Route::post('/assessments/{assessment}/grades', [\App\Http\Controllers\Api\GradeController::class, 'storeBulk']);
    
    // Professor AI Suite
    Route::prefix('ai')->group(function () {
        Route::post('generate-exam', [\App\Http\Controllers\Api\ProfessorAiController::class, 'generateExam']);
        Route::get('class-analytics/{moduleId}', [\App\Http\Controllers\Api\ProfessorAiController::class, 'getClassAnalytics']);
        Route::post('copilot', [\App\Http\Controllers\Api\ProfessorAiController::class, 'copilotQuery']);
        Route::post('grade-report', [\App\Http\Controllers\Api\ProfessorAiController::class, 'gradeReport']);
    });

    Route::prefix('copilot')->group(function () {
        Route::post('textbook-outline', [\App\Http\Controllers\Api\ProfessorAiCopilotController::class, 'generateTextbookOutline']);
        Route::post('generate-exam-paper', [\App\Http\Controllers\Api\ProfessorAiCopilotController::class, 'generateExamPaper']);
    });
});

Route::middleware(['auth:sanctum', 'role:professor|vacataire|department-head|filiere-head|super-admin|institution-admin|director'])->group(function () {
    // Dashboard Stats
    Route::get('/dashboard/professor/stats', [\App\Http\Controllers\Api\DashboardController::class, 'getProfessorStats']);
    Route::get('/professor/dashboard/stats', [\App\Http\Controllers\Api\DashboardController::class, 'getProfessorStats']);

    // Professor Availability
    Route::prefix('professor-availability')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ProfessorAvailabilityController::class, 'index']);
        Route::post('/alert', [\App\Http\Controllers\Api\ProfessorAvailabilityController::class, 'alert']);
        Route::get('/my', [\App\Http\Controllers\Api\ProfessorAvailabilityController::class, 'myAvailability']);
        Route::post('/my', [\App\Http\Controllers\Api\ProfessorAvailabilityController::class, 'saveMyAvailability']);
    });
    Route::get('/professor/availability/my', [\App\Http\Controllers\Api\ProfessorAvailabilityController::class, 'myAvailability']);
    Route::post('/professor/availability/my', [\App\Http\Controllers\Api\ProfessorAvailabilityController::class, 'saveMyAvailability']);
    
    // AI Tools for Professor
    Route::post('/professor/ai/generate-qcm', [\App\Http\Controllers\Api\AiAssistantController::class, 'generateQuiz']);
    Route::post('/professor/ai/grade-report', [\App\Http\Controllers\Api\ProfessorAiController::class, 'gradeReport']);
    Route::post('/professor/smart-grading/process', [\App\Http\Controllers\Api\Professor\SmartGradingController::class, 'process']);
    Route::post('/professor/smart-grading/export', [\App\Http\Controllers\Api\Professor\SmartGradingController::class, 'export']);
    
    // PDF Exports for Professor
    Route::get('/professor/exams/{exam}/pv/pdf', [\App\Http\Controllers\Api\PdfExportController::class, 'pvExamen']);

    // Attendance Module
    Route::prefix('professor/attendance')->group(function () {
        Route::post('/start', [\App\Http\Controllers\Api\Professor\ProfessorAttendanceController::class, 'startSession']);
        Route::post('/{session}/manual-call', [\App\Http\Controllers\Api\Professor\ProfessorAttendanceController::class, 'manualCall']);
        Route::post('/{session}/scan', [\App\Http\Controllers\Api\Professor\ProfessorAttendanceController::class, 'scanQrCode']);
        Route::post('/{session}/close', [\App\Http\Controllers\Api\Professor\ProfessorAttendanceController::class, 'closeSession']);
    });

    // Internships
    Route::prefix('professor/internships')->group(function () {
        Route::get('/supervised', [\App\Http\Controllers\Api\Professor\ProfessorInternshipController::class, 'supervised']);
        Route::post('/soutenances/{id}/evaluate', [\App\Http\Controllers\Api\Professor\ProfessorInternshipController::class, 'evaluate']);
        Route::post('/update-status', [\App\Http\Controllers\Api\Professor\ProfessorInternshipController::class, 'updateStatus']);
    });

    // Portal
    Route::get('/professor-portal/schedule', [\App\Http\Controllers\Api\Professor\ProfessorPortalController::class, 'getSchedule']);
    Route::get('/professor-portal/reservations', [\App\Http\Controllers\Api\Professor\ProfessorPortalController::class, 'getReservations']);
    Route::post('/professor-portal/reservations', [\App\Http\Controllers\Api\RoomBookingController::class, 'store']);
    Route::get('/professor-portal/analytics', [\App\Http\Controllers\Api\Professor\ProfessorPortalController::class, 'getAnalytics']);
    Route::get('/professor-portal/workload', [\App\Http\Controllers\Api\Professor\ProfessorPortalController::class, 'getWorkloadSummary']);
    Route::get('/professor-portal/research', [\App\Http\Controllers\Api\Professor\ProfessorPortalController::class, 'getResearchDashboard']);
    Route::get('/professor-portal/double-grading', [\App\Http\Controllers\Api\Professor\ProfessorPortalController::class, 'getDoubleGrading']);
    Route::post('/professor/ai/voice-textbook', [\App\Http\Controllers\Api\Professor\ProfessorPortalController::class, 'voiceTextbookStructure']);
    
    // Surveillances
    Route::get('/professor/my-surveillances', [\App\Http\Controllers\Api\ConvocationController::class, 'mySurveillances']);
});