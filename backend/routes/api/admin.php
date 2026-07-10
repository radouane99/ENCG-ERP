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



Route::middleware(['auth:sanctum', 'role:super-admin|institution-admin|director|department-head|finance-officer|hr-officer|library-manager|discipline-committee'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Removed db-test route from here

    Route::post('/profile', [\App\Http\Controllers\Api\ProfileController::class, 'update']);



Route::get('/check-students', function() {
    $count = \App\Models\StudentPathway::count();
    return "Total assigned students: " . $count;
});
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
    Route::post('academic-years/{id}/rollover', [\App\Http\Controllers\Api\AcademicYearController::class, 'rollover']);
    Route::apiResource('exam-sessions', \App\Http\Controllers\Api\ExamSessionController::class);
    Route::apiResource('final-projects', \App\Http\Controllers\Api\FinalProjectController::class);
    Route::apiResource('attendances', \App\Http\Controllers\Api\AttendanceController::class)->only(['index', 'destroy']);

    // Clubs
    Route::apiResource('clubs', \App\Http\Controllers\Api\ClubController::class)->except(['destroy']);

    // Internships
    Route::apiResource('internships', \App\Http\Controllers\Api\InternshipController::class)->except(['destroy']);
    Route::prefix('admin/internships')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Admin\AdminInternshipController::class, 'index']);
        Route::post('/{id}/validate', [\App\Http\Controllers\Api\Admin\AdminInternshipController::class, 'validateInternship']);
        Route::post('/soutenances', [\App\Http\Controllers\Api\Admin\AdminInternshipController::class, 'scheduleSoutenance']);
    });

    // Complaints
    Route::apiResource('complaints', \App\Http\Controllers\Api\ComplaintController::class)->except(['destroy']);

    // Discipline
    Route::apiResource('discipline', \App\Http\Controllers\Api\DisciplineController::class)->except(['destroy']);
    Route::post('discipline/{id}/decide', [\App\Http\Controllers\Api\DisciplineController::class, 'decide']);
    
    // Absences (Admin)
    Route::prefix('admin/absences')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Api\Admin\AdminAbsenceController::class, 'stats']);
        Route::post('/justifications/{id}/review', [\App\Http\Controllers\Api\Admin\AdminAbsenceController::class, 'review']);
    });
    
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

    Route::apiResource('departments', \App\Http\Controllers\Api\DepartmentController::class);
    Route::apiResource('users', \App\Http\Controllers\Api\UserController::class);
    Route::apiResource('professor-assignments', \App\Http\Controllers\Api\ProfessorAssignmentController::class)->except(['show', 'update']);

    // Exam Locking (Admin)
    Route::prefix('admin/exam-locking')->middleware('require-admin-2fa')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ExamLockingController::class, 'index']);
        Route::post('/change', [\App\Http\Controllers\Api\ExamLockingController::class, 'updateStatus']);
    });

    // Infrastructure
    Route::apiResource('rooms', \App\Http\Controllers\Api\RoomController::class);

    // Excel Import / Export (global — all modules)
    Route::get('export/{model}', [\App\Http\Controllers\Api\ExcelController::class, 'export']);
    Route::get('export/{model}/template', [\App\Http\Controllers\Api\ExcelController::class, 'template']);
    Route::post('import/{model}', [\App\Http\Controllers\Api\ExcelController::class, 'import'])->middleware('throttle:10,1');

    // Secure Documents & Anti-Fraud
    Route::post('documents/generate-attestation', [\App\Http\Controllers\Api\DocumentController::class, 'generateAttestation']);
    Route::get('documents/verify/{trackingCode}', [\App\Http\Controllers\Api\DocumentController::class, 'verifyDocument']);

    // Admissions (TAFEM & Applications)
    Route::prefix('admissions')->group(function () {
        Route::get('/campaigns/{campaign}/applications', [\App\Http\Controllers\Api\AdmissionController::class, 'index']);
        Route::patch('/applications/{application}/status', [\App\Http\Controllers\Api\AdmissionController::class, 'updateStatus']);
        Route::delete('/applications/{application}', [\App\Http\Controllers\Api\AdmissionController::class, 'destroy']);
    });

    // Exports (admin-only Excel export)
    Route::get('/export/students', function (\Illuminate\Http\Request $request) {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\StudentsExport(), 'etudiants.xlsx');
    });
    
    // Timetable & Smart Scheduling
    Route::prefix('timetable')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\TimetableController::class, 'index']);
        Route::get('/export/{type}/{id}', [\App\Http\Controllers\Api\TimetableExportController::class, 'exportForFullCalendar']);
        Route::get('/export/{type}/{id}/pdf', [\App\Http\Controllers\Api\TimetableExportController::class, 'exportPdf']);
        Route::get('/export/{type}/{id}/ics', [\App\Http\Controllers\Api\TimetableExportController::class, 'exportIcs']);
        Route::post('/generate', [\App\Http\Controllers\Api\TimetableController::class, 'generate']);
        Route::post('/publish', [\App\Http\Controllers\Api\TimetableController::class, 'publish']);
        Route::post('/check-conflict', [\App\Http\Controllers\Api\TimetableController::class, 'checkConflict']);
    });

    // Smart Scheduling
    Route::post('/schedules/auto-generate', [\App\Http\Controllers\Api\SmartSchedulingController::class, 'autoGenerate']);

    // Exam Planning & Convocations
    Route::prefix('exam-planning')->group(function () {
        Route::post('/generate-session', [\App\Http\Controllers\Api\ExamPlanningController::class, 'generateSession']);
        Route::post('/store', [\App\Http\Controllers\Api\ExamPlanningController::class, 'store']);
        Route::post('/check-conflict', [\App\Http\Controllers\Api\ExamPlanningController::class, 'checkRoomConflict']);
        
        // New Convocations module logic
        Route::prefix('/{exam}/convocations')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\Admin\AdminExamConvocationController::class, 'index']);
            Route::post('/generate', [\App\Http\Controllers\Api\Admin\AdminExamConvocationController::class, 'generate']);
            Route::post('/publish', [\App\Http\Controllers\Api\Admin\AdminExamConvocationController::class, 'publish']);
        });
        
        // New Convocations & Live routes
        Route::post('/{sessionId}/auto-assign-proctors', [\App\Http\Controllers\Api\ConvocationController::class, 'autoAssign']);
        // Old endpoints are replaced by the /convocations group below
        Route::get('/{examId}/live-stats', [\App\Http\Controllers\Api\ConvocationController::class, 'liveStats']);
        Route::get('/{examId}/details', [\App\Http\Controllers\Api\ConvocationController::class, 'getDetails']);
        // [AUDIT ROUTE-01] Fixed: duplicate notify-absents route removed (was registered twice)
        Route::post('/{examId}/notify-absents', [\App\Http\Controllers\Api\ConvocationController::class, 'notifyAbsents']);
        
        // Student endpoints
        Route::get('/student/{studentId}', [\App\Http\Controllers\Api\ConvocationController::class, 'getStudentConvocations']);
        Route::get('/student/{id}/download', [\App\Http\Controllers\Api\PdfExportController::class, 'studentConvocationPdf']);
    });

    // Convocations Lifecycle
    Route::prefix('convocations')->group(function () {
        Route::post('/generate-session', [\App\Http\Controllers\Api\ConvocationController::class, 'generateSession']);
        Route::post('/send-session', [\App\Http\Controllers\Api\ConvocationController::class, 'sendSession']);
        Route::get('/{reference}/verify', [\App\Http\Controllers\Api\ConvocationController::class, 'verify']);
        Route::post('/{reference}/present', [\App\Http\Controllers\Api\ConvocationController::class, 'markPresent']);
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



    // Admin — Absence Justifications Management
    Route::prefix('admin/absences-justifications')->middleware('require-admin-2fa')->group(function () {
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
    Route::prefix('admin/document-requests')->middleware('require-admin-2fa')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Admin\AdminDocumentRequestController::class, 'index']);
        Route::patch('/{id}/status', [\App\Http\Controllers\Api\Admin\AdminDocumentRequestController::class, 'updateStatus']);
        Route::post('/{id}/generate', [\App\Http\Controllers\Api\Admin\AdminDocumentRequestController::class, 'generate']);
    });

    // Admin — Document Types Management
    Route::apiResource('admin/document-types', \App\Http\Controllers\Api\Admin\AdminDocumentTypeController::class)->middleware('require-admin-2fa');

    // Admissions / TAFEM
    Route::prefix('admissions')->group(function () {
        Route::post('/campaigns/{campaignId}/calculate-seuil', [\App\Http\Controllers\Api\AdmissionCampaignController::class, 'calculateSeuil']);
    });

    // [AUDIT ROUTE-01] Chatbot, alumni, REST, and dashboard routes moved to shared.php
    // [AUDIT ROUTE-02] Dead vacataire-manager group (all-commented) removed
    // Student Portal
    Route::prefix('student-portal')->group(function () {
        Route::get('/grades', [\App\Http\Controllers\Api\StudentPortalController::class, 'getGrades']);
        Route::get('/schedule', [\App\Http\Controllers\Api\StudentPortalController::class, 'getSchedule']);
        Route::post('/absences', [\App\Http\Controllers\Api\StudentPortalController::class, 'submitAbsence']);
    });

    // [AUDIT ROUTE-01] Dashboard routes (stats, search, timeline, pilotage) live in shared.php
    // Admin-exclusive APOGEE Academic Engine routes kept here:
    Route::prefix('dashboard')->group(function () {
        Route::post('/academic/grade-periods', [\App\Http\Controllers\Api\ApogeeEngineController::class, 'openGradePeriod']);
        Route::post('/academic/deliberation/run', [\App\Http\Controllers\Api\ApogeeEngineController::class, 'runDeliberation']);
        Route::get('/academic/reports/{type}', [\App\Http\Controllers\Api\AcademicReportController::class, 'generate']);
    });

    // [AUDIT ROUTE-01] /timetable/export duplicate removed (already in shared.php)
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

