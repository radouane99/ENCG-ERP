<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\DeliberationController;
use App\Http\Controllers\Api\Mobile\MobileStudentController;
use App\Http\Controllers\Api\Student\StudentConvocationController;
use App\Http\Controllers\Api\Student\StudentDocumentRequestController;
use App\Http\Controllers\Api\Student\StudentInternshipController;
use App\Http\Controllers\Api\Student\StudentMobilityController;
use App\Http\Controllers\Api\StudentCardController;
use App\Http\Controllers\Api\StudentPortalController;
use App\Http\Controllers\Api\StudentTranscriptController;
use App\Http\Middleware\EnsureInstitutionContext;
use Illuminate\Support\Facades\Route;

// Mobile App Student Portal API
Route::middleware(['auth:sanctum', 'role:student', EnsureInstitutionContext::class])->prefix('v1/mobile/student')->group(function () {
    Route::get('/profile', [MobileStudentController::class, 'profile']);
    Route::get('/schedule', [MobileStudentController::class, 'schedule']);
    Route::get('/grades', [MobileStudentController::class, 'grades']);
    Route::get('/card', [StudentCardController::class, 'show']);
    Route::post('/card/preview', [StudentCardController::class, 'preview']);
    Route::post('/card', [StudentCardController::class, 'store']);
    Route::post('/attendance/scan', [AttendanceController::class, 'scanQr']);
});

// Web App Student Portal API
Route::middleware(['auth:sanctum', 'role:student'])->prefix('v1/student-portal')->group(function () {
    Route::get('/my-dossier', [\App\Http\Controllers\Api\UnifiedStudentRecordController::class, 'myDossier']);
    Route::get('/dashboard', [StudentPortalController::class, 'getDashboardStats']);
    Route::get('/schedule', [StudentPortalController::class, 'getSchedule']);
    Route::get('/grades', [StudentPortalController::class, 'getGrades']);
    Route::post('/absences', [StudentPortalController::class, 'submitAbsence']);
    Route::post('/absences/justify', [StudentPortalController::class, 'submitAbsenceJustification']);
    Route::get('/card', [StudentCardController::class, 'show']);
    Route::post('/card/preview', [StudentCardController::class, 'preview']);
    Route::post('/card', [StudentCardController::class, 'store']);

    // Apogée Deliberation Engine - Transcript
    Route::get('/transcript', [DeliberationController::class, 'getStudentTranscript']);

    // Student AI Suite
    Route::prefix('ai')->group(function () {
        Route::post('tutor', [\App\Http\Controllers\Api\Student\StudentAiController::class, 'tutorQuery']);
        Route::get('simulate-grade', [\App\Http\Controllers\Api\Student\StudentAiController::class, 'simulateGrade']);
        Route::get('career-recommendations', [\App\Http\Controllers\Api\Student\StudentAiController::class, 'getCareerRecommendations']);
    });

    // Digital Library
    Route::get('/library', [StudentPortalController::class, 'getLibraryMaterials']);

    // Internships
    Route::prefix('internships')->group(function () {
        Route::get('/', [StudentInternshipController::class, 'index']);
        Route::post('/', [StudentInternshipController::class, 'store']);
        Route::post('/{id}/documents', [StudentInternshipController::class, 'uploadDocument']);
    });

    // Convocations (Exams)
    Route::prefix('convocations')->group(function () {
        Route::get('/', [StudentConvocationController::class, 'index']);
        Route::get('/{id}/download', [StudentConvocationController::class, 'download']);
    });

    // CEDOC Dashboard
    Route::get('/cedoc/dashboard', [\App\Http\Controllers\Api\CedocController::class, 'getDashboardStats']);

    // Document Requests (Guichet Électronique)
    Route::prefix('document-requests')->group(function () {
        Route::get('/', [StudentDocumentRequestController::class, 'index']);
        Route::post('/', [StudentDocumentRequestController::class, 'store']);
        Route::get('/{id}/download', [StudentDocumentRequestController::class, 'download']);
    });

    // International Mobility
    Route::prefix('mobility')->group(function () {
        Route::get('/partners', [StudentMobilityController::class, 'getPartners']);
        Route::post('/voeux', [StudentMobilityController::class, 'saveVoeux']);
    });

    // Job Offers & Market
    Route::get('/job-offers', [\App\Http\Controllers\Api\Student\JobOfferController::class, 'index']);

    // Clubs & Vie associative
    Route::get('/clubs', [\App\Http\Controllers\Api\Student\ClubController::class, 'index']);

    // Official Transcript (Relevé de Notes) PDF
    Route::get('/transcript/pdf', [StudentTranscriptController::class, 'generateForStudent']);
});
