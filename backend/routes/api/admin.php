<?php

use App\Exports\StudentsExport;
use App\Http\Controllers\Api\AbsenceJustificationController;
use App\Http\Controllers\Api\AcademicReportController;
use App\Http\Controllers\Api\AcademicYearController;
use App\Http\Controllers\Api\Admin\AdminAbsenceController;
use App\Http\Controllers\Api\Admin\AdminDocumentTypeController;
use App\Http\Controllers\Api\Admin\AdminExamConvocationController;
use App\Http\Controllers\Api\AdminAiController;
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
use App\Http\Controllers\Api\RetakeController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\ScheduleChangeRequestController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\SmartSchedulingController;
use App\Http\Controllers\Api\StudentCardController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\StudentPortalController;
use App\Http\Controllers\Api\StudentTranscriptController;
use App\Http\Controllers\Api\TimetableController;
use App\Http\Controllers\Api\TimetableExportController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VacataireController;
use App\Models\StudentPathway;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Maatwebsite\Excel\Facades\Excel;

Route::post('/contact', [ContactController::class, 'send'])->middleware('throttle:6,1');

Route::middleware(['auth:sanctum', 'role:admin|super-admin|institution-admin|director|department-head|finance-officer|hr-officer|library-manager|discipline-committee'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Removed db-test route from here

    Route::post('/profile', [ProfileController::class, 'update']);

    // Dashboard Stats & Ministry Audit Reports
    Route::get('/dashboard/stats', [AdminDashboardController::class, 'getStats']);
    Route::get('/finance/stats', [AdminDashboardController::class, 'getFinanceStats']);
    Route::get('/reports/ministry-audit', [AdminDashboardController::class, 'generateMinistryReport']);

    // Admin Custom Routes
    Route::get('/admin/analytics', [AdminAnalyticsController::class, 'index']);
    Route::get('/analytics', [AdminAnalyticsController::class, 'index']);
    Route::get('/smart-campus', [AdminSmartCampusController::class, 'getCampusData']);
    Route::get('/exams', [AdminExamController::class, 'index']);
    Route::get('/exams/analytics', [AdminExamController::class, 'analytics']);
    Route::get('/exams/timetable-pdf', [\App\Http\Controllers\Api\ExamPlanningController::class, 'downloadExamTimetablePdf']);
    Route::get('/admin/exams/{exam}/rooms/{room}/door-sign-pdf', [PdfExportController::class, 'downloadDoorSignPdf']);
    Route::get('/admin/exams/{exam}/door-sign-pdf', [PdfExportController::class, 'downloadDoorSignPdf']);
    Route::get('/exams/{exam}/rooms/{room}/door-sign-pdf', [PdfExportController::class, 'downloadDoorSignPdf']);
    Route::get('/exams/{exam}/door-sign-pdf', [PdfExportController::class, 'downloadDoorSignPdf']);
    Route::post('/exams/pv/sign', [ExamIncidentController::class, 'storePvSignature']);
    Route::get('/exams/{exam}/pv/pdf', [ExamIncidentController::class, 'downloadOfficialPvPdf']);
    Route::post('/notifications/broadcast-urgent', [NotificationController::class, 'broadcastUrgentAlert']);
    Route::post('/deliberations/simulate', [DeliberationController::class, 'simulate']);
    Route::post('/complaints/grade-appeal', [ComplaintController::class, 'submitGradeAppeal']);
    Route::get('/complaints/grade-appeals', [ComplaintController::class, 'listGradeAppeals']);
    Route::post('/complaints/grade-appeals/{id}/resolve', [ComplaintController::class, 'resolveGradeAppeal']);
    Route::post('/documents/generate', [DocumentCenterController::class, 'generate']);
    Route::get('/documents/download/{type}/{id}', [DocumentCenterController::class, 'downloadDocument']);
    Route::get('holidays/{holiday}/impact', [HolidayController::class, 'impact']);
    Route::apiResource('holidays', HolidayController::class);

    // AI Predictive Analytics
    Route::get('/predictive-analytics', [AdminPredictiveAnalyticsController::class, 'index']);
    Route::post('/predictive-analytics/refresh', [AdminPredictiveAnalyticsController::class, 'refresh']);
    Route::get('/admin/predictive-analytics', [AdminPredictiveAnalyticsController::class, 'index']);
    Route::post('/admin/predictive-analytics/refresh', [AdminPredictiveAnalyticsController::class, 'refresh']);

    // Academic Years Rollover & Archiving
    Route::get('/admin/archiving-stats', [AcademicYearController::class, 'getArchivingDashboard']);
    Route::get('/academic-years/archiving', [AcademicYearController::class, 'getArchivingDashboard']);
    Route::post('/academic-years/{id}/rollover', [AcademicYearController::class, 'rollover']);
    Route::post('/admin/academic-years/{id}/rollover', [AcademicYearController::class, 'rollover']);

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
    Route::get('/groups/{id}/students', [GroupController::class, 'getGroupStudents']);
    Route::post('/groups/{id}/assign-delegate', [GroupController::class, 'assignDelegate']);
    Route::post('/groups/dispatch-students', [GroupController::class, 'dispatchStudentsToGroups']);
    Route::apiResource('groups', GroupController::class);


    Route::get('semesters', function () {
        return response()->json(['data' => \App\Models\Semester::all()]);
    });
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
    Route::get('/soutenances', [App\Http\Controllers\Api\Admin\AdminInternshipController::class, 'getSoutenancesList']);

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
    Route::get('modules/export-bulk-pv-zip', [\App\Http\Controllers\Api\PdfExportController::class, 'exportBulkPvZip']);
    Route::get('modules/{module}/pv', [GradeController::class, 'getModulePv']);
    Route::get('semester-pv', [GradeController::class, 'getSemesterPv']);
    Route::get('modules/{module}/pv/export-pdf', [\App\Http\Controllers\Api\PdfExportController::class, 'exportModulePvPdf']);
    Route::get('modules/{module}/pv/export-rattrapage-pdf', [\App\Http\Controllers\Api\PdfExportController::class, 'exportRattrapage_PvPdf']); // #3
    Route::post('modules/{module}/pv/sign', [GradeController::class, 'signModulePv']);
    Route::post('modules/{module}/sign-pv', [GradeController::class, 'signModulePv']);
    Route::post('modules/{module}/generate-rattrapage-eligibilities', [GradeController::class, 'generateRattrapageEligibilities']); // Manual trigger
    Route::get('modules/{module}/export-grades', [GradeController::class, 'exportGradesTemplate']);
    Route::post('modules/{module}/import-grades', [GradeController::class, 'importGrades']);
    Route::get('modules/{module}/audit-logs', [GradeController::class, 'getModuleAuditLogs']);
    Route::get('assessments/{assessment}/grades', [GradeController::class, 'getForAssessment']);
    Route::post('assessments/{assessment}/grades', [GradeController::class, 'storeBulk']);
    Route::get('academic/deliberations', [DeliberationController::class, 'index']);

    Route::get('admin/academic/deliberations', [DeliberationController::class, 'index']);
    Route::match(['get', 'post'], 'academic/deliberate', [DeliberationController::class, 'run']);
    Route::match(['get', 'post'], 'admin/deliberations/run', [DeliberationController::class, 'run']);
    Route::match(['get', 'post'], 'deliberations/export-pv-pdf', [\App\Http\Controllers\Api\PdfExportController::class, 'exportSemesterPvPdf']);


    Route::post('deliberations/apply-rachat', [GradeController::class, 'applyRachat']);
    Route::get('academic/deliberations/jury-status', [DeliberationController::class, 'getJuryStatus']);


    Route::post('academic/deliberations/sign-jury', [DeliberationController::class, 'signJury']);
    Route::get('academic/deliberations/annual-compensation', [DeliberationController::class, 'getAnnualCompensation']);
    Route::get('academic/reports/{type}', [\App\Http\Controllers\Api\AcademicReportController::class, 'generate']);

    Route::get('admin/reservistes', [\App\Http\Controllers\Api\ReservisteController::class, 'index']);
    Route::post('admin/reservistes/{studentId}/derogation', [\App\Http\Controllers\Api\ReservisteController::class, 'updateDerogation']);
    Route::get('admin/reservistes/{studentId}/audit', [\App\Http\Controllers\Api\ReservisteController::class, 'getStudentAudit']);
    Route::post('admin/reservistes/{studentId}/notify-email', [\App\Http\Controllers\Api\ReservisteController::class, 'sendNotificationEmail']);

    // PRO MAX Deliberation & Grade Suite Endpoints
    Route::post('modules/{module}/bulk-send-transcripts', [GradeController::class, 'bulkSendModuleTranscripts']);
    Route::get('admin/grades/progress-summary', [GradeController::class, 'getProgressSummary']);
    Route::post('admin/grades/send-prof-reminder', [GradeController::class, 'sendProfReminder']);
    Route::get('modules/{module}/pv/export-zip-bundle', [GradeController::class, 'exportPvZipBundle']);
    Route::get('modules/{module}/ai-audit', [GradeController::class, 'auditGradeDistribution']);

    // Student Scanned Document Vault Routes
    Route::get('students/{student}/documents', [StudentController::class, 'getDocuments']);
    Route::post('students/{student}/documents', [StudentController::class, 'uploadDocument']);
    Route::get('admin/students/{student}/documents', [StudentController::class, 'getDocuments']);
    Route::post('admin/students/{student}/documents', [StudentController::class, 'uploadDocument']);

    // ── 📥 Importation Liste Officielle Admis Ministère TAFEM / MESRSFC
    Route::post('admissions/import-ministry-tafem-csv', [\App\Http\Controllers\Api\TafemMinistryImportController::class, 'importMinistryList']);
    Route::get('admissions/download-tafem-template-csv', [\App\Http\Controllers\Api\TafemMinistryImportController::class, 'downloadTemplate']);
    Route::get('admin/admissions/campaigns', [\App\Http\Controllers\Api\AdmissionCampaignController::class, 'index']);
    Route::get('admin/admissions/campaigns/{id}/applications', [\App\Http\Controllers\Api\AdmissionCampaignController::class, 'getApplications']);

    // Student Transcript PDF & Mission Orders & Convocations
    Route::get('students/export-attestations-zip', [PdfExportController::class, 'exportAttestationsZip']);
    Route::get('students/export-usmba-accounts-csv', [StudentController::class, 'exportUsmbaAcademicAccountsCsv']);
    Route::get('students/{student}/attestation-pdf', [PdfExportController::class, 'downloadAttestationInscriptionPdf']);
    Route::get('students/{student}/recepisse-depot-pdf', [PdfExportController::class, 'downloadRecepisseDepotPdf']);
    Route::get('students/{student}/etiquette-enveloppe-pdf', [PdfExportController::class, 'downloadEtiquetteEnveloppePdf']);
    // ── Carte Étudiant CR80 ISO ID-1 — Evolis Primacy 2 (Recommendation #1)
    Route::get('students/{student}/carte-etudiant-cr80-pdf', [PdfExportController::class, 'downloadCarteEtudiantCR80Pdf']);
    // ── 📜 Engagement (تعهد) + 🏥 Fiche Médicale — Documents Dossier Physique
    Route::get('students/engagement-pdf', [PdfExportController::class, 'engagementPdf']);
    Route::get('students/fiche-medicale-pdf', [PdfExportController::class, 'ficheMedicalePdf']);
    // ── Inscription Workflow & AI Gemini Vision Audit (Recommendations #1, #2, #4, #5, #7)
    Route::post('students/{student}/ai-audit', [StudentController::class, 'auditWithGeminiAi']);
    Route::post('students/{student}/biometric-match', [StudentController::class, 'runBiometricMatch']);
    Route::patch('students/{student}/inscription-status', [StudentController::class, 'updateInscriptionStatus']);
    Route::get('students/{student}/dossier-audit-log', [StudentController::class, 'getDossierAuditLog']);
    Route::get('students/{student}/transcript', [StudentTranscriptController::class, 'generateForAdmin']);

    Route::get('students/{student}/convocation-pdf', [\App\Http\Controllers\Api\ConvocationController::class, 'downloadStudentConvocationPdf']);
    Route::get('professors/{professor}/convocation-pdf', [\App\Http\Controllers\Api\ConvocationController::class, 'downloadProfessorConvocationPdf']);
    Route::post('convocations/send-students', [\App\Http\Controllers\Api\ConvocationController::class, 'sendStudentConvocationsIntelligent']);
    Route::post('convocations/send-professors', [\App\Http\Controllers\Api\ConvocationController::class, 'sendProfessorConvocationsIntelligent']);
    Route::get('convocations/export-zip', [\App\Http\Controllers\Api\ConvocationController::class, 'exportConvocationsZip']);
    Route::post('exam-sessions/{sessionId}/send-availability-survey', [\App\Http\Controllers\Api\ConvocationController::class, 'sendAvailabilitySurvey']);
    // [AUDIT ROUTE-02] Removed duplicate auto-assign-proctors route: already handled under /exam-planning/{sessionId}/auto-assign-proctors
    Route::post('students/{student}/send-transcript', [GradeController::class, 'sendTranscriptEmail']);
    Route::post('mission-orders', [\App\Http\Controllers\Api\ConvocationController::class, 'generateMissionOrder']);
    Route::post('schedules/ai-simulation', [ScheduleController::class, 'generateAiSimulation']);
    Route::get('mobility/ranking', [\App\Http\Controllers\Api\Student\StudentMobilityController::class, 'calculateMeritRanking']);

    // Admin AI Suite
    Route::prefix('ai')->group(function () {
        Route::post('copilot/query', [AdminAiController::class, 'copilotQuery']);
        Route::get('predictive-analytics', [AdminAiController::class, 'getPredictiveAnalytics']);
        Route::get('financial-forecast', [AdminAiController::class, 'getFinancialForecast']);
    });

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
        Route::get('/campaigns', [AdmissionCampaignController::class, 'index']);
        Route::get('/tafem-stats', [AdmissionCampaignController::class, 'tafemStats']);
        Route::get('/applications', [AdmissionController::class, 'index']);
        Route::get('/campaigns/{campaign}/applications', [AdmissionController::class, 'index']);
        Route::post('/applications', [AdmissionController::class, 'store']);
        Route::post('/campaigns/{campaign}/calculate-seuil', [AdmissionCampaignController::class, 'calculateSeuil']);
        Route::post('/campaigns/{campaign}/auto-repartition', [AdmissionCampaignController::class, 'autoRepartition']);
        Route::get('/campaigns/{campaign}/export-pdf/{type}', [AdmissionCampaignController::class, 'exportPdf']);
        Route::patch('/applications/{application}/status', [AdmissionController::class, 'updateStatus']);
        Route::put('/applications/{application}', [AdmissionController::class, 'update']);
        Route::delete('/applications/{application}', [AdmissionController::class, 'destroy']);
    });

    Route::prefix('admin/admissions')->group(function () {
        Route::get('/campaigns', [AdmissionCampaignController::class, 'index']);
        Route::get('/applications', [AdmissionController::class, 'index']);
        Route::get('/campaigns/{campaign}/applications', [AdmissionController::class, 'index']);
        Route::post('/applications', [AdmissionController::class, 'store']);
        Route::patch('/applications/{application}/status', [AdmissionController::class, 'updateStatus']);
        Route::put('/applications/{application}', [AdmissionController::class, 'update']);
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

    // Smart Scheduling & Substitutions
    Route::get('/schedule-change-requests/substitutes', [ScheduleChangeRequestController::class, 'suggestSubstitutes']);
    Route::post('/schedules/auto-generate', [SmartSchedulingController::class, 'autoGenerate']);
    Route::apiResource('schedules', \App\Http\Controllers\Api\ScheduleController::class)->except(['update', 'show']);

    // Exam Planning & Convocations
    Route::prefix('exam-planning')->group(function () {
        Route::get('/', [ExamPlanningController::class, 'index']);
        Route::delete('/reset', [ExamPlanningController::class, 'resetExams']);
        Route::post('/auto-generate', [ExamPlanningController::class, 'autoGenerateBatch']);
        Route::post('/auto-generate-batch', [ExamPlanningController::class, 'autoGenerateBatch']);
        Route::post('/custom-generate', [ExamPlanningController::class, 'autoGenerateBatch']);
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
        Route::get('/{examId}/live-stats', [ConvocationController::class, 'liveStats']);
        Route::get('/{examId}/details', [ConvocationController::class, 'getDetails']);
        Route::post('/{examId}/update-seating-status', [ConvocationController::class, 'updateSeatingStatus']);
        Route::post('/{examId}/batch-update-attendance', [ConvocationController::class, 'batchUpdateAttendance']);

        // [AUDIT ROUTE-01] Fixed: duplicate notify-absents route removed (was registered twice)
        Route::post('/{examId}/notify-absents', [ConvocationController::class, 'notifyAbsents']);
        Route::post('/{examId}/generate-convocations', [ConvocationController::class, 'generate']);
        Route::post('/{examId}/send-emails', [ConvocationController::class, 'sendEmails']);

        // Student endpoints
        Route::get('/student/{studentId}', [ConvocationController::class, 'getStudentConvocations']);
        Route::get('/student/{id}/download', [PdfExportController::class, 'studentConvocationPdf']);
        Route::get('/student/{id}/preview', [PdfExportController::class, 'studentConvocationPreview']);
        
        // Surveillant endpoints
        Route::get('/surveillant/{id}/download', [PdfExportController::class, 'surveillantConvocationPdf']);
        Route::get('/surveillant/{id}/preview', [PdfExportController::class, 'surveillantConvocationPreview']);
        
        // Batch actions
        Route::post('/session/{sessionId}/batch-pdf', [PdfExportController::class, 'batchPdf']);
        Route::post('/session/{sessionId}/send-batch-emails', [ConvocationController::class, 'sendBatchEmails']);
        Route::post('/session/{sessionId}/surveillants-batch-pdf', [PdfExportController::class, 'batchDownloadSurveillantsPdf']);
        Route::post('/session/{sessionId}/send-batch-surveillants-emails', [ConvocationController::class, 'sendBatchSurveillantsEmails']);
        Route::post('/session/{sessionId}/send-batch-surveillants-whatsapp', [ConvocationController::class, 'sendBatchSurveillantsWhatsApp']);
    });

    // Convocations Lifecycle
    Route::prefix('convocations')->group(function () {
        Route::post('/generate-session', [ConvocationController::class, 'generateSession']);
        Route::post('/send-session', [ConvocationController::class, 'sendSession']);
        Route::get('/session/{sessionId}/stats', [ConvocationController::class, 'sessionStats']);
        Route::get('/session/{sessionId}/live-stats', [ConvocationController::class, 'globalLiveStats']);
        Route::get('/session/{sessionId}/list', [ConvocationController::class, 'sessionList']);
        
        Route::get('/{reference}/verify', [ConvocationController::class, 'verify']);
        Route::post('/{reference}/present', [ConvocationController::class, 'markPresent']);
        Route::get('/scan-verify/{qrToken}', [ConvocationController::class, 'scanVerify']);
        Route::post('/update-attendance/{qrToken}', [ConvocationController::class, 'updateAttendanceStatus']);
    });

    // Exam Incidents & Discipline
    Route::prefix('exam-incidents')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ExamIncidentController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\ExamIncidentController::class, 'store']);
        Route::get('/{id}/download-pdf', [\App\Http\Controllers\Api\ExamIncidentController::class, 'downloadPdf']);
    });

    // Discipline Council Routes
    Route::get('/discipline', [\App\Http\Controllers\Api\ExamIncidentController::class, 'index']);
    Route::post('/discipline/{id}/convoke', [\App\Http\Controllers\Api\ExamIncidentController::class, 'convoke']);
    Route::post('/discipline/{id}/decide', [\App\Http\Controllers\Api\ExamIncidentController::class, 'decide']);

    // Exam Analytics & Cartography Route
    Route::get('/exam-analytics', [\App\Http\Controllers\Api\ExamIncidentController::class, 'examAnalytics']);
    Route::get('/analytics', [\App\Http\Controllers\Api\ExamIncidentController::class, 'globalAnalytics']);
    Route::post('/exams/{id}/pv/lock', [\App\Http\Controllers\Api\ExamIncidentController::class, 'lockPv']);




    // Retakes
    Route::prefix('retakes')->group(function () {
        Route::get('/', [RetakeController::class, 'index']);
        Route::patch('/{id}/status', [RetakeController::class, 'updateStatus']);
        Route::post('/bulk-status', [RetakeController::class, 'bulkUpdateStatus']);          // #4 Bulk
        Route::post('/{id}/upload-justification', [RetakeController::class, 'uploadJustification']); // #6 Upload
    });

    // Professor Availability
    Route::prefix('professor-availability')->group(function () {
        Route::get('/', [ProfessorAvailabilityController::class, 'index']);
        Route::post('/alert', [ProfessorAvailabilityController::class, 'alert']);
    });

    // Blockchain Certification
    Route::prefix('admin/blockchain')->group(function () {
        Route::get('/certificates', [\App\Http\Controllers\Api\Admin\AdminBlockchainController::class, 'getLedger']);
        Route::post('/certify-promo', [\App\Http\Controllers\Api\Admin\AdminBlockchainController::class, 'certifyPromo']);
        Route::post('/verify', [\App\Http\Controllers\Api\Admin\AdminBlockchainController::class, 'verify']);
    });
    Route::prefix('blockchain')->group(function () {
        Route::get('/certificates', [\App\Http\Controllers\Api\Admin\AdminBlockchainController::class, 'getLedger']);
        Route::post('/certify-promo', [\App\Http\Controllers\Api\Admin\AdminBlockchainController::class, 'certifyPromo']);
        Route::post('/verify', [\App\Http\Controllers\Api\Admin\AdminBlockchainController::class, 'verify']);
    });

    // Course Evaluations Quality Management
    Route::prefix('course-evaluations')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Api\Admin\AdminCourseEvaluationController::class, 'getStats']);
        Route::post('/toggle-campaign', [\App\Http\Controllers\Api\Admin\AdminCourseEvaluationController::class, 'toggleCampaign']);
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
        Route::patch('/{documentRequest}/status', [App\Http\Controllers\Api\Admin\AdminDocumentRequestController::class, 'updateStatus']);
        Route::post('/{documentRequest}/generate', [App\Http\Controllers\Api\Admin\AdminDocumentRequestController::class, 'generate']);
        Route::get('/{documentRequest}/download', [App\Http\Controllers\Api\Admin\AdminDocumentRequestController::class, 'download']);
    });

    // Admin — Document Types Management
    Route::apiResource('admin/document-types', AdminDocumentTypeController::class)->middleware('require-admin-2fa');

    // Admissions / TAFEM
    Route::prefix('admissions')->group(function () {
        Route::post('/campaigns/{campaignId}/calculate-seuil', [AdmissionCampaignController::class, 'calculateSeuil']);
    });

    // [AUDIT ROUTE-01] Chatbot, alumni, REST, and dashboard routes moved to shared.php
    // [AUDIT ROUTE-02] Dead vacataire-manager group (all-commented) removed
    // [AUDIT ROUTE-03] Removed duplicate student-portal routes: grades/schedule/absences already handled under v1/student-portal in student.php

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
    Route::post('/professor-assignments/notify', [PdfExportController::class, 'notifyProfessorAssignment']);

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
    Route::post('/admin/document-requests/{documentRequest}/generate', [AdminDocumentRequestController::class, 'generate']);
    Route::get('/admin/document-requests/{documentRequest}/download', [AdminDocumentRequestController::class, 'download']);
    Route::get('/admin/document-requests/{documentRequest}/preview', [AdminDocumentRequestController::class, 'preview']);
    Route::post('/admin/document-requests/{documentRequest}/send-email-notification', [AdminDocumentRequestController::class, 'sendEmailNotification']);
});

