<?php

use App\Http\Controllers\Api\AcademicCalendarController;
use App\Http\Controllers\Api\AdmissionController;
use App\Http\Controllers\Api\AiAssistantController;
use App\Http\Controllers\Api\AiChatController;
use App\Http\Controllers\Api\AiFeatureController;
use App\Http\Controllers\Api\AlumniController;
use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Api\ConvocationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\ExamPdfController;
use App\Http\Controllers\Api\InternalApiController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PdfExportController;
use App\Http\Controllers\Api\PilotageController;
use App\Http\Controllers\Api\PrivacyController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PublicVerificationController;
use App\Http\Controllers\Api\RoomBookingController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\StudentCardController;
use App\Http\Controllers\Api\TimelineController;
use App\Http\Controllers\Api\TimetableController;
use App\Http\Controllers\Api\TimetableExportController;
use App\Http\Controllers\Api\UnifiedStudentRecordController;
use App\Models\DocumentType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Documents & Cards Verification
Route::match(['get', 'post'], '/documents/universal-verify', [PublicVerificationController::class, 'universalVerify']);
Route::get('/documents/verify/{documentId}', [PublicVerificationController::class, 'verifyDocument'])->name('document.verify');
Route::get('/verify/pv/{moduleId}/{groupId}', [PublicVerificationController::class, 'verifyModulePv']);
Route::get('/verify/card/{token}', [StudentCardController::class, 'verify']);
Route::get('/verify/surveillance/{token}/confirm', [ConvocationController::class, 'confirmReception']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/exams/{examId}/pv-pdf', [ExamPdfController::class, 'pvExamen']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/students/{student}/dossier', [UnifiedStudentRecordController::class, 'show']);

    Route::prefix('calendar')->group(function () {
        Route::get('/events', [AcademicCalendarController::class, 'events']);
        Route::get('/status', [AcademicCalendarController::class, 'status']);
    });

    Route::get('/server-time', function () {
        return response()->json([
            'server_time_utc' => now()->timezone('UTC')->toDateTimeString(),
            'server_timestamp' => time(),
        ]);
    });

    Route::post('/profile', [ProfileController::class, 'update']);

    Route::prefix('v1/privacy')->group(function () {
        Route::post('/export', [PrivacyController::class, 'requestExport']);
        Route::post('/rectification', [PrivacyController::class, 'requestRectification']);
        Route::post('/opposition', [PrivacyController::class, 'requestOpposition']);
        Route::get('/export', [PrivacyController::class, 'myExports']);
        Route::get('/export/{id}/download', [PrivacyController::class, 'download']);
    });

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
    });

    // Timetable & Smart Scheduling (Shared/Admin view)
    Route::prefix('timetable')->group(function () {
        Route::patch('/events/move', [CalendarController::class, 'moveEvent']);
        Route::get('/events', [CalendarController::class, 'getEvents']);
        Route::get('/', [TimetableController::class, 'index']);
        Route::get('/export/{type}/{id}', [TimetableExportController::class, 'exportForFullCalendar']);
        Route::get('/export/{type}/{id}/pdf', [TimetableExportController::class, 'exportPdf']);
        Route::get('/export/{type}/{id}/ics', [TimetableExportController::class, 'exportIcs']);
    });

    // Room Bookings
    Route::get('/room-bookings/check-availability', [RoomBookingController::class, 'checkAvailability']);
    Route::apiResource('room-bookings', RoomBookingController::class);

    // Anti-Fraud Documents & PDFs
    Route::prefix('documents')->group(function () {
        Route::post('/generate-attestation', [DocumentController::class, 'generateAttestation']);
        Route::get('/verify/{trackingCode}', [DocumentController::class, 'verifyDocument']);

        Route::post('/generate', [DocumentController::class, 'generate']);
        Route::get('/verify-internal/{token}', [DocumentController::class, 'verify']);

        // Securely serve private student/candidate documents
        Route::get('/serve/{type}/{cne}', [AdmissionController::class, 'serveCandidateDocument'])->name('documents.serve');

        // PDF Previews
        Route::get('/preview/ordre-mission', [PdfExportController::class, 'previewOrdreMission']);
        Route::get('/preview/convention-stage', [PdfExportController::class, 'previewConventionStage']);
        Route::get('/preview/attestation-travail', [PdfExportController::class, 'previewAttestationTravail']);
        Route::get('/preview/releve-notes', [PdfExportController::class, 'releveNotes']);
    });

    // Analytics & Pilotage (Shared endpoints)
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats', [DashboardController::class, 'getStats']);
        Route::get('/pilotage/metrics', [PilotageController::class, 'getGlobalMetrics']);
        Route::middleware(['role:super-admin|institution-admin|director|department-head'])->group(function () {
            Route::get('/admin/stats', [DashboardController::class, 'getAdminStats']);
            Route::get('/executive/stats', [DashboardController::class, 'getExecutiveStats']);
        });
        Route::get('/student/stats', [DashboardController::class, 'getStudentStats']);
        Route::get('/professor/stats', [DashboardController::class, 'getProfessorStats']);

        // Activity Timeline
        Route::get('/timeline', [TimelineController::class, 'index']);

        // Global Search
        Route::get('/search', [SearchController::class, 'search']);

        // User Profiles & Roles
        Route::get('/users/{user}/roles', [ProfileController::class, 'roles']);
        Route::get('/users/search', [ProfileController::class, 'search']);

        Route::get('/document-types', function () {
            return response()->json(['data' => DocumentType::all()]);
        });
    });

    // Chatbot / AI Shared
    Route::get('/chatbot/history', [AiAssistantController::class, 'history']);
    Route::post('/chatbot/message', [AiAssistantController::class, 'chat']);
    Route::post('/chatbot/transcribe', [AiAssistantController::class, 'transcribe']);
    Route::post('/classroom/ai/tutor', [AiFeatureController::class, 'tutor']);
    Route::get('/classroom/chat/{group}/{module}/messages', [InternalApiController::class, 'chatMessages']);

    // Alumni / Insertion Pro
    Route::prefix('alumni')->group(function () {
        Route::get('/dashboard-stats', [AlumniController::class, 'getDashboardStats']);
    });

    // Removed REST API (Protected endpoints for third-party integrations) routes as they were mocked
    // Public PDF streaming for Disciplinary Council
    Route::get('/incidents/{id}/convocation-pdf', [PdfExportController::class, 'convocationDisciplinePdf']);
    Route::get('/incidents/{id}/decision-pdf', [PdfExportController::class, 'decisionDisciplinePdf']);
    // AI Chatbot Assistant (Accessible to all authenticated users)
    Route::post('/ai/chat', [AiChatController::class, 'chat']);
});
