<?php

use App\Exports\StudentsExport;
use App\Http\Controllers\Api\AbsenceJustificationController;
use App\Http\Controllers\Api\AcademicReportController;
use App\Http\Controllers\Api\AcademicYearController;
use App\Http\Controllers\Api\Admin\AdminAbsenceController;
use App\Http\Controllers\Api\Admin\AdminDocumentTypeController;
use App\Http\Controllers\Api\Admin\AdminExamConvocationController;
use App\Http\Controllers\Api\AdminAnalyticsController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminDocumentRequestController;
use App\Http\Controllers\Api\AdminExamController;
use App\Http\Controllers\Api\AdminInternshipController;
use App\Http\Controllers\Api\AdminPredictiveAnalyticsController;
use App\Http\Controllers\Api\AdminSmartCampusController;
use App\Http\Controllers\Api\AdmissionCampaignController;
use App\Http\Controllers\Api\AdmissionController;
use App\Http\Controllers\Api\AiFeatureController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\ApogeeEngineController;
use App\Http\Controllers\Api\AssessmentController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\ClubController;
use App\Http\Controllers\Api\ComplaintController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\ConvocationController;
use App\Http\Controllers\Api\DeliberationController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\DisciplineController;
use App\Http\Controllers\Api\DocumentCenterController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\ExamAttendanceController;
use App\Http\Controllers\Api\ExamLockingController;
use App\Http\Controllers\Api\ExamPlanningController;
use App\Http\Controllers\Api\ExamSessionController;
use App\Http\Controllers\Api\ExcelController;
use App\Http\Controllers\Api\FiliereController;
use App\Http\Controllers\Api\FinalProjectController;
use App\Http\Controllers\Api\GradeController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\HolidayController;
use App\Http\Controllers\Api\InternalApiController;
use App\Http\Controllers\Api\InternshipController;
use App\Http\Controllers\Api\LmsCourseController;
use App\Http\Controllers\Api\ModuleController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PdfExportController;
use App\Http\Controllers\Api\ProfessorAssignmentController;
use App\Http\Controllers\Api\ProfessorAvailabilityController;
use App\Http\Controllers\Api\ProfessorController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RestApiController;
use App\Http\Controllers\Api\RetakeController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\ScheduleChangeRequestController;
use App\Http\Controllers\Api\SmartSchedulingController;
use App\Http\Controllers\Api\StudentCardController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\StudentPortalController;
use App\Http\Controllers\Api\StudentTranscriptController;
use App\Http\Controllers\Api\TimetableController;
use App\Http\Controllers\Api\TimetableExportController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VacataireController;
use App\Models\DocumentRequest;
use App\Models\StudentPathway;
use App\Services\DocumentRequestService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Maatwebsite\Excel\Facades\Excel;

Route::post('/contact', [ContactController::class, 'send'])->middleware('throttle:6,1');

