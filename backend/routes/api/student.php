<?php

use App\Http\Controllers\Api\AiCourseTutorController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\CedocController;
use App\Http\Controllers\Api\DeliberationController;
use App\Http\Controllers\Api\Mobile\MobileStudentController;
use App\Http\Controllers\Api\ReinscriptionController;
use App\Http\Controllers\Api\Student\ClubController;
use App\Http\Controllers\Api\Student\JobOfferController;
use App\Http\Controllers\Api\Student\StudentAbsenceController;
use App\Http\Controllers\Api\Student\StudentAiController;
use App\Http\Controllers\Api\Student\StudentConvocationController;
use App\Http\Controllers\Api\Student\StudentDocumentRequestController;
use App\Http\Controllers\Api\Student\StudentInternshipController;
use App\Http\Controllers\Api\Student\StudentMobilityController;
use App\Http\Controllers\Api\StudentCardController;
use App\Http\Controllers\Api\StudentPortalController;
use App\Http\Controllers\Api\StudentTranscriptController;
use App\Http\Controllers\Api\UnifiedStudentRecordController;
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

// Web App Student Portal API (`/v1/...` and `/student-portal/...` — frontend often omits v1)
$studentPortalRoutes = function () {
    Route::get('/my-dossier', [UnifiedStudentRecordController::class, 'myDossier']);
    Route::get('/dashboard', [StudentPortalController::class, 'getDashboardStats']);
    Route::get('/schedule', [StudentPortalController::class, 'getSchedule']);
    Route::get('/grades', [StudentPortalController::class, 'getGrades']);
    Route::get('/absences', [StudentAbsenceController::class, 'index']);
    Route::post('/absences', [StudentPortalController::class, 'submitAbsence']);
    Route::post('/absences/justify', [StudentPortalController::class, 'submitAbsenceJustification']);
    Route::get('/card', [StudentCardController::class, 'show']);
    Route::post('/card/preview', [StudentCardController::class, 'preview']);
    Route::post('/card', [StudentCardController::class, 'store']);

    // Apogée Deliberation Engine - Transcript
    Route::get('/transcript', [DeliberationController::class, 'getStudentTranscript']);

    // Student AI Suite
    Route::prefix('ai')->group(function () {
        Route::post('tutor', [StudentAiController::class, 'tutorQuery']);
        Route::get('simulate-grade', [StudentAiController::class, 'simulateGrade']);
        Route::post('lmd-judge', [StudentAiController::class, 'lmdJudge']);
        Route::post('pfe-oral', [StudentAiController::class, 'pfeOral']);
        Route::get('career-recommendations', [StudentAiController::class, 'getCareerRecommendations']);
        Route::post('exam-assistant', [StudentAiController::class, 'examAssistant']);
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
        Route::get('/{id}/wallet-pass', [StudentConvocationController::class, 'walletPass']);
        Route::post('/{id}/declare-absence', [StudentConvocationController::class, 'declareAbsence']);
    });

    // CEDOC Dashboard
    Route::get('/cedoc/dashboard', [CedocController::class, 'getDashboardStats']);

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
    Route::get('/job-offers', [JobOfferController::class, 'index']);

    // Clubs & Vie associative
    Route::get('/clubs', [ClubController::class, 'index']);

    // Official Documents PDF (Relevé, Attestation de Réussite, Diplôme d'État ENCG)
    Route::get('/transcript/pdf', [StudentTranscriptController::class, 'generateForStudent']);
    Route::get('/attestation-reussite/pdf', [StudentTranscriptController::class, 'generateAttestationReussiteForStudent']);
    Route::get('/diplome-officiel/pdf', [StudentTranscriptController::class, 'generateDiplomeForStudent']);

    // Re-inscription en ligne (Confirmation pour l'année supérieure)
    Route::get('/reinscription/status', [ReinscriptionController::class, 'getStatus']);
    Route::post('/reinscription/simulate-pay', [ReinscriptionController::class, 'simulatePay']);
    Route::post('/reinscription/confirm', [ReinscriptionController::class, 'confirm']);

    // AI Course Tutor (RAG anchored on ENCG handouts)
    Route::post('/ai-tutor/chat', [AiCourseTutorController::class, 'chat']);
    Route::get('/ai-tutor/quiz', [AiCourseTutorController::class, 'getQuiz']);
};

Route::middleware(['auth:sanctum', 'role:student'])->prefix('v1/student-portal')->group($studentPortalRoutes);
Route::middleware(['auth:sanctum', 'role:student'])->prefix('student-portal')->group($studentPortalRoutes);