// ---------------------------------------------------------
// PUBLIC PDF STREAMING ENDPOINTS (Accessible natively via window.open)
// ---------------------------------------------------------
Route::get('/professor-assignments/ordre-de-service-pdf', [PdfExportController::class, 'exportProfessorOrdreDeServicePdf']);
Route::get('/admin/professor-assignments/ordre-de-service-pdf', [PdfExportController::class, 'exportProfessorOrdreDeServicePdf']);
Route::get('/v1/professor-assignments/ordre-de-service-pdf', [PdfExportController::class, 'exportProfessorOrdreDeServicePdf']);
Route::get('/v1/admin/professor-assignments/ordre-de-service-pdf', [PdfExportController::class, 'exportProfessorOrdreDeServicePdf']);

Route::get('/departments/arrete-nomination-pdf', [PdfExportController::class, 'exportArreteNominationPdf']);
Route::get('/admin/departments/arrete-nomination-pdf', [PdfExportController::class, 'exportArreteNominationPdf']);
Route::get('/v1/departments/arrete-nomination-pdf', [PdfExportController::class, 'exportArreteNominationPdf']);
Route::get('/v1/admin/departments/arrete-nomination-pdf', [PdfExportController::class, 'exportArreteNominationPdf']);

Route::get('/filieres/maquette-pdf', [PdfExportController::class, 'exportMaquetteFilierePdf']);
Route::get('/admin/filieres/maquette-pdf', [PdfExportController::class, 'exportMaquetteFilierePdf']);
Route::get('/v1/filieres/maquette-pdf', [PdfExportController::class, 'exportMaquetteFilierePdf']);
Route::get('/v1/admin/filieres/maquette-pdf', [PdfExportController::class, 'exportMaquetteFilierePdf']);
Route::get('/filieres/maquette pdf', [PdfExportController::class, 'exportMaquetteFilierePdf']);
Route::get('/v1/filieres/maquette pdf', [PdfExportController::class, 'exportMaquetteFilierePdf']);
Route::get('/admin/filieres/maquette pdf', [PdfExportController::class, 'exportMaquetteFilierePdf']);
Route::get('/v1/admin/filieres/maquette pdf', [PdfExportController::class, 'exportMaquetteFilierePdf']);
Route::get('/filieres/maquette_pdf', [PdfExportController::class, 'exportMaquetteFilierePdf']);
Route::get('/v1/filieres/maquette_pdf', [PdfExportController::class, 'exportMaquetteFilierePdf']);
Route::get('/admin/filieres/maquette_pdf', [PdfExportController::class, 'exportMaquetteFilierePdf']);
Route::get('/v1/admin/filieres/maquette_pdf', [PdfExportController::class, 'exportMaquetteFilierePdf']);

