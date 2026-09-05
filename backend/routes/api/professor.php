<?php

use App\Http\Controllers\Api\Academic\GradeAppealController;
use App\Http\Controllers\Api\AiAssistantController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\ConvocationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExamPdfController;
use App\Http\Controllers\Api\GradeController;
use App\Http\Controllers\Api\GradeGridController;
use App\Http\Controllers\Api\PdfExportController;
use App\Http\Controllers\Api\Professor\ProfessorAttendanceController;
use App\Http\Controllers\Api\Professor\ProfessorInternshipController;
use App\Http\Controllers\Api\Professor\ProfessorPortalController;
use App\Http\Controllers\Api\Professor\SmartGradingController;
use App\Http\Controllers\Api\ProfessorAiController;
use App\Http\Controllers\Api\ProfessorAiCopilotController;
use App\Http\Controllers\Api\ProfessorAvailabilityController;
use App\Http\Controllers\Api\RoomBookingController;
use Illuminate\Support\Facades\Route;

// Professor API — Accessible to Professors, Vacataires, and Academic Coordinators/Admins
Route::middleware(['auth:sanctum', 'role:professor|vacataire|department-head|filiere-head|super-admin|institution-admin|director'])->prefix('v1/professor')->group(function () {
    Route::post('/attendance/session', [AttendanceController::class, 'createSession']);
    Route::get('/attendance/session/{id}/stats', [AttendanceController::class, 'sessionStats']);

    // Grade Grid Entry
    Route::get('/grades/grid', [GradeGridController::class, 'getGrid']);
    Route::post('/grades/save', [GradeGridController::class, 'saveGrades']);

    // Apogée Deliberation Engine - Grade Entry
    Route::post('/assessments/{assessment}/grades', [GradeController::class, 'storeBulk']);

    // Professor AI Suite
    Route::prefix('ai')->group(function () {
        Route::post('generate-exam', [ProfessorAiController::class, 'generateExam']);
        Route::get('class-analytics/{moduleId}', [ProfessorAiController::class, 'getClassAnalytics']);
        Route::post('copilot', [ProfessorAiController::class, 'copilotQuery']);
        Route::post('grade-report', [ProfessorAiController::class, 'gradeReport']);
    });

    Route::prefix('copilot')->group(function () {
        Route::post('textbook-outline', [ProfessorAiCopilotController::class, 'generateTextbookOutline']);
        Route::post('generate-exam-paper', [ProfessorAiCopilotController::class, 'generateExamPaper']);
    });
});

