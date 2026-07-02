<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\AdmissionController;
use App\Http\Controllers\Api\HR\VacationController;
use App\Http\Controllers\Api\Mobile\MobileStudentController;
use App\Presentation\Api\Controllers\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\ContactController;

Route::post('/contact', [ContactController::class, 'send'])->middleware('throttle:6,1');

Route::prefix('v1/auth')->group(function () {
    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLinkEmail'])->middleware('throttle:5,1');
    Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:5,1');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/two-factor/verify', [AuthController::class, 'verifyTwoFactor'])->middleware('throttle:5,1');
    
    // Google Socialite Auth
    Route::get('/google/redirect', [AuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        // 2FA management routes (authenticated user)
        Route::post('/two-factor/setup', [AuthController::class, 'setup2FA']);
        Route::post('/two-factor/confirm', [AuthController::class, 'confirm2FA']);
        Route::delete('/two-factor/disable', [AuthController::class, 'disable2FA']);
    });
});

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Removed db-test route from here

    Route::post('/profile', [\App\Http\Controllers\Api\ProfileController::class, 'update']);

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
        Route::post('/mark-all-read', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
        Route::patch('/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\NotificationController::class, 'destroy']);
    });

    // LMS & E-Learning
    Route::prefix('lms')->group(function () {
        Route::get('/courses', [\App\Http\Controllers\Api\LmsCourseController::class, 'index']);
        Route::get('/courses/{id}', [\App\Http\Controllers\Api\LmsCourseController::class, 'show']);
        Route::post('/courses/{id}/materials', [\App\Http\Controllers\Api\LmsCourseController::class, 'storeMaterial']);
    });

    // Academic Structure
    Route::apiResource('filieres', \App\Http\Controllers\Api\FiliereController::class);
    Route::apiResource('modules', \App\Http\Controllers\Api\ModuleController::class);
    Route::apiResource('students', \App\Http\Controllers\Api\StudentController::class);
    Route::apiResource('groups', \App\Http\Controllers\Api\GroupController::class);
    Route::apiResource('academic-years', \App\Http\Controllers\Api\AcademicYearController::class);
    Route::apiResource('exam-sessions', \App\Http\Controllers\Api\ExamSessionController::class);
    Route::apiResource('final-projects', \App\Http\Controllers\Api\FinalProjectController::class);
    Route::apiResource('attendances', \App\Http\Controllers\Api\AttendanceController::class)->only(['index', 'destroy']);

    // Clubs
    Route::apiResource('clubs', \App\Http\Controllers\Api\ClubController::class)->except(['destroy']);

    // Internships
    Route::apiResource('internships', \App\Http\Controllers\Api\InternshipController::class)->except(['destroy']);

    // Complaints
    Route::apiResource('complaints', \App\Http\Controllers\Api\ComplaintController::class)->except(['destroy']);

    // Discipline
    Route::apiResource('discipline', \App\Http\Controllers\Api\DisciplineController::class)->except(['destroy']);
    Route::post('discipline/{id}/decide', [\App\Http\Controllers\Api\DisciplineController::class, 'decide']);
    
    // Grades
    Route::prefix('grades')->group(function () {
        Route::post('/batch', [\App\Http\Controllers\Api\GradeController::class, 'storeBatch']);
        Route::post('/validate', [\App\Http\Controllers\Api\GradeController::class, 'validateGrades']);
    });

    // HR & Personnel
    Route::prefix('hr')->group(function () {
        Route::apiResource('professors', \App\Http\Controllers\Api\ProfessorController::class);
        Route::apiResource('vacataires', \App\Http\Controllers\Api\VacataireController::class);
    });

    // Exam Locking (Admin)
    Route::prefix('admin/exam-locking')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ExamLockingController::class, 'index']);
        Route::post('/change', [\App\Http\Controllers\Api\ExamLockingController::class, 'updateStatus']);
    });

    // Infrastructure
    Route::apiResource('rooms', \App\Http\Controllers\Api\RoomController::class);

    // Excel Import / Export (global — all modules)
    Route::get('export/{model}', [\App\Http\Controllers\Api\ExcelController::class, 'export']);
    Route::get('export/{model}/template', [\App\Http\Controllers\Api\ExcelController::class, 'template']);
    Route::post('import/{model}', [\App\Http\Controllers\Api\ExcelController::class, 'import']);

    // Secure Documents & Anti-Fraud
    Route::post('documents/generate-attestation', [\App\Http\Controllers\Api\DocumentController::class, 'generateAttestation']);
    Route::get('documents/verify/{trackingCode}', [\App\Http\Controllers\Api\DocumentController::class, 'verifyDocument']);

    // Admissions (TAFEM & Applications)
    Route::prefix('admissions')->group(function () {
        Route::get('/campaigns/{campaign}/applications', [\App\Http\Controllers\Api\AdmissionController::class, 'index']);
        Route::patch('/applications/{application}/status', [\App\Http\Controllers\Api\AdmissionController::class, 'updateStatus']);
        Route::delete('/applications/{application}', [\App\Http\Controllers\Api\AdmissionController::class, 'destroy']);
    });

    // HR & Vacataires
    Route::prefix('hr/vacations')->group(function () {
        Route::post('/contracts/{contract}/generate-payment', [\App\Http\Controllers\Api\VacationController::class, 'generatePayment']);
        Route::post('/payments/export', [\App\Http\Controllers\Api\VacationController::class, 'exportBankFile']);
    });

    // Exports
    Route::get('/export/students', function (\Illuminate\Http\Request $request) {
        // Normally handled by a Controller, inline for simplicity in this demo structure
        $institutionId = auth()->user()->institution_id;
        // The return format depends on Maatwebsite/Excel
        // return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\StudentsExport($institutionId), 'students.xlsx');
        
        // Mock download response for testing UI before composer is fixed
        return response()->json(['success' => true, 'message' => 'Export simulated successfully']);
    });
    
    // Timetable & Smart Scheduling
    Route::prefix('timetable')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\TimetableController::class, 'index']);
        Route::get('/export/{type}/{id}', [\App\Http\Controllers\Api\TimetableExportController::class, 'exportForFullCalendar']);
        Route::get('/export/{type}/{id}/pdf', [\App\Http\Controllers\Api\TimetableExportController::class, 'exportPdf']);
        Route::get('/export/{type}/{id}/ics', [\App\Http\Controllers\Api\TimetableExportController::class, 'exportIcs']);
        Route::post('/generate', [\App\Http\Controllers\Api\TimetableController::class, 'generate']);
        Route::post('/check-conflict', [\App\Http\Controllers\Api\TimetableController::class, 'checkConflict']);
    });

    // Exam Planning & Convocations
    Route::prefix('exam-planning')->group(function () {
        Route::post('/generate-session', [\App\Http\Controllers\Api\ExamPlanningController::class, 'generateSession']);
        
        // New Convocations & Live routes
        Route::post('/{sessionId}/auto-assign-proctors', [\App\Http\Controllers\Api\ConvocationController::class, 'autoAssign']);
        Route::post('/{examId}/generate-convocations', [\App\Http\Controllers\Api\ConvocationController::class, 'generate']);
        Route::post('/{examId}/send-emails', [\App\Http\Controllers\Api\ConvocationController::class, 'sendEmails']);
        Route::post('/scan-qr', [\App\Http\Controllers\Api\ConvocationController::class, 'scanQr']);
        Route::get('/{examId}/live-stats', [\App\Http\Controllers\Api\ConvocationController::class, 'liveStats']);
        Route::post('/{examId}/notify-absents', [\App\Http\Controllers\Api\ConvocationController::class, 'notifyAbsents']);
    });

    // Retakes
    Route::prefix('retakes')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\RetakeController::class, 'index']);
        Route::patch('/{id}/status', [\App\Http\Controllers\Api\RetakeController::class, 'updateStatus']);
    });

    // Professor Availability
    Route::prefix('professor-availability')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ProfessorAvailabilityController::class, 'index']);
        Route::post('/alert', [\App\Http\Controllers\Api\ProfessorAvailabilityController::class, 'alert']);
    });

    // Schedule Change Requests
    Route::prefix('schedule-change-requests')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ScheduleChangeRequestController::class, 'index']);
        Route::patch('/{id}/status', [\App\Http\Controllers\Api\ScheduleChangeRequestController::class, 'updateStatus']);
    });

    // Student Absences Justification
    Route::prefix('student')->group(function () {
        Route::post('/absences/upload', [\App\Http\Controllers\Api\ConvocationController::class, 'uploadJustification']);
    });

    // Admin — Absence Justifications Management
    Route::prefix('admin/absences-justifications')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\AbsenceJustificationController::class, 'index']);
        Route::patch('/{absenceJustification}/status', [\App\Http\Controllers\Api\AbsenceJustificationController::class, 'updateStatus']);
        Route::delete('/{absenceJustification}', [\App\Http\Controllers\Api\AbsenceJustificationController::class, 'destroy']);
    });

    // Analytics & AI
    Route::prefix('analytics')->group(function () {
        Route::get('/at-risk-students', [\App\Http\Controllers\Api\AnalyticsController::class, 'getAtRiskStudents']);
    });

    // Anti-Fraud Documents & PDFs
    Route::prefix('documents')->group(function () {
        Route::post('/generate', [\App\Http\Controllers\Api\DocumentController::class, 'generate']);
        Route::get('/verify/{token}', [\App\Http\Controllers\Api\DocumentController::class, 'verify']);
        
        // PDF Previews
        Route::get('/preview/ordre-mission', [\App\Http\Controllers\Api\PdfExportController::class, 'previewOrdreMission']);
        Route::get('/preview/convention-stage', [\App\Http\Controllers\Api\PdfExportController::class, 'previewConventionStage']);
        Route::get('/preview/attestation-travail', [\App\Http\Controllers\Api\PdfExportController::class, 'previewAttestationTravail']);
        Route::get('/preview/releve-notes', [\App\Http\Controllers\Api\PdfExportController::class, 'releveNotes']);
    });

    // Admin — Document Requests Management
    Route::prefix('admin/document-requests')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\DocumentRequestController::class, 'index']);
        Route::patch('/{documentRequest}/status', [\App\Http\Controllers\Api\DocumentRequestController::class, 'updateStatus']);
    });

    // Admissions / TAFEM
    Route::prefix('admissions')->group(function () {
        Route::post('/campaigns/{campaignId}/calculate-seuil', [\App\Http\Controllers\Api\AdmissionCampaignController::class, 'calculateSeuil']);
    });

    // AI Assistant & Features
    Route::post('/chatbot/message', [\App\Http\Controllers\Api\AiAssistantController::class, 'chat']);
    Route::post('/professor/ai/generate-qcm', [\App\Http\Controllers\Api\AiAssistantController::class, 'generateQuiz']);

    // Alumni / Insertion Pro
    Route::prefix('alumni')->group(function () {
        Route::get('/dashboard-stats', [\App\Http\Controllers\Api\AlumniController::class, 'getDashboardStats']);
    });

    // HR & Vacataires
    Route::prefix('hr/vacataires')->group(function () {
        Route::get('/contracts', [\App\Http\Controllers\Api\VacataireManagerController::class, 'getContracts']);
        Route::get('/contracts/{id}/sessions', [\App\Http\Controllers\Api\VacataireManagerController::class, 'getSessions']);
        Route::post('/contracts/{id}/sessions', [\App\Http\Controllers\Api\VacataireManagerController::class, 'logSession']);
        Route::post('/contracts/{id}/payments', [\App\Http\Controllers\Api\VacataireManagerController::class, 'generatePayment']);
    });

    // Student Portal
    Route::prefix('student-portal')->group(function () {
        Route::get('/grades', [\App\Http\Controllers\Api\StudentPortalController::class, 'getGrades']);
        Route::get('/schedule', [\App\Http\Controllers\Api\StudentPortalController::class, 'getSchedule']);
        Route::post('/absences', [\App\Http\Controllers\Api\StudentPortalController::class, 'submitAbsence']);
    });

    Route::prefix('dashboard')->group(function () {
    // Dashboard & Pilotage
    Route::get('/stats', [\App\Http\Controllers\Api\DashboardController::class, 'getStats']);
    Route::get('/pilotage/metrics', [\App\Http\Controllers\Api\PilotageController::class, 'getGlobalMetrics']);
        Route::get('/admin/stats', [\App\Http\Controllers\Api\DashboardController::class, 'getAdminStats']);
        Route::get('/executive/stats', [\App\Http\Controllers\Api\DashboardController::class, 'getExecutiveStats']);
        Route::get('/student/stats', [\App\Http\Controllers\Api\DashboardController::class, 'getStudentStats']);
        Route::get('/professor/stats', [\App\Http\Controllers\Api\DashboardController::class, 'getProfessorStats']);
        // For the generic dashboard fetch
        Route::get('/stats', [\App\Http\Controllers\Api\DashboardController::class, 'getAdminStats']); 
        
        // Activity Timeline
        Route::get('/timeline', [\App\Http\Controllers\Api\TimelineController::class, 'index']);
        
        // Global Search
        Route::get('/search', [\App\Http\Controllers\Api\SearchController::class, 'search']);
        
        // APOGEE Academic Engine
        Route::post('/academic/grade-periods', [\App\Http\Controllers\Api\ApogeeEngineController::class, 'openGradePeriod']);
        Route::get('/academic/mock-deliberation', [\App\Http\Controllers\Api\ApogeeEngineController::class, 'mockDeliberation']);
        Route::get('/academic/reports/{type}', [\App\Http\Controllers\Api\AcademicReportController::class, 'generate']);
    });

    // Timetable
    Route::get('/timetable/export/{type}/{id}', [\App\Http\Controllers\Api\TimetableExportController::class, 'exportForFullCalendar']);
    // ---------------------------------------------------------
    // GENERATION DE DOCUMENTS PDF (DomPDF)
    // ---------------------------------------------------------
    Route::get('/admin/convocations/print-session', [\App\Http\Controllers\Api\PdfExportController::class, 'printSession']);
    Route::get('/admin/convocations/print-professors', [\App\Http\Controllers\Api\PdfExportController::class, 'printProfessors']);
    Route::get('/professor/exams/{exam}/pv/pdf', [\App\Http\Controllers\Api\PdfExportController::class, 'pvExamen']);
    Route::get('/admin/pv-globaux/pdf', [\App\Http\Controllers\Api\PdfExportController::class, 'pvGlobal']);
    Route::get('/admin/students/{id}/releve-notes/{year}', [\App\Http\Controllers\Api\PdfExportController::class, 'releveNotes']);
    Route::get('/admin/students/{id}/attestation-reussite/{year}', [\App\Http\Controllers\Api\PdfExportController::class, 'attestationReussite']);
    Route::get('/admin/exams/{exam}/attendance-sheet', [\App\Http\Controllers\Api\PdfExportController::class, 'attendanceSheet']);
    Route::get('/admin/reports/absences', [\App\Http\Controllers\Api\PdfExportController::class, 'rapportAbsences']);
    Route::get('/admin/schedules/export/group-pdf', [\App\Http\Controllers\Api\PdfExportController::class, 'exportScheduleGroupPdf']);
    Route::get('/admin/exams/{exam}/live-attendance/pdf', [\App\Http\Controllers\Api\PdfExportController::class, 'liveAttendancePdf']);
    Route::get('/admin/exams/{exam}/display-list/pdf', [\App\Http\Controllers\Api\PdfExportController::class, 'displayList']);
    
});

