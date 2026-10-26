<?php

use App\Http\Controllers\Api\AcademicCalendarController;
use App\Http\Controllers\Api\SmartSchedulingController;
use App\Http\Controllers\Api\Admin\AdminBlockchainController;
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
use App\Http\Controllers\Api\InternshipConversationController;
use App\Http\Controllers\Api\InternshipDocumentController;
use App\Http\Controllers\Api\LmsCourseController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PdfExportController;
use App\Http\Controllers\Api\PilotageController;
use App\Http\Controllers\Api\PrivacyController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PublicVerificationController;
use App\Http\Controllers\Api\ReinscriptionController;
use App\Http\Controllers\Api\RenewalCampaignController;
use App\Http\Controllers\Api\RoomBookingController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\StudentCardController;
use App\Http\Controllers\Api\TimelineController;
use App\Http\Controllers\Api\TimetableController;
use App\Http\Controllers\Api\TimetableExportController;
use App\Http\Controllers\Api\UnifiedStudentRecordController;
use App\Models\DocumentType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Route;

// Public Documents, Diplomas & Cards Verification
Route::get('/health/ready', function () {
    try {
        DB::select('SELECT 1');
        if (config('queue.default') === 'redis' || config('cache.default') === 'redis') {
            Redis::connection()->ping();
        }

        return response()->json(['ready' => true]);
    } catch (Throwable $e) {
        return response()->json(['ready' => false], 503);
    }
});
Route::match(['get', 'post'], '/documents/universal-verify', [PublicVerificationController::class, 'universalVerify']);
Route::get('/documents/verify/{documentId}', [PublicVerificationController::class, 'verifyDocument'])->name('document.verify');
Route::get('/verify/document/{documentId}', [PublicVerificationController::class, 'verifyDocument'])->name('document.verify.direct');
Route::get('/v1/verify/document/{documentId}', [PublicVerificationController::class, 'verifyDocument']);
Route::get('/verify/pv/{moduleId}/{groupId}', [PublicVerificationController::class, 'verifyModulePv']);
Route::get('/verify/card/{token}', [StudentCardController::class, 'verify']);
Route::get('/verify/surveillance/{token}/confirm', [ConvocationController::class, 'confirmReception']);
Route::match(['get', 'post'], '/blockchain/public-verify', [AdminBlockchainController::class, 'verify']);
Route::match(['get', 'post'], '/verify/blockchain', [AdminBlockchainController::class, 'verify']);

