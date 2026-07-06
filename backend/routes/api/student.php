<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Mobile\MobileStudentController;

// Mobile App Student Portal API
Route::middleware(['auth:sanctum', \App\Http\Middleware\EnsureInstitutionContext::class])->prefix('v1/mobile/student')->group(function () {
    Route::get('/profile', [MobileStudentController::class, 'profile']);
    Route::get('/schedule', [MobileStudentController::class, 'schedule']);
    Route::get('/grades', [MobileStudentController::class, 'grades']);
    Route::get('/card', [\App\Http\Controllers\Api\StudentCardController::class, 'show']);
    Route::post('/attendance/scan', [\App\Http\Controllers\Api\AttendanceController::class, 'scanQr']);
});

// Web App Student Portal API
Route::middleware(['auth:sanctum'])->prefix('v1/student-portal')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Api\StudentPortalController::class, 'getDashboardStats']);
    Route::get('/schedule', [\App\Http\Controllers\Api\StudentPortalController::class, 'getSchedule']);
    Route::get('/grades', [\App\Http\Controllers\Api\StudentPortalController::class, 'getGrades']);
    Route::post('/absences', [\App\Http\Controllers\Api\StudentPortalController::class, 'submitAbsence']);
    Route::post('/absences/justify', [\App\Http\Controllers\Api\StudentPortalController::class, 'submitAbsenceJustification']);
    
    // Internships
    Route::prefix('internships')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Student\StudentInternshipController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\Student\StudentInternshipController::class, 'store']);
        Route::post('/{id}/documents', [\App\Http\Controllers\Api\Student\StudentInternshipController::class, 'uploadDocument']);
    });
    
    // Convocations (Exams)
    Route::prefix('convocations')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Student\StudentConvocationController::class, 'index']);
        Route::get('/{id}/download', [\App\Http\Controllers\Api\Student\StudentConvocationController::class, 'download']);
    });
});

Route::middleware(['auth:sanctum'])->prefix('student')->group(function () {
    Route::post('/absences/upload', [\App\Http\Controllers\Api\ConvocationController::class, 'uploadJustification']);
});