// Public Documents & Cards Verification
Route::get('/verify/document/{documentId}', [\App\Http\Controllers\Api\PublicVerificationController::class, 'verifyDocument']);
Route::get('/verify/card/{token}', [\App\Http\Controllers\Api\StudentCardController::class, 'verify']);

// Mobile App Student Portal API
// Authenticated Routes
Route::middleware(['auth:sanctum', \App\Http\Middleware\EnsureInstitutionContext::class])->prefix('v1/mobile/student')->group(function () {
    Route::get('/profile', [MobileStudentController::class, 'profile']);
    Route::get('/schedule', [MobileStudentController::class, 'schedule']);
    Route::get('/grades', [MobileStudentController::class, 'grades']);
    Route::get('/card', [\App\Http\Controllers\Api\StudentCardController::class, 'show']);
    Route::post('/attendance/scan', [\App\Http\Controllers\Api\AttendanceController::class, 'scanQr']);
});

// Professor API
Route::middleware(['auth:sanctum'])->prefix('v1/professor')->group(function () {
    Route::post('/attendance/session', [\App\Http\Controllers\Api\AttendanceController::class, 'createSession']);
    Route::get('/attendance/session/{id}/stats', [\App\Http\Controllers\Api\AttendanceController::class, 'sessionStats']);
});