// [AUDIT ROUTE-01] Public verify routes are already in shared.php — removed duplicates here.



// ---------------------------------------------------------
// REST API (Protected endpoints for third-party integrations)
// ---------------------------------------------------------

Route::get('/test-doc', function() {
    try {
        $reqs = \App\Models\DocumentRequest::where('status', 'pending')->get();
        if ($reqs->isEmpty()) return 'No pending requests found';
        $out = [];
        foreach ($reqs as $req) {
            try {
                app(\App\Services\DocumentRequestService::class)->processRequest($req, 'ready');
                $out[] = "Success for {$req->id} ({$req->documentType->name})";
            } catch (\Exception $e) {
                $out[] = "Error for {$req->id}: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine();
            }
        }
        return response()->json($out);
    } catch (\Exception $e) {
        return 'Global Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine();
    }
});


Route::prefix('rest')->middleware('auth:sanctum')->group(function () {
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
Route::middleware(['auth:sanctum', 'role:super-admin|institution-admin|director|department-head'])->group(function () {
    Route::get('/admin/api/filieres/{id}/groups', [\App\Http\Controllers\Api\InternalApiController::class, 'filiereGroups']);
    Route::get('/admin/api/groups/{id}/modules', [\App\Http\Controllers\Api\InternalApiController::class, 'groupModules']);
    Route::get('/admin/api/rooms/{id}/availability', [\App\Http\Controllers\Api\InternalApiController::class, 'roomAvailability']);
    Route::get('/admin/exams/api/calendar', [\App\Http\Controllers\Api\InternalApiController::class, 'examCalendar']);
    Route::get('/admin/timetable/calendar-events', [\App\Http\Controllers\Api\InternalApiController::class, 'timetableEvents']);
    Route::get('/admin/exams/{exam}/live-attendance/stats', [\App\Http\Controllers\Api\InternalApiController::class, 'liveAttendanceStats']);
    Route::get('/classroom/chat/{group}/{module}/messages', [\App\Http\Controllers\Api\InternalApiController::class, 'chatMessages']);
    Route::post('/admin/schedules/makeup/suggest', [\App\Http\Controllers\Api\InternalApiController::class, 'suggestMakeup']);
    Route::post('/classroom/ai/tutor', [\App\Http\Controllers\Api\AiFeatureController::class, 'tutor']);
    
    // Admin Guichet & Analytics
    Route::get('/admin/analytics', [\App\Http\Controllers\Api\AdminAnalyticsController::class, 'index']);
    Route::get('/admin/document-requests', [\App\Http\Controllers\Api\AdminDocumentRequestController::class, 'index']);
    Route::patch('/admin/document-requests/{documentRequest}/status', [\App\Http\Controllers\Api\AdminDocumentRequestController::class, 'updateStatus']);
});