Route::get('/modules/syllabique-pdf', [PdfExportController::class, 'exportSyllabiqueModulePdf']);
Route::get('/admin/modules/syllabique-pdf', [PdfExportController::class, 'exportSyllabiqueModulePdf']);
Route::get('/v1/modules/syllabique-pdf', [PdfExportController::class, 'exportSyllabiqueModulePdf']);
Route::get('/v1/admin/modules/syllabique-pdf', [PdfExportController::class, 'exportSyllabiqueModulePdf']);

Route::get('/modules/pv-accreditation-pdf', [PdfExportController::class, 'exportPvAccreditationModulePdf']);
Route::get('/admin/modules/pv-accreditation-pdf', [PdfExportController::class, 'exportPvAccreditationModulePdf']);
Route::get('/v1/modules/pv-accreditation-pdf', [PdfExportController::class, 'exportPvAccreditationModulePdf']);
Route::get('/v1/admin/modules/pv-accreditation-pdf', [PdfExportController::class, 'exportPvAccreditationModulePdf']);

Route::get('/groups/emargement-pdf', [PdfExportController::class, 'exportEmargementGroupePdf']);
Route::get('/admin/groups/emargement-pdf', [PdfExportController::class, 'exportEmargementGroupePdf']);
Route::get('/v1/groups/emargement-pdf', [PdfExportController::class, 'exportEmargementGroupePdf']);
Route::get('/v1/admin/groups/emargement-pdf', [PdfExportController::class, 'exportEmargementGroupePdf']);