// ---------------------------------------------------------
// REST API (Protected endpoints for third-party integrations)
// ---------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
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

// ---------------------------------------------------------
// INTERNAL DYNAMIC ENDPOINTS (Admin Web Auth)
// ---------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/api/filieres/{id}/groups', [\App\Http\Controllers\Api\InternalApiController::class, 'filiereGroups']);
    Route::get('/admin/api/groups/{id}/modules', [\App\Http\Controllers\Api\InternalApiController::class, 'groupModules']);
    Route::get('/admin/api/rooms/{id}/availability', [\App\Http\Controllers\Api\InternalApiController::class, 'roomAvailability']);
    Route::get('/admin/exams/api/calendar', [\App\Http\Controllers\Api\InternalApiController::class, 'examCalendar']);
    Route::get('/admin/timetable/calendar-events', [\App\Http\Controllers\Api\InternalApiController::class, 'timetableEvents']);
    Route::get('/admin/exams/{exam}/live-attendance/stats', [\App\Http\Controllers\Api\InternalApiController::class, 'liveAttendanceStats']);
    Route::get('/classroom/chat/{group}/{module}/messages', [\App\Http\Controllers\Api\InternalApiController::class, 'chatMessages']);
    Route::post('/admin/schedules/makeup/suggest', [\App\Http\Controllers\Api\InternalApiController::class, 'suggestMakeup']);
});
