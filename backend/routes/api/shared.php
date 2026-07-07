<?php

use Illuminate\Support\Facades\Route;

// Public Documents & Cards Verification
Route::get('/verify/document/{documentId}', [\App\Http\Controllers\Api\PublicVerificationController::class, 'verifyDocument']);
Route::get('/verify/card/{token}', [\App\Http\Controllers\Api\StudentCardController::class, 'verify']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return $request->user();
    });
    
    Route::post('/profile', [\App\Http\Controllers\Api\ProfileController::class, 'update']);

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
        Route::post('/mark-all-read', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
        Route::patch('/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\NotificationController::class, 'destroy']);
    });

    // Timetable & Smart Scheduling (Shared/Admin view)
    Route::prefix('timetable')->group(function () {
        Route::patch('/events/move', [\App\Http\Controllers\Api\CalendarController::class, 'moveEvent']);
        Route::get('/events', [\App\Http\Controllers\Api\CalendarController::class, 'getEvents']);
        Route::get('/', [\App\Http\Controllers\Api\TimetableController::class, 'index']);
        Route::get('/export/{type}/{id}', [\App\Http\Controllers\Api\TimetableExportController::class, 'exportForFullCalendar']);
        Route::get('/export/{type}/{id}/pdf', [\App\Http\Controllers\Api\TimetableExportController::class, 'exportPdf']);
        Route::get('/export/{type}/{id}/ics', [\App\Http\Controllers\Api\TimetableExportController::class, 'exportIcs']);
    });
    
    // Anti-Fraud Documents & PDFs
    Route::prefix('documents')->group(function () {
        Route::post('/generate-attestation', [\App\Http\Controllers\Api\DocumentController::class, 'generateAttestation']);
        Route::get('/verify/{trackingCode}', [\App\Http\Controllers\Api\DocumentController::class, 'verifyDocument']);
        
        Route::post('/generate', [\App\Http\Controllers\Api\DocumentController::class, 'generate']);
        Route::get('/verify-internal/{token}', [\App\Http\Controllers\Api\DocumentController::class, 'verify']);
        
        // PDF Previews
        Route::get('/preview/ordre-mission', [\App\Http\Controllers\Api\PdfExportController::class, 'previewOrdreMission']);
        Route::get('/preview/convention-stage', [\App\Http\Controllers\Api\PdfExportController::class, 'previewConventionStage']);
        Route::get('/preview/attestation-travail', [\App\Http\Controllers\Api\PdfExportController::class, 'previewAttestationTravail']);
        Route::get('/preview/releve-notes', [\App\Http\Controllers\Api\PdfExportController::class, 'releveNotes']);
    });

    // Analytics & Pilotage (Shared endpoints)
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Api\DashboardController::class, 'getStats']);
        Route::get('/pilotage/metrics', [\App\Http\Controllers\Api\PilotageController::class, 'getGlobalMetrics']);
        Route::get('/admin/stats', [\App\Http\Controllers\Api\DashboardController::class, 'getAdminStats']);
        Route::get('/executive/stats', [\App\Http\Controllers\Api\DashboardController::class, 'getExecutiveStats']);
        Route::get('/student/stats', [\App\Http\Controllers\Api\DashboardController::class, 'getStudentStats']);
        Route::get('/professor/stats', [\App\Http\Controllers\Api\DashboardController::class, 'getProfessorStats']);
        
        // Activity Timeline
        Route::get('/timeline', [\App\Http\Controllers\Api\TimelineController::class, 'index']);
        
        // Global Search
        Route::get('/search', [\App\Http\Controllers\Api\SearchController::class, 'search']);
    });

    // Chatbot / AI Shared
    Route::get('/chatbot/history', [\App\Http\Controllers\Api\AiAssistantController::class, 'history']);
    Route::post('/chatbot/message', [\App\Http\Controllers\Api\AiAssistantController::class, 'chat']);
    Route::post('/chatbot/transcribe', [\App\Http\Controllers\Api\AiAssistantController::class, 'transcribe']);
    Route::post('/classroom/ai/tutor', [\App\Http\Controllers\Api\AiFeatureController::class, 'tutor']);
    Route::get('/classroom/chat/{group}/{module}/messages', [\App\Http\Controllers\Api\InternalApiController::class, 'chatMessages']);

    // Alumni / Insertion Pro
    Route::prefix('alumni')->group(function () {
        Route::get('/dashboard-stats', [\App\Http\Controllers\Api\AlumniController::class, 'getDashboardStats']);
    });

    // REST API (Protected endpoints for third-party integrations)
    Route::prefix('rest')->group(function () {
        Route::get('/modules', [\App\Http\Controllers\Api\RestApiController::class, 'modules']);
        Route::get('/grades', [\App\Http\Controllers\Api\RestApiController::class, 'grades']);
        Route::get('/schedule', [\App\Http\Controllers\Api\RestApiController::class, 'schedule']);
        Route::get('/absences', [\App\Http\Controllers\Api\RestApiController::class, 'absences']);
        Route::get('/exams', [\App\Http\Controllers\Api\RestApiController::class, 'exams']);
        Route::get('/appointments', [\App\Http\Controllers\Api\RestApiController::class, 'appointments']);
        Route::get('/notifications', [\App\Http\Controllers\Api\RestApiController::class, 'notifications']);
        Route::post('/notifications/{id}/read', [\App\Http\Controllers\Api\RestApiController::class, 'readNotification']);
        Route::post('/notifications/read-all', [\App\Http\Controllers\Api\RestApiController::class, 'readAllNotifications']);
    });
});