Route::middleware(['auth:sanctum', 'institution.context'])->group(function () {
    Route::prefix('smart-scheduling')->group(function () {
        Route::post('/simulate', [SmartSchedulingController::class, 'simulate']);
        Route::post('/generate', [SmartSchedulingController::class, 'generate']);
        Route::post('/reoptimize', [SmartSchedulingController::class, 'reoptimize']);
        Route::get('/stats', [SmartSchedulingController::class, 'stats']);
        Route::post('/suggest-slots', [SmartSchedulingController::class, 'suggestSlots']);
        Route::get('/workspace', [SmartSchedulingController::class, 'workspace']);
        Route::post('/campaign/open', [SmartSchedulingController::class, 'openCampaign']);
        Route::post('/campaign/close', [SmartSchedulingController::class, 'closeCampaign']);
        Route::post('/draft', [SmartSchedulingController::class, 'generateDraft']);
        Route::post('/draft/empty', [SmartSchedulingController::class, 'emptyDraft']);
        Route::get('/versions/{versionId}/board', [SmartSchedulingController::class, 'board']);
        Route::post('/versions/{versionId}/move', [SmartSchedulingController::class, 'moveBlock']);
        Route::post('/versions/{versionId}/sessions', [SmartSchedulingController::class, 'addSession']);
        Route::post('/versions/{versionId}/sessions/delete', [SmartSchedulingController::class, 'deleteBlock']);
        Route::post('/versions/{versionId}/propose', [SmartSchedulingController::class, 'propose']);
        Route::post('/versions/{versionId}/publish', [SmartSchedulingController::class, 'publishVersion']);
    });
    Route::prefix('admin/smart-scheduling')->group(function () {
        Route::post('/simulate', [SmartSchedulingController::class, 'simulate']);
        Route::post('/generate', [SmartSchedulingController::class, 'generate']);
        Route::post('/reoptimize', [SmartSchedulingController::class, 'reoptimize']);
        Route::get('/stats', [SmartSchedulingController::class, 'stats']);
        Route::post('/suggest-slots', [SmartSchedulingController::class, 'suggestSlots']);
        Route::get('/workspace', [SmartSchedulingController::class, 'workspace']);
        Route::post('/campaign/open', [SmartSchedulingController::class, 'openCampaign']);
        Route::post('/campaign/close', [SmartSchedulingController::class, 'closeCampaign']);
        Route::post('/draft', [SmartSchedulingController::class, 'generateDraft']);
        Route::post('/draft/empty', [SmartSchedulingController::class, 'emptyDraft']);
        Route::get('/versions/{versionId}/board', [SmartSchedulingController::class, 'board']);
        Route::post('/versions/{versionId}/move', [SmartSchedulingController::class, 'moveBlock']);
        Route::post('/versions/{versionId}/sessions', [SmartSchedulingController::class, 'addSession']);
        Route::post('/versions/{versionId}/sessions/delete', [SmartSchedulingController::class, 'deleteBlock']);
        Route::post('/versions/{versionId}/propose', [SmartSchedulingController::class, 'propose']);
        Route::post('/versions/{versionId}/publish', [SmartSchedulingController::class, 'publishVersion']);
    });


    Route::get('/timetable/change-requests', [\App\Http\Controllers\Api\ScheduleChangeRequestController::class, 'index']);
    Route::post('/timetable/change-requests', [\App\Http\Controllers\Api\ScheduleChangeRequestController::class, 'storeTimetable']);
    Route::patch('/timetable/change-requests/{id}/status', [\App\Http\Controllers\Api\ScheduleChangeRequestController::class, 'updateStatus']);
    Route::get('/documents/registry', [\App\Http\Controllers\Api\DocumentRegistryController::class, 'index']);
    Route::get('/documents/registry/{id}/download', [\App\Http\Controllers\Api\DocumentRegistryController::class, 'download']);
    Route::post('/documents/registry/{id}/revoke', [\App\Http\Controllers\Api\DocumentRegistryController::class, 'revoke']);
    Route::get('/workspace/today', [\App\Http\Controllers\Api\OperationalWorkspaceController::class, 'index']);
    Route::patch('/workspace/requests/{id}/followup', [\App\Http\Controllers\Api\OperationalWorkspaceController::class, 'assign']);
    Route::post('/broadcasting/auth', fn (Request $request) => Broadcast::auth($request));
    Route::match(['get', 'post'], '/exams/{examId}/pv-pdf', [ExamPdfController::class, 'pvExamen']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/students/{student}/dossier', [UnifiedStudentRecordController::class, 'show']);
    Route::get('/students/{student}/convocation-pdf', [ConvocationController::class, 'downloadStudentConvocationPdf']);

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
        Route::get('/export/{id}/preview', [PrivacyController::class, 'preview']);
        Route::get('/export/{id}/pdf', [PrivacyController::class, 'downloadPdf']);
    });

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
    });

    // LMS & E-Learning (Classroom for Students, Professors & Admin)
    Route::prefix('lms')->group(function () {
        Route::get('/submissions/{submissionId}/file', [LmsCourseController::class, 'submissionFile']);
        Route::get('/courses/{id}/assignments/{assignmentId}/submissions', [LmsCourseController::class, 'submissions']);
        Route::get('/courses', [LmsCourseController::class, 'index']);
        Route::get('/courses/{id}', [LmsCourseController::class, 'show']);
        Route::post('/courses/{id}/materials', [LmsCourseController::class, 'storeMaterial']);
        Route::post('/courses/{id}/announcements', [LmsCourseController::class, 'storeAnnouncement']);
        Route::post('/courses/{id}/messages', [LmsCourseController::class, 'storeMessage']);
        Route::post('/courses/{id}/assignments/{assignmentId}/submit', [LmsCourseController::class, 'submitAssignment']);
    });

    // Timetable & Smart Scheduling (Shared/Admin view)
    Route::prefix('timetable')->group(function () {
        Route::patch('/events/move', [CalendarController::class, 'moveEvent']);
        Route::get('/events', [CalendarController::class, 'getEvents']);
        Route::get('/', [TimetableController::class, 'index']);
        Route::get('/export/{type}/{id}', [TimetableExportController::class, 'exportForFullCalendar']);
        Route::get('/export/{type}/{id}/matrix', [TimetableExportController::class, 'officialMatrix']);
        Route::get('/export/{type}/{id}/pdf', [TimetableExportController::class, 'exportPdf']);
        Route::get('/export/{type}/{id}/ics', [TimetableExportController::class, 'exportIcs']);
        Route::get('/dates-config', [TimetableExportController::class, 'getDatesConfig']);
        Route::post('/dates-config', [TimetableExportController::class, 'saveDatesConfig'])
            ->middleware('role:super-admin|admin|institution-admin|director|scolarite');
    });

    // Room Bookings & Real-time Availability
    Route::get('/room-bookings/check-availability', [RoomBookingController::class, 'checkAvailability']);
    Route::get('/room-bookings/available-rooms', [RoomBookingController::class, 'availableRooms']);
    Route::post('/rooms/smart-find', [RoomBookingController::class, 'smartFind']);
    Route::get('/rooms/occupancy-matrix', [RoomBookingController::class, 'occupancyMatrix']);
    Route::get('/rooms/weekly-master-matrix', [RoomBookingController::class, 'weeklyMasterMatrix']);
    Route::get('/rooms/{room}/door-sign-pdf', [RoomBookingController::class, 'doorSignPdf']);
    Route::apiResource('room-bookings', RoomBookingController::class)->except(['show']);

    // Anti-Fraud Documents & PDFs
    Route::prefix('documents')->group(function () {
        Route::post('/generate-attestation', [DocumentController::class, 'generateAttestation']);
        Route::get('/verify/{trackingCode}', [DocumentController::class, 'verifyDocument']);

        Route::post('/generate', [DocumentController::class, 'generate']);
        Route::get('/verify-internal/{token}', [DocumentController::class, 'verify']);

        // Securely serve private student/candidate documents
        Route::get('/serve/{type}/{cne}', [AdmissionController::class, 'serveCandidateDocument'])->name('documents.serve');

        // PDF Previews
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
        Route::get('/graduates', [AlumniController::class, 'graduates']);
        Route::post('/graduates/finalize', [AlumniController::class, 'finalizeGraduation']);
        Route::get('/graduation-candidates', [AlumniController::class, 'graduationCandidates']);
        Route::get('/dashboard-stats', [AlumniController::class, 'getDashboardStats']);
    });

    // Removed REST API (Protected endpoints for third-party integrations) routes as they were mocked
    // Public PDF streaming for Disciplinary Council
    Route::get('/incidents/batch-pdf', [PdfExportController::class, 'batchDisciplinePdf']);
    Route::get('/incidents/{id}/convocation-pdf', [PdfExportController::class, 'convocationDisciplinePdf']);
    Route::get('/incidents/{id}/decision-pdf', [PdfExportController::class, 'decisionDisciplinePdf']);
    // AI Chatbot Assistant (Accessible to all authenticated users)
    Route::post('/ai/chat', [AiChatController::class, 'chat']);
    Route::get('/internships/{id}/messages', [InternshipConversationController::class, 'index']);
    Route::post('/internships/{id}/messages', [InternshipConversationController::class, 'store']);
    Route::get('/internship-documents/{id}/download', [InternshipDocumentController::class, 'download']);
    Route::post('/internship-documents/{id}/review', [InternshipDocumentController::class, 'review']);
});

Route::middleware(['auth:sanctum', 'institution.context', 'role:admin|super-admin|institution-admin|director|scolarite|pedagogy_officer'])->group(function () {
    Route::get('/admin/reinscriptions/stats', [ReinscriptionController::class, 'getAdminStats']);
    Route::get('/admin/reinscriptions/campaign', [RenewalCampaignController::class, 'show']);
    Route::put('/admin/reinscriptions/campaign', [RenewalCampaignController::class, 'update']);
    Route::get('/admin/reinscriptions/export', [ReinscriptionController::class, 'exportRoster']);
    Route::post('/admin/reinscriptions/{student}/physical-review', [ReinscriptionController::class, 'verifyPhysical']);
    Route::post('/admin/reinscriptions/send-reminders', [ReinscriptionController::class, 'sendReminders']);
});