Route::get('/enrollments/attestation-pdf', [PdfExportController::class, 'exportAttestationInscriptionPdf']);
Route::get('/admin/enrollments/attestation-pdf', [PdfExportController::class, 'exportAttestationInscriptionPdf']);
Route::get('/v1/enrollments/attestation-pdf', [PdfExportController::class, 'exportAttestationInscriptionPdf']);
Route::get('/v1/admin/enrollments/attestation-pdf', [PdfExportController::class, 'exportAttestationInscriptionPdf']);

Route::get('/tafem/etiquettes-pdf', [PdfExportController::class, 'exportEtiquettesTableTafemPdf']);
Route::get('/admin/tafem/etiquettes-pdf', [PdfExportController::class, 'exportEtiquettesTableTafemPdf']);
Route::get('/v1/tafem/etiquettes-pdf', [PdfExportController::class, 'exportEtiquettesTableTafemPdf']);
Route::get('/v1/admin/tafem/etiquettes-pdf', [PdfExportController::class, 'exportEtiquettesTableTafemPdf']);


// ──────────────────────────────────────────────────────────────────────────────
// AI Chatbot (Gemini) — Student & Admin Assistant
// ──────────────────────────────────────────────────────────────────────────────
Route::post('/ai/chat', [\App\Http\Controllers\Api\Admin\StudentChatbotController::class, 'chat']);
Route::post('/admin/ai/chat', [\App\Http\Controllers\Api\Admin\StudentChatbotController::class, 'chat']);