Route::middleware(['auth:sanctum', 'role:professor|vacataire|department-head|filiere-head|super-admin|institution-admin|director'])->group(function () {
    // Dashboard Stats
    Route::get('/dashboard/professor/stats', [DashboardController::class, 'getProfessorStats']);
    Route::get('/professor/dashboard/stats', [DashboardController::class, 'getProfessorStats']);

    // Professor Availability
    Route::prefix('professor-availability')->group(function () {
        Route::get('/', [ProfessorAvailabilityController::class, 'index']);
        Route::post('/alert', [ProfessorAvailabilityController::class, 'alert']);
        Route::get('/my', [ProfessorAvailabilityController::class, 'myAvailability']);
        Route::post('/my', [ProfessorAvailabilityController::class, 'saveMyAvailability']);
    });
    Route::get('/professor/availability/my', [ProfessorAvailabilityController::class, 'myAvailability']);
    Route::post('/professor/availability/my', [ProfessorAvailabilityController::class, 'saveMyAvailability']);

    // AI Tools for Professor
    Route::post('/professor/ai/generate-qcm', [AiAssistantController::class, 'generateQuiz']);
    Route::post('/professor/ai/grade-report', [ProfessorAiController::class, 'gradeReport']);
    Route::post('/professor/smart-grading/process', [SmartGradingController::class, 'process']);
    Route::post('/professor/smart-grading/export', [SmartGradingController::class, 'export']);

    // PDF Exports for Professor
    Route::get('/professor/exams/{exam}/pv/pdf', [ExamPdfController::class, 'pvExamen']);

    // Attendance Module
    Route::prefix('professor/attendance')->group(function () {
        Route::get('/students', [ProfessorAttendanceController::class, 'getStudents']);
        Route::post('/start', [ProfessorAttendanceController::class, 'startSession']);
        Route::post('/save', [ProfessorAttendanceController::class, 'save']);
        Route::post('/{session}/manual-call', [ProfessorAttendanceController::class, 'manualCall']);
        Route::post('/{session}/scan', [ProfessorAttendanceController::class, 'scanQrCode']);
        Route::post('/{session}/close', [ProfessorAttendanceController::class, 'closeSession']);
    });

    // Internships
    Route::prefix('professor/internships')->group(function () {
        Route::get('/supervised', [ProfessorInternshipController::class, 'supervised']);
        Route::post('/soutenances/{id}/evaluate', [ProfessorInternshipController::class, 'evaluate']);
        Route::post('/update-status', [ProfessorInternshipController::class, 'updateStatus']);
    });

    // Portal
    Route::get('/professor-portal/schedule', [ProfessorPortalController::class, 'getSchedule']);
    Route::post('/professor-portal/schedules/{id}/confirm', [ProfessorPortalController::class, 'confirmSchedule']);
    Route::get('/professor-portal/reservations', [ProfessorPortalController::class, 'getReservations']);
    Route::post('/professor-portal/reservations', [RoomBookingController::class, 'store']);
    Route::get('/professor-portal/analytics', [ProfessorPortalController::class, 'getAnalytics']);
    Route::get('/professor-portal/workload', [ProfessorPortalController::class, 'getWorkloadSummary']);
    Route::get('/professor-portal/workload-pdf', [ProfessorPortalController::class, 'downloadWorkloadPdf']);
    Route::get('/professor-portal/vacation-contract/pdf', [ProfessorPortalController::class, 'downloadVacationContractPdf']);
    Route::get('/professor-portal/research', [ProfessorPortalController::class, 'getResearchDashboard']);
    Route::get('/professor-portal/double-grading', [ProfessorPortalController::class, 'getDoubleGrading']);
    // Documents & Attestations RH
    Route::get('/professor-portal/documents', [ProfessorPortalController::class, 'getDocumentRequests']);
    Route::post('/professor-portal/documents', [ProfessorPortalController::class, 'storeDocumentRequest']);

    // Cahier de Texte Numérique & Service Fait
    Route::get('/professor-portal/textbook', [ProfessorPortalController::class, 'getTextbookEntries']);
    Route::post('/professor-portal/textbook', [ProfessorPortalController::class, 'storeTextbookEntry']);
    Route::get('/professor-portal/service-fait/{moduleId}/pdf', [ProfessorPortalController::class, 'downloadServiceFaitPdf']);
    Route::get('/professor-portal/annual-activity-report/pdf', [ProfessorPortalController::class, 'downloadAnnualActivityReportPdf']);

    // Surveillances & Convocations PDF & PV Signature & Confirmation
    Route::get('/professor/my-surveillances', [ConvocationController::class, 'mySurveillances']);
    Route::post('/professor/surveillances/{id}/confirm', [ConvocationController::class, 'confirmSurveillance']);
    Route::post('/professor/surveillances/all/confirm', [ConvocationController::class, 'confirmSurveillance']);
    Route::get('/professor/surveillances/all-pdf', [PdfExportController::class, 'downloadMySurveillancesPdf']);
    Route::get('/professor/surveillances/{id}/pdf', [PdfExportController::class, 'surveillantConvocationPdf']);
    Route::post('/professor/surveillances/{id}/sign-pv', [ConvocationController::class, 'signExamPv']);

    // Réclamations de Notes LMD 48h (Traitement Enseignant)
    Route::get('/professor-portal/grade-appeals', [GradeAppealController::class, 'index']);
    Route::post('/professor-portal/grade-appeals/{id}/resolve', [GradeAppealController::class, 'resolve']);
    Route::get('/v1/professor-portal/grade-appeals', [GradeAppealController::class, 'index']);
    Route::post('/v1/professor-portal/grade-appeals/{id}/resolve', [GradeAppealController::class, 'resolve']);
});

Route::middleware(['auth:sanctum', 'role:professor|vacataire|department-head|filiere-head|super-admin|institution-admin|director'])->group(function () {
    Route::get('/professor-portal/documents/{id}/pdf', [ProfessorPortalController::class, 'downloadDocumentPdf']);
    Route::get('/v1/professor-portal/documents/{id}/pdf', [ProfessorPortalController::class, 'downloadDocumentPdf']);
    Route::get('/v1/professor-portal/workload-pdf', [ProfessorPortalController::class, 'downloadWorkloadPdf']);
    Route::get('/v1/professor-portal/vacation-contract/pdf', [ProfessorPortalController::class, 'downloadVacationContractPdf']);
    Route::get('/v1/professor-portal/service-fait/{moduleId}/pdf', [ProfessorPortalController::class, 'downloadServiceFaitPdf']);
    Route::get('/v1/professor-portal/annual-activity-report/pdf', [ProfessorPortalController::class, 'downloadAnnualActivityReportPdf']);
    Route::get('/v1/professor/surveillances/all-pdf', [PdfExportController::class, 'downloadMySurveillancesPdf']);
    Route::get('/v1/professor/surveillances/{id}/pdf', [PdfExportController::class, 'surveillantConvocationPdf']);
});