Route::middleware(['auth:sanctum', 'role:super-admin|institution-admin|director|department-head|finance-officer|hr-officer|library-manager|discipline-committee'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Removed db-test route from here

    Route::post('/profile', [ProfileController::class, 'update']);

    // Dashboard Stats
    Route::get('/dashboard/stats', [AdminDashboardController::class, 'getStats']);

    // Admin Custom Routes
    Route::get('/smart-campus', [AdminSmartCampusController::class, 'getCampusData']);
    Route::get('/exams/analytics', [AdminExamController::class, 'analytics']);
    Route::post('/documents/generate', [DocumentCenterController::class, 'generate']);
    Route::apiResource('holidays', HolidayController::class);

    // AI Predictive Analytics
    Route::get('/predictive-analytics', [AdminPredictiveAnalyticsController::class, 'index']);
    Route::post('/predictive-analytics/refresh', [AdminPredictiveAnalyticsController::class, 'refresh']);

    Route::prefix('discipline')->group(function () {
        Route::get('/', [DisciplineController::class, 'index']);
        Route::post('/', [DisciplineController::class, 'store']);
        Route::post('/{id}/decide', [DisciplineController::class, 'decide']);
    });

    Route::prefix('internships')->group(function () {
        Route::get('/', [AdminInternshipController::class, 'index']);
        Route::put('/{id}/status', [AdminInternshipController::class, 'updateStatus']);
    });

    Route::get('/check-students', function () {
        $count = StudentPathway::count();

        return 'Total assigned students: '.$count;
    });
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
    });

    // LMS & E-Learning
    Route::prefix('lms')->group(function () {
        Route::get('/courses', [LmsCourseController::class, 'index']);
        Route::get('/courses/{id}', [LmsCourseController::class, 'show']);
        Route::post('/courses/{id}/materials', [LmsCourseController::class, 'storeMaterial']);
    });

    // Academic Structure
    Route::apiResource('filieres', FiliereController::class);
    Route::apiResource('modules', ModuleController::class);
    Route::apiResource('students', StudentController::class);
    Route::post('student-cards/preview', [StudentCardController::class, 'preview']);
    Route::post('student-cards', [StudentCardController::class, 'store']);
    Route::get('student-cards', [StudentCardController::class, 'index']);
    Route::patch('student-cards/{id}/status', [StudentCardController::class, 'updateStatus']);
    Route::post('student-cards/bulk', [StudentCardController::class, 'bulkStore']);
    Route::apiResource('groups', GroupController::class);
    Route::apiResource('academic-years', AcademicYearController::class);
    Route::post('academic-years/{id}/rollover', [AcademicYearController::class, 'rollover']);
    Route::apiResource('exam-sessions', ExamSessionController::class);
    Route::apiResource('final-projects', FinalProjectController::class);
    Route::apiResource('attendances', AttendanceController::class)->only(['index', 'destroy']);

    // Clubs
    Route::apiResource('clubs', ClubController::class)->except(['destroy']);

    // Internships
    Route::apiResource('internships', InternshipController::class)->except(['destroy']);
    Route::prefix('admin/internships')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\Admin\AdminInternshipController::class, 'index']);
        Route::post('/{id}/validate', [App\Http\Controllers\Api\Admin\AdminInternshipController::class, 'validateInternship']);
        Route::post('/soutenances', [App\Http\Controllers\Api\Admin\AdminInternshipController::class, 'scheduleSoutenance']);
    });

    // Complaints
    Route::apiResource('complaints', ComplaintController::class)->except(['destroy']);

    // Discipline
    Route::apiResource('discipline', DisciplineController::class)->except(['destroy']);
    Route::post('discipline/{id}/decide', [DisciplineController::class, 'decide']);

    // Absences (Admin)
    Route::prefix('admin/absences')->group(function () {
        Route::get('/stats', [AdminAbsenceController::class, 'stats']);
        Route::post('/justifications/{id}/review', [AdminAbsenceController::class, 'review']);
    });

    // Grades & Deliberation
    Route::prefix('grades')->group(function () {
        Route::post('/batch', [GradeController::class, 'storeBatch']);
        Route::post('/validate', [GradeController::class, 'validateGrades']);
    });
    Route::get('modules/{module}/assessments', [AssessmentController::class, 'getForModule']);
    Route::post('modules/{module}/assessments', [AssessmentController::class, 'storeForModule']);
    Route::get('modules/{module}/pv', [GradeController::class, 'getModulePv']);
    Route::post('modules/{module}/pv/sign', [GradeController::class, 'signModulePv']);
    Route::get('modules/{module}/export-grades', [GradeController::class, 'exportGradesTemplate']);
    Route::post('modules/{module}/import-grades', [GradeController::class, 'importGrades']);
    Route::get('modules/{module}/audit-logs', [GradeController::class, 'getModuleAuditLogs']);
    Route::get('assessments/{assessment}/grades', [GradeController::class, 'getForAssessment']);
    Route::post('assessments/{assessment}/grades', [GradeController::class, 'storeBulk']);
    Route::get('academic/deliberate', [DeliberationController::class, 'run']);

    // Student Transcript PDF
    Route::get('students/{student}/transcript', [StudentTranscriptController::class, 'generateForAdmin']);

    // HR & Personnel
    Route::prefix('hr')->group(function () {
        Route::apiResource('professors', ProfessorController::class);
        Route::get('vacataires/{vacataire}/contract-pdf', [VacataireController::class, 'downloadContract']);
        Route::post('vacataires/contracts/{contractId}/payments', [VacataireController::class, 'processPayment']);
        Route::apiResource('vacataires', VacataireController::class);
    });

    Route::apiResource('departments', DepartmentController::class);
    Route::apiResource('users', UserController::class);
    Route::apiResource('professor-assignments', ProfessorAssignmentController::class)->except(['show', 'update']);

    // Exam Locking (Admin)
    Route::prefix('admin/exam-locking')->middleware('require-admin-2fa')->group(function () {
        Route::get('/', [ExamLockingController::class, 'index']);
        Route::post('/change', [ExamLockingController::class, 'updateStatus']);
    });

    // Infrastructure
    Route::apiResource('rooms', RoomController::class);

    // Excel Import / Export (global — all modules)
    Route::get('export/{model}', [ExcelController::class, 'export']);
    Route::get('export/{model}/template', [ExcelController::class, 'template']);
    Route::post('import/{model}', [ExcelController::class, 'import'])->middleware('throttle:10,1');

    // Secure Documents & Anti-Fraud
    Route::post('documents/generate-attestation', [DocumentController::class, 'generateAttestation']);
    Route::get('documents/verify/{trackingCode}', [DocumentController::class, 'verifyDocument']);

    // Admissions (TAFEM & Applications)
    Route::prefix('admissions')->group(function () {
        Route::get('/campaigns/{campaign}/applications', [AdmissionController::class, 'index']);
        Route::patch('/applications/{application}/status', [AdmissionController::class, 'updateStatus']);
        Route::delete('/applications/{application}', [AdmissionController::class, 'destroy']);
    });

    // Exports (admin-only Excel export)
    Route::get('/export/students', function (Request $request) {
        return Excel::download(new StudentsExport, 'etudiants.xlsx');
    });

    // Timetable & Smart Scheduling
    Route::prefix('timetable')->group(function () {
        Route::get('/', [TimetableController::class, 'index']);
        Route::post('/', [TimetableController::class, 'store']);
        Route::put('/{id}', [TimetableController::class, 'update']);
        Route::delete('/{id}', [TimetableController::class, 'destroy']);
        Route::get('/export/{type}/{id}', [TimetableExportController::class, 'exportForFullCalendar']);
        Route::get('/export/{type}/{id}/pdf', [TimetableExportController::class, 'exportPdf']);
        Route::get('/export/{type}/{id}/ics', [TimetableExportController::class, 'exportIcs']);
        Route::post('/generate', [TimetableController::class, 'generate']);
        Route::post('/publish', [TimetableController::class, 'publish']);
        Route::post('/check-conflict', [TimetableController::class, 'checkConflict']);
    });

    // Smart Scheduling
    Route::post('/schedules/auto-generate', [SmartSchedulingController::class, 'autoGenerate']);

    // Exam Planning & Convocations
    Route::prefix('exam-planning')->group(function () {
        Route::post('/generate-session', [ExamPlanningController::class, 'generateSession']);
        Route::post('/store', [ExamPlanningController::class, 'store']);
        Route::post('/check-conflict', [ExamPlanningController::class, 'checkRoomConflict']);

        // New Convocations module logic
        Route::prefix('/{exam}/convocations')->group(function () {
            Route::get('/', [AdminExamConvocationController::class, 'index']);
            Route::post('/generate', [AdminExamConvocationController::class, 'generate']);
            Route::post('/publish', [AdminExamConvocationController::class, 'publish']);
        });

        // New Convocations & Live routes
        Route::post('/{sessionId}/auto-assign-proctors', [ConvocationController::class, 'autoAssign']);
        // Old endpoints are replaced by the /convocations group below
        Route::get('/{examId}/live-stats', [ExamAttendanceController::class, 'getLiveStats']);
        Route::get('/{examId}/details', [ConvocationController::class, 'getDetails']);
        // [AUDIT ROUTE-01] Fixed: duplicate notify-absents route removed (was registered twice)
        Route::post('/{examId}/notify-absents', [ConvocationController::class, 'notifyAbsents']);

        // Student endpoints
        Route::get('/student/{studentId}', [ConvocationController::class, 'getStudentConvocations']);
        Route::get('/student/{id}/download', [PdfExportController::class, 'studentConvocationPdf']);
    });

    // Convocations Lifecycle
    Route::prefix('convocations')->group(function () {
        Route::post('/generate-session', [ConvocationController::class, 'generateSession']);
        Route::post('/send-session', [ConvocationController::class, 'sendSession']);
        Route::get('/{reference}/verify', [ConvocationController::class, 'verify']);
        Route::post('/{reference}/present', [ConvocationController::class, 'markPresent']);
    });

    // Retakes
    Route::prefix('retakes')->group(function () {
        Route::get('/', [RetakeController::class, 'index']);
        Route::patch('/{id}/status', [RetakeController::class, 'updateStatus']);
    });

    // Professor Availability
    Route::prefix('professor-availability')->group(function () {
        Route::get('/', [ProfessorAvailabilityController::class, 'index']);
        Route::post('/alert', [ProfessorAvailabilityController::class, 'alert']);
    });

    // Schedule Change Requests
    Route::prefix('schedule-change-requests')->group(function () {
        Route::get('/', [ScheduleChangeRequestController::class, 'index']);
        Route::patch('/{id}/status', [ScheduleChangeRequestController::class, 'updateStatus']);
    });

    // Admin — Absence Justifications Management
    Route::prefix('admin/absences-justifications')->middleware('require-admin-2fa')->group(function () {
        Route::get('/', [AbsenceJustificationController::class, 'index']);
        Route::patch('/{absenceJustification}/status', [AbsenceJustificationController::class, 'updateStatus']);
        Route::delete('/{absenceJustification}', [AbsenceJustificationController::class, 'destroy']);
    });

    // Analytics & AI
    Route::prefix('analytics')->group(function () {
        Route::get('/at-risk-students', [AnalyticsController::class, 'getAtRiskStudents']);
    });

    // Anti-Fraud Documents & PDFs
    Route::prefix('documents')->group(function () {
        Route::post('/generate', [DocumentController::class, 'generate']);
        Route::get('/verify/{token}', [DocumentController::class, 'verify']);

        // PDF Previews
        Route::get('/preview/ordre-mission', [PdfExportController::class, 'previewOrdreMission']);
        Route::get('/preview/convention-stage', [PdfExportController::class, 'previewConventionStage']);
        Route::get('/preview/attestation-travail', [PdfExportController::class, 'previewAttestationTravail']);
        Route::get('/preview/releve-notes', [PdfExportController::class, 'releveNotes']);
    });

    // Admin — Document Requests Management
    Route::prefix('admin/document-requests')->middleware('require-admin-2fa')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\Admin\AdminDocumentRequestController::class, 'index']);
        Route::patch('/{id}/status', [App\Http\Controllers\Api\Admin\AdminDocumentRequestController::class, 'updateStatus']);
        Route::post('/{id}/generate', [App\Http\Controllers\Api\Admin\AdminDocumentRequestController::class, 'generate']);
    });

    // Admin — Document Types Management
    Route::apiResource('admin/document-types', AdminDocumentTypeController::class)->middleware('require-admin-2fa');

    // Admissions / TAFEM
    Route::prefix('admissions')->group(function () {
        Route::post('/campaigns/{campaignId}/calculate-seuil', [AdmissionCampaignController::class, 'calculateSeuil']);
    });

    // [AUDIT ROUTE-01] Chatbot, alumni, REST, and dashboard routes moved to shared.php
    // [AUDIT ROUTE-02] Dead vacataire-manager group (all-commented) removed
    // Student Portal
    Route::prefix('student-portal')->group(function () {
        Route::get('/grades', [StudentPortalController::class, 'getGrades']);
        Route::get('/schedule', [StudentPortalController::class, 'getSchedule']);
        Route::post('/absences', [StudentPortalController::class, 'submitAbsence']);
    });

    // [AUDIT ROUTE-01] Dashboard routes (stats, search, timeline, pilotage) live in shared.php
    // Admin-exclusive APOGEE Academic Engine routes kept here:
    Route::prefix('dashboard')->group(function () {
        Route::post('/academic/grade-periods', [ApogeeEngineController::class, 'openGradePeriod']);
        Route::post('/academic/deliberation/run', [ApogeeEngineController::class, 'runDeliberation']);
        Route::get('/academic/reports/{type}', [AcademicReportController::class, 'generate']);
    });

    // [AUDIT ROUTE-01] /timetable/export duplicate removed (already in shared.php)
    // ---------------------------------------------------------
    // GENERATION DE DOCUMENTS PDF (DomPDF)
    // ---------------------------------------------------------
    Route::get('/admin/convocations/print-session', [PdfExportController::class, 'printSession']);
    Route::get('/admin/convocations/print-professors', [PdfExportController::class, 'printProfessors']);
    Route::get('/professor/exams/{exam}/pv/pdf', [PdfExportController::class, 'pvExamen']);
    Route::get('/admin/pv-globaux/pdf', [PdfExportController::class, 'pvGlobal']);
    Route::get('/admin/students/{id}/releve-notes/{year}', [PdfExportController::class, 'releveNotes']);
    Route::get('/admin/students/{id}/attestation-reussite/{year}', [PdfExportController::class, 'attestationReussite']);
    Route::get('/admin/exams/{exam}/attendance-sheet', [PdfExportController::class, 'attendanceSheet']);
    Route::get('/admin/reports/absences', [PdfExportController::class, 'rapportAbsences']);
    Route::get('/admin/schedules/export/group-pdf', [PdfExportController::class, 'exportScheduleGroupPdf']);
    Route::get('/admin/exams/{exam}/live-attendance/pdf', [PdfExportController::class, 'liveAttendancePdf']);
    Route::get('/admin/exams/{exam}/display-list/pdf', [PdfExportController::class, 'displayList']);

});