// ──────────────────────────────────────────────────────────────────────────────
// Alertes Centralisées
// ──────────────────────────────────────────────────────────────────────────────
Route::get('/admin/alerts', [\App\Http\Controllers\Api\Admin\AdminAlertsController::class, 'getAlerts']);

// ──────────────────────────────────────────────────────────────────────────────
// Rapport Ministère MESRSFC
// ──────────────────────────────────────────────────────────────────────────────
Route::get('/admin/ministry-report', [\App\Http\Controllers\Api\Admin\AdminMinistryReportController::class, 'getReport']);

// ──────────────────────────────────────────────────────────────────────────────
// Calendrier Académique
// ──────────────────────────────────────────────────────────────────────────────
Route::get('/admin/academic-calendar/events', function () {
    try {
        $events = [];

        // Exams
        if (\Illuminate\Support\Facades\Schema::hasTable('exams')) {
            $exams = \Illuminate\Support\Facades\DB::table('exams')
                ->join('modules', 'exams.module_id', '=', 'modules.id')
                ->select('exams.id', 'modules.name as title', 'exams.date as start', 'exams.start_time', 'exams.end_time')
                ->get();
            foreach ($exams as $e) {
                $events[] = [
                    'id' => 'exam-' . $e->id,
                    'title' => '📝 ' . $e->title,
                    'start' => $e->start,
                    'type' => 'exam',
                    'color' => '#ef4444',
                ];
            }
        }

        // Holidays
        if (\Illuminate\Support\Facades\Schema::hasTable('academic_holidays')) {
            $holidays = \Illuminate\Support\Facades\DB::table('academic_holidays')
                ->select('id', 'name as title', 'start_date as start', 'end_date as end')
                ->get();
            foreach ($holidays as $h) {
                $events[] = [
                    'id' => 'holiday-' . $h->id,
                    'title' => '🏖️ ' . $h->title,
                    'start' => $h->start,
                    'end' => $h->end,
                    'type' => 'holiday',
                    'color' => '#10b981',
                ];
            }
        }

        // PFE Soutenances
        if (\Illuminate\Support\Facades\Schema::hasTable('final_projects')) {
            $soutenances = \Illuminate\Support\Facades\DB::table('final_projects')
                ->whereNotNull('soutenance_date')
                ->select('id', 'title', 'soutenance_date as start')
                ->get();
            foreach ($soutenances as $s) {
                $events[] = [
                    'id' => 'pfe-' . $s->id,
                    'title' => '🎓 Soutenance PFE — ' . $s->title,
                    'start' => $s->start,
                    'type' => 'soutenance',
                    'color' => '#8b5cf6',
                ];
            }
        }

        return response()->json(['success' => true, 'events' => $events]);
    } catch (\Exception $e) {
        return response()->json(['success' => true, 'events' => [], 'error' => $e->getMessage()]);
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// PFE Workflow
// ──────────────────────────────────────────────────────────────────────────────
Route::get('/admin/pfe/workflow', function () {
    try {
        $table = \Illuminate\Support\Facades\Schema::hasTable('final_projects') ? 'final_projects' : null;
        if (!$table) return response()->json(['success' => true, 'stages' => [], 'stats' => []]);

        $allPfe = \Illuminate\Support\Facades\DB::table($table)
            ->leftJoin('students', $table . '.student_id', '=', 'students.id')
            ->leftJoin('users as su', 'students.user_id', '=', 'su.id')
            ->leftJoin('users as prof', $table . '.supervisor_id', '=', 'prof.id')
            ->select(
                $table . '.id',
                $table . '.title',
                $table . '.status',
                $table . '.created_at',
                $table . '.soutenance_date',
                'su.name as student_name',
                'prof.name as supervisor_name'
            )
            ->orderBy($table . '.created_at', 'desc')
            ->get();

        $stages = [
            'soumis' => $allPfe->whereIn('status', ['submitted', 'pending', 'soumis'])->values(),
            'en_revue' => $allPfe->whereIn('status', ['under_review', 'en_revue', 'reviewing'])->values(),
            'valide' => $allPfe->whereIn('status', ['validated', 'approved', 'valide'])->values(),
            'encadreur_affecte' => $allPfe->where('supervisor_name', '!=', null)->whereIn('status', ['assigned', 'in_progress', 'encadre'])->values(),
            'soutenance' => $allPfe->whereNotNull('soutenance_date')->whereIn('status', ['completed', 'soutenu'])->values(),
        ];

        return response()->json([
            'success' => true,
            'stages' => $stages,
            'stats' => [
                'total' => $allPfe->count(),
                'soumis' => $stages['soumis']->count(),
                'en_revue' => $stages['en_revue']->count(),
                'valides' => $stages['valide']->count(),
                'en_cours' => $stages['encadreur_affecte']->count(),
                'soutenus' => $stages['soutenance']->count(),
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage(), 'stages' => [], 'stats' => []]);
    }
});

Route::patch('/admin/pfe/{id}/status', function (\Illuminate\Http\Request $request, $id) {
    try {
        $table = \Illuminate\Support\Facades\Schema::hasTable('final_projects') ? 'final_projects' : 'internships';
        \Illuminate\Support\Facades\DB::table($table)->where('id', $id)->update([
            'status' => $request->input('status'),
            'supervisor_id' => $request->input('supervisor_id'),
            'updated_at' => now(),
        ]);
        return response()->json(['success' => true, 'message' => 'Statut PFE mis à jour.']);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});

// Student Progress Report (full DB pull for one student)
Route::get('/admin/students/{id}/progress-report', function ($id) {
    try {
        $student = \Illuminate\Support\Facades\DB::table('students')
            ->join('users', 'students.user_id', '=', 'users.id')
            ->leftJoin('student_pathways', function($join) {
                $join->on('students.id', '=', 'student_pathways.student_id')
                     ->where('student_pathways.is_current', '=', true);
            })
            ->leftJoin('filieres', 'student_pathways.filiere_id', '=', 'filieres.id')
            ->where('students.id', $id)
            ->select(
                'students.id', 'students.cne', 'students.student_number as apogee_code',
                'users.name', 'users.email',
                'filieres.name as filiere'
            )->first();

        if (!$student) return response()->json(['success' => false, 'message' => 'Étudiant introuvable'], 404);

        $grades = \Illuminate\Support\Facades\DB::table('grades')
            ->join('assessments', 'grades.assessment_id', '=', 'assessments.id')
            ->join('modules', 'assessments.module_id', '=', 'modules.id')
            ->where('grades.student_id', $id)
            ->select('modules.name as module', 'modules.code', 'grades.grade', 'assessments.type')
            ->get();

        $absences = \Illuminate\Support\Facades\DB::table('absences')
            ->where('student_id', $id)
            ->select('date', 'is_justified', 'reason')
            ->orderBy('date', 'desc')
            ->get();

        $internships = \Illuminate\Support\Facades\DB::table('internships')
            ->where('student_id', $id)
            ->select('company_name', 'status', 'start_date', 'end_date', 'type')
            ->get();

        $clubMemberships = \Illuminate\Support\Facades\Schema::hasTable('club_members')
            ? \Illuminate\Support\Facades\DB::table('club_members')
                ->join('clubs', 'club_members.club_id', '=', 'clubs.id')
                ->where('club_members.student_id', $id)
                ->select('clubs.name as club')
                ->get()
            : collect([]);

        $avgGrade = $grades->avg('grade');
        $totalAbsences = $absences->count();
        $justifiedAbsences = $absences->where('is_justified', true)->count();

        return response()->json([
            'success' => true,
            'student' => $student,
            'summary' => [
                'average_grade' => round($avgGrade ?? 0, 2),
                'total_absences' => $totalAbsences,
                'justified_absences' => $justifiedAbsences,
                'total_modules' => $grades->count(),
                'passed_modules' => $grades->where('grade', '>=', 10)->count(),
            ],
            'grades' => $grades,
            'absences' => $absences,
            'internships' => $internships,
            'clubs' => $clubMemberships,
        ]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// Correction Automatique de Compte-Rendus (Professeurs) & Analyse de Cours (Étudiants)
// ──────────────────────────────────────────────────────────────────────────────
Route::post('/professor/ai/grade-report', [\App\Http\Controllers\Api\ProfessorAiController::class, 'gradeReport']);
Route::post('/student/ai/analyze-course', [\App\Http\Controllers\Api\Student\StudentAiController::class, 'analyzeCourse']);

// ──────────────────────────────────────────────────────────────────────────────
// Nouvelles Fonctionnalités IA Avancées (PFE Matching, Anomalies, Recommandations)
// ──────────────────────────────────────────────────────────────────────────────
Route::post('/admin/ai/match-pfe-supervisor', [\App\Http\Controllers\Api\AdminAiController::class, 'matchPfeSupervisor']);
Route::get('/admin/ai/grade-anomalies', [\App\Http\Controllers\Api\AdminAiController::class, 'detectGradeAnomalies']);
Route::post('/admin/students/{id}/recommendation-letter', [\App\Http\Controllers\Api\AdminAiController::class, 'generateRecommendationLetter']);

// ──────────────────────────────────────────────────────────────────────────────
// Lettres de Recommandation (Workflow Étudiant -> Professeur -> Signature & Email)
// ──────────────────────────────────────────────────────────────────────────────
Route::post('/student/recommendations/request', [\App\Http\Controllers\Api\RecommendationLetterController::class, 'submitRequest']);
Route::get('/student/recommendations', [\App\Http\Controllers\Api\RecommendationLetterController::class, 'getStudentRequests']);
Route::get('/professor/recommendations', [\App\Http\Controllers\Api\RecommendationLetterController::class, 'getProfessorRequests']);
Route::post('/professor/recommendations/{id}/approve', [\App\Http\Controllers\Api\RecommendationLetterController::class, 'approveRequest']);

// ──────────────────────────────────────────────────────────────────────────────
// APOGEE Inscriptions Engine & Moteur Paie Vacataires RH/DAF
// ──────────────────────────────────────────────────────────────────────────────
Route::post('/academic/candidates/validate', [\App\Http\Controllers\Api\ApogeeEngineController::class, 'validateCandidate']);
Route::get('/hr/vacataires/payroll', [\App\Http\Controllers\Api\ApogeeEngineController::class, 'calculateVacationPayroll']);

// ──────────────────────────────────────────────────────────────────────────────
// Inscriptions TAFEM Ministère & Vérification des Dossiers Physiques à l'ENCG Fès
// ──────────────────────────────────────────────────────────────────────────────
Route::get('/admin/tafem/ministry-list', [\App\Http\Controllers\Api\AdmissionController::class, 'getMinistryTafemList']);
Route::post('/admin/tafem/verify-physical-dossier', [\App\Http\Controllers\Api\AdmissionController::class, 'verifyPhysicalDossier']);

Route::get('/admin/tafem/scan-envelope/{token}', [\App\Http\Controllers\Api\AdmissionController::class, 'scanEnvelopeQrCode']);
Route::get('/admin/tafem/enrollment-stats', [\App\Http\Controllers\Api\AdmissionController::class, 'getEnrollmentStats']);
Route::get('/admin/tafem/security-daily-list', [\App\Http\Controllers\Api\AdmissionController::class, 'getSecurityDailyList']);
Route::post('/admin/tafem/promote-waiting-list', [\App\Http\Controllers\Api\AdmissionController::class, 'promoteWaitingListCandidates']);

Route::get('/admin/activity-logs', [\App\Http\Controllers\Api\AdminDashboardController::class, 'getActivityLogs']);
Route::get('/activity-logs', [\App\Http\Controllers\Api\AdminDashboardController::class, 'getActivityLogs']);
Route::post('/students/{student}/biometric-match', [\App\Http\Controllers\Api\StudentController::class, 'runBiometricMatch']);

// ──────────────────────────────────────────────────────────────────────────────
// Public Unauthenticated Endpoints (No Auth Required)
// ──────────────────────────────────────────────────────────────────────────────
Route::post('/public/preinscription', [\App\Http\Controllers\Api\AdmissionController::class, 'submitOnlinePreinscription']);
Route::get('/public/track-dossier', [\App\Http\Controllers\Api\AdmissionController::class, 'trackCandidateDossier']);
Route::post('/public/update-candidate-dossier', [\App\Http\Controllers\Api\AdmissionController::class, 'updateCandidateDossier']);
Route::post('/public/upload-candidate-document', [\App\Http\Controllers\Api\AdmissionController::class, 'uploadCandidateDocument']);
Route::post('/public/ocr-extract-documents', [\App\Http\Controllers\Api\AdmissionController::class, 'extractDocumentDataOcr']);
Route::get('/public/recepisse-tafem-pdf', [\App\Http\Controllers\Api\PdfExportController::class, 'exportRecepisseTafemPdf']);

Route::post('/public/send-convocation-email', [\App\Http\Controllers\Api\AdmissionController::class, 'sendCandidateConvocationEmail']);
Route::get('/public/inscription/status', [\App\Http\Controllers\Api\StudentController::class, 'getInscriptionStatusPublic']);
Route::post('/public/validate-photo-quality', [\App\Http\Controllers\Api\StudentController::class, 'validatePhotoQuality']);
Route::post('/public/scolarbot/chat', [\App\Http\Controllers\Api\AiScolarBotController::class, 'chat']);