// [AUDIT ROUTE-01] Public verify routes are already in shared.php — removed duplicates here.

// ---------------------------------------------------------
// REST API (Protected endpoints for third-party integrations)
// ---------------------------------------------------------

Route::get('/test-doc', function () {
    try {
        $reqs = DocumentRequest::where('status', 'pending')->get();
        if ($reqs->isEmpty()) {
            return 'No pending requests found';
        }
        $out = [];
        foreach ($reqs as $req) {
            try {
                app(DocumentRequestService::class)->processRequest($req, 'ready');
                $out[] = "Success for {$req->id} ({$req->documentType->name})";
            } catch (Exception $e) {
                $out[] = "Error for {$req->id}: ".$e->getMessage().' in '.$e->getFile().' on line '.$e->getLine();
            }
        }

        return response()->json($out);
    } catch (Exception $e) {
        return 'Global Error: '.$e->getMessage().' in '.$e->getFile().' on line '.$e->getLine();
    }
});

Route::prefix('rest')->middleware('auth:sanctum')->group(function () {
    Route::get('/modules', [RestApiController::class, 'modules']);
    Route::get('/grades', [RestApiController::class, 'grades']);
    Route::get('/schedule', [RestApiController::class, 'schedule']);
    Route::get('/absences', [RestApiController::class, 'absences']);
    Route::get('/exams', [RestApiController::class, 'exams']);
    Route::get('/appointments', [RestApiController::class, 'appointments']);
    Route::get('/notifications', [RestApiController::class, 'notifications']);
    Route::post('/notifications/{id}/read', [RestApiController::class, 'readNotification']);
    Route::post('/notifications/read-all', [RestApiController::class, 'readAllNotifications']);
});

// ---------------------------------------------------------
// INTERNAL DYNAMIC ENDPOINTS (Admin Web Auth)
// ---------------------------------------------------------
Route::middleware(['auth:sanctum', 'role:super-admin|institution-admin|director|department-head'])->group(function () {
    Route::get('/admin/api/filieres/{id}/groups', [InternalApiController::class, 'filiereGroups']);
    Route::get('/admin/api/groups/{id}/modules', [InternalApiController::class, 'groupModules']);
    Route::get('/admin/api/rooms/{id}/availability', [InternalApiController::class, 'roomAvailability']);
    Route::get('/admin/exams/api/calendar', [InternalApiController::class, 'examCalendar']);
    Route::get('/admin/timetable/calendar-events', [InternalApiController::class, 'timetableEvents']);
    Route::get('/admin/exams/{exam}/live-attendance/stats', [InternalApiController::class, 'liveAttendanceStats']);
    Route::get('/classroom/chat/{group}/{module}/messages', [InternalApiController::class, 'chatMessages']);
    Route::post('/admin/schedules/makeup/suggest', [InternalApiController::class, 'suggestMakeup']);
    Route::post('/classroom/ai/tutor', [AiFeatureController::class, 'tutor']);

    // Admin Guichet & Analytics
    Route::get('/admin/analytics', [AdminAnalyticsController::class, 'index']);
    Route::get('/admin/document-requests', [AdminDocumentRequestController::class, 'index']);
    Route::patch('/admin/document-requests/{documentRequest}/status', [AdminDocumentRequestController::class, 'updateStatus']);
});
