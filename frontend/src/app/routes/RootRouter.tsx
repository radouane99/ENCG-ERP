import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@stores/authStore'
import AppShell from '@shared/components/layout/AppShell'
import AuthLayout from '@shared/components/layout/AuthLayout'
import LoadingScreen from '@shared/components/ui/LoadingScreen'
import {
  ADMIN_ROLES,
  ACADEMIC_ROLES,
  TEACHING_ROLES,
  HR_ROLES,
  STAFF_ROLES,
  userCanAccessRoles,
} from '@shared/lib/routeAccess'
// ── Lazy-loaded feature routes ─────────────────────────────────
const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'))
const TwoFactorPage = lazy(() => import('@features/auth/pages/TwoFactorPage'))
const ForgotPasswordPage = lazy(() => import('@features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@features/auth/pages/ResetPasswordPage'))
const SsoCallbackPage = lazy(() => import('@features/auth/pages/SsoCallbackPage'))
const VerifyDocument = lazy(() => import('@features/documents/pages/VerifyDocument'))
const VerifyPv = lazy(() => import('@features/documents/pages/VerifyPv'))
const LandingPage = lazy(() => import('@features/public/pages/LandingPage'))
const InscriptionPage = lazy(() => import('@features/public/pages/InscriptionPage'))
const ModifierDossierPage = lazy(() => import('@features/public/pages/ModifierDossierPage'))
const InfrastructurePage = lazy(() => import('@features/public/pages/LandingPage')) // Fallback for now if it doesn't exist

const StudentRouter = lazy(() => import('./StudentRouter'))
const ProfessorRouter = lazy(() => import('./ProfessorRouter'))

// Outils
const CalendarPage = lazy(() => import('@features/tools/pages/CalendarPage'))
const ChatPage = lazy(() => import('@features/tools/pages/ChatPage'))
const FAQPage = lazy(() => import('@features/tools/pages/FAQPage'))

const DashboardRouter = lazy(() => import('@features/dashboard/pages/DashboardRouter'))

const StudentsListPage = lazy(() => import('@features/students/pages/StudentsPage'))
const StudentDetailPage = lazy(() => import('@features/students/pages/StudentDetailPage'))
const DigitalCardPage = lazy(() => import('@features/students/pages/DigitalCardPage'))
const AdminStudentCardsPage = lazy(() => import('@features/students/pages/AdminStudentCardsPage'))
const StudentCreatePage = lazy(() => import('@features/students/pages/StudentCreatePage'))

// HR
const VacatairesManager = lazy(() => import('@features/hr/pages/VacatairesManager'))
const ProfessorsListPage = lazy(() => import('@features/professors/pages/ProfessorsListPage'))
const AdminWorkflowBuilder = lazy(() => import('@features/admin/pages/AdminWorkflowBuilder'))
const VacatairesListPage = lazy(() => import('@features/vacataire/components/VacataireList'))
const VacataireContractPage = lazy(() => import('@features/vacataire/pages/VacataireContractPage'))

const CandidaturesPage = lazy(() => import('@features/admissions/components/CandidatureList'))
const ApplicationsPage = lazy(() => import('@features/admissions/pages/ApplicationsPage'))

const AcademicYearsPage = lazy(() => import('@features/academic/pages/AcademicYearsPage'))
const AcademicArchitecturePage = lazy(() => import('@features/academic/pages/AcademicArchitecturePage'))
const ModulesListPage = lazy(() => import('@features/modules/pages/ModulesListPage'))
const DeliberationManager = lazy(() => import('@features/academic/pages/DeliberationManager'))

// Attendance
const ProfessorAttendanceView = lazy(() => import('@features/attendance/pages/ProfessorAttendanceView'))
const QRScannerPage = lazy(() => import('@features/attendance/pages/QRScannerPage'))

const TimetablePage = lazy(() => import('@features/timetable/pages/ModernTimetable'))
const AdminRoomAvailabilityPage = lazy(() => import('@features/admin/pages/AdminRoomAvailabilityPage'))
const AttendancePage = lazy(() => import('@features/attendance/pages/AttendancePage'))

const ExamSessionsPage = lazy(() => import('@features/exams/pages/ExamSessionsPage'))
const AdminExamAnalyticsPage = lazy(() => import('@features/exams/pages/AdminExamAnalyticsPage'))


const DocumentRequestsPage = lazy(() => import('@features/documents/pages/AdminDocumentRequestsPage'))
const DocumentTemplatesPage = lazy(() => import('@features/documents/pages/DocumentTemplatesPage'))
const DiplomasPage = lazy(() => import('@features/documents/pages/DiplomasPage'))
const DocumentsAttestationsPage = lazy(() => import('@features/documents/pages/DocumentsAttestationsPage'))

const CoursesPage = lazy(() => import('@features/lms/pages/CoursesPage'))
const CourseDetailPage = lazy(() => import('@features/lms/pages/CourseDetailPage'))
const AssignmentsPage = lazy(() => import('@features/lms/pages/AssignmentsPage'))


const DeliberationJuryPage = lazy(() => import('@features/deliberation/pages/DeliberationJuryPage'))

const InternshipsPage = lazy(() => import('@features/internships/pages/InternshipsPage'))
const FinalProjectsPage = lazy(() => import('@features/finalprojects/pages/FinalProjectsPage'))


const MessagesPage = lazy(() => import('@features/communication/pages/MessagesPage'))
const AnnouncementsPage = lazy(() => import('@features/communication/pages/AnnouncementsPage'))
const TicketsPage = lazy(() => import('@features/support/pages/TicketsPage'))

const LibraryPage = lazy(() => import('@features/library/pages/LibraryPage'))
const BorrowingsPage = lazy(() => import('@features/library/pages/BorrowingsPage'))
const ClubsPage = lazy(() => import('@features/clubs/pages/ClubsPage'))

const ClassroomsPage = lazy(() => import('@features/infrastructure/pages/ClassroomsPage'))
const RoomAvailabilityHubPage = lazy(() => import('@features/infrastructure/pages/RoomAvailabilityHubPage'))
const TimetableAdminView = lazy(() => import('@features/academic/pages/TimetableAdminView'))
const ExamLivePresence = lazy(() => import('@features/academic/pages/ExamLivePresence'))
const ExamDisplayList = lazy(() => import('@features/academic/pages/ExamDisplayList'))
const ExamAttendanceSheet = lazy(() => import('@features/academic/pages/ExamAttendanceSheet'))
const AdminExamSurveillanceHubPage = lazy(() => import('@features/exams/pages/AdminExamSurveillanceHubPage'))

const StudentConvocationPdf = lazy(() => import('@features/academic/pages/StudentConvocationPdf'))
const ProfessorConvocationPdf = lazy(() => import('@features/academic/pages/ProfessorConvocationPdf'))
const ProfessorScannerApp = lazy(() => import('@features/academic/pages/ProfessorScannerApp'))
const EnrollmentManager = lazy(() => import('@features/academic/pages/EnrollmentManager'))
const HolidayManager = lazy(() => import('@features/academic/pages/HolidayManager'))
const CreditsAndDerogations = lazy(() => import('@features/academic/pages/CreditsAndDerogations'))
const PredictiveDashboard = lazy(() => import('@features/analytics/pages/PredictiveDashboard'))
const DocumentCenter = lazy(() => import('@features/documents/pages/DocumentCenter'))
const PublicDocumentVerification = lazy(() => import('@features/documents/pages/PublicDocumentVerification'))
const AdmissionCampaignManager = lazy(() => import('@features/admissions/pages/AdmissionCampaignManager'))
const AlumniDashboard = lazy(() => import('@features/alumni/pages/AlumniDashboard'))
const DisciplinePage = lazy(() => import('@features/discipline/pages/DisciplinePage'))

const AiAssistantPage = lazy(() => import('@features/ai/pages/AiAssistantPage'))

const ProfilePage = lazy(() => import('@features/profile/pages/ProfilePage'))
const SettingsPage = lazy(() => import('@features/settings/pages/SettingsPage'))

// Administration
const ActivityLogsPage = lazy(() => import('@features/admin/pages/ActivityLogsPage'))
const TextbooksPage = lazy(() => import('@features/admin/pages/TextbooksPage'))
const AdminClubsPage = lazy(() => import('@features/admin/pages/ClubsPage'))
const AdminTafem = lazy(() => import('@features/admin/pages/AdminTafem'))
const AdminMobility = lazy(() => import('@features/admin/pages/AdminMobility'))
const DoctorantDashboard = lazy(() => import('@features/cedoc/pages/DoctorantDashboard'))
const AdminPredictiveAnalytics = lazy(() => import('@features/admin/pages/AdminPredictiveAnalytics'))
const AdminSmartCampus = lazy(() => import('@features/admin/pages/AdminSmartCampus'))
const ExamLockingPage = lazy(() => import('@features/admin/pages/ExamLockingPage'))
const AcademicYearSettingsPage = lazy(() => import('@features/academic/pages/AcademicYearSettingsPage'))
const StaffProfessorsPage = lazy(() => import('@features/admin/pages/StaffProfessorsPage'))
const AdminAcademicArchivingPage = lazy(() => import('@features/admin/pages/AdminAcademicArchivingPage'))
const AdminPwaPushHubPage = lazy(() => import('@features/admin/pages/AdminPwaPushHubPage'))
const AddUserPage = lazy(() => import('@features/admin/pages/AddUserPage'))
const EditUserPage = lazy(() => import('@features/admin/pages/EditUserPage'))
const ViewUserPage = lazy(() => import('@features/admin/pages/ViewUserPage'))
const AdminStudentsPage = lazy(() => import('@features/admin/pages/AdminStudentsPage'))
const AdminStudentDetailPage = lazy(() => import('@features/admin/pages/AdminStudentDetailPage'))
const CreateSchedulePage = lazy(() => import('@features/admin/pages/CreateSchedulePage'))
const ReservationsPage = lazy(() => import('@features/admin/pages/ReservationsPage'))
const ReservationCreatePage = lazy(() => import('@features/admin/pages/ReservationCreatePage'))
const ReservationEditPage = lazy(() => import('@features/admin/pages/ReservationEditPage'))
const StudentsCreditsPage = lazy(() => import('@features/admin/pages/StudentsCreditsPage'))
const ManageStudentCreditPage = lazy(() => import('@features/admin/pages/ManageStudentCreditPage'))
const AdminGradesPage = lazy(() => import('@features/admin/pages/AdminGradesPage'))
const AdminGradesEditPage = lazy(() => import('@features/admin/pages/AdminGradesEditPage'))
const AdminGradesPVPage = lazy(() => import('@features/admin/pages/AdminGradesPVPage'))
const AdminGradeAppealsPage = lazy(() => import('@features/admin/pages/AdminGradeAppealsPage'))
const AdminSpecialtyAllocationPage = lazy(() => import('@features/admin/pages/AdminSpecialtyAllocationPage'))
const AdminReservistesPage = lazy(() => import('@features/admin/pages/AdminReservistesPage'))
const AdminAbsencesPage = lazy(() => import('@features/admin/pages/AdminAbsencesPage'))
const StudentsRiskPage = lazy(() => import('@features/admin/pages/StudentsRiskPage'))
const AdminTextbooksPage = lazy(() => import('@features/admin/pages/AdminTextbooksPage'))
const AdminInternshipsPage = lazy(() => import('@features/internships/ui/pages/AdminInternshipsPage'))
const StudentInternshipsPage = lazy(() => import('@features/internships/ui/pages/StudentInternshipsPage'))
const AdminConvocationsUIPage = lazy(() => import('@features/exams/ui/pages/AdminConvocationsPage'))
const AdminMessagesPage = lazy(() => import('@features/admin/pages/AdminMessagesPage'))
const AdminActivityLogsPage = lazy(() => import('@features/admin/pages/AdminActivityLogsPage'))
const AdminEvaluationsPage = lazy(() => import('@features/admin/pages/AdminEvaluationsPage'))
const AdminSettingsPage = lazy(() => import('@features/admin/pages/AdminSettingsPage'))
const AdminClubsRoomRequestsPage = lazy(() => import('@features/admin/pages/AdminClubsRoomRequestsPage'))
const AdminClubsCalendarPage = lazy(() => import('@features/admin/pages/AdminClubsCalendarPage'))
const AdminClubFinancePage = lazy(() => import('@features/admin/pages/AdminClubFinancePage'))
const ClassroomPage = lazy(() => import('@features/classroom/pages/ClassroomPage'))
const ClassroomShowPage = lazy(() => import('@features/classroom/pages/ClassroomShowPage'))
const AdminExamsPage = lazy(() => import('@features/exams/pages/AdminExamsPage'))
const AdminExamPvArchivePage = lazy(() => import('@features/exams/pages/AdminExamPvArchivePage'))
const AdminExamDisplayListPage = lazy(() => import('@features/exams/pages/AdminExamDisplayListPage'))
const AdminExamAttendanceSheetPage = lazy(() => import('@features/exams/pages/AdminExamAttendanceSheetPage'))
const AdminExamLiveAttendancePage = lazy(() => import('@features/exams/pages/AdminExamLiveAttendancePage'))
const AdminExamLiveAttendanceReportPage = lazy(() => import('@features/exams/pages/AdminExamLiveAttendanceReportPage'))
const AdminExamEditPage = lazy(() => import('@features/exams/pages/AdminExamEditPage'))
const AdminRetakePage = lazy(() => import('@features/exams/pages/AdminRetakePage'))
const AdminConvocationsPage = lazy(() => import('@features/exams/pages/AdminConvocationsPage'))
const AdminExamScanPage = lazy(() => import('@features/exams/pages/AdminExamScanPage'))
const AdminPrintProfessorsConvocationPage = lazy(() => import('@features/exams/pages/AdminPrintProfessorsConvocationPage'))
const AdminProfessorAvailabilityPage = lazy(() => import('@features/exams/pages/AdminProfessorAvailabilityPage'))
const AdminScheduleChangeRequestsPage = lazy(() => import('@features/exams/pages/AdminScheduleChangeRequestsPage'))
const AdminAlertsPage = lazy(() => import('@features/admin/pages/AdminAlertsPage'))
const AdminMinistryReportPage = lazy(() => import('@features/admin/pages/AdminMinistryReportPage'))
const AdminPFEWorkflowPage = lazy(() => import('@features/admin/pages/AdminPFEWorkflowPage'))
const AdminAcademicCalendarPage = lazy(() => import('@features/admin/pages/AdminAcademicCalendarPage'))
const StudentCourseAnalysisPage = lazy(() => import('@features/students/pages/StudentCourseAnalysisPage'))
const ProfessorRecommendationsPage = lazy(() => import('@features/professor-portal/pages/ProfessorRecommendationsPage'))
const StudentRecommendationsPage = lazy(() => import('@features/students/pages/StudentRecommendationsPage'))
const AdminFinanceDashboard = lazy(() => import('@features/admin/pages/AdminFinanceDashboard'))

const AdminBlockchainDiplomas = lazy(() => import('@features/admin/pages/AdminBlockchainDiplomas'))
const AdminReinscriptionCockpitPage = lazy(() => import('@features/admin/pages/AdminReinscriptionCockpitPage'))
const AlumniNetwork = lazy(() => import('@features/admin/pages/AlumniNetwork'))
const PilotagePage = lazy(() => import('@features/admin/pages/PilotagePage'))
const DocumentPreviewPage = lazy(() => import('@features/documents/pages/DocumentPreviewPage'))
const AdminAiTimetableSchedulerPage = lazy(() => import('@features/timetable/pages/AdminAiTimetableSchedulerPage'))
const ProfessorSchedulePage = lazy(() => import('@features/professor-portal/pages/ProfessorSchedulePage'))
const AdminAnalyticsDashboard = lazy(() => import('@features/analytics/ui/AdminAnalyticsDashboard'))
const AdminGuichetPage = lazy(() => import('@features/admin/pages/AdminGuichetPage'))
const DepartmentSubstitutionsPage = lazy(() => import('@features/admin/pages/DepartmentSubstitutionsPage'))
const AdminRolesPermissionsPage = lazy(() => import('@features/admin/pages/AdminRolesPermissionsPage'))
const AdminParapheurPage = lazy(() => import('@features/hr/pages/AdminParapheurPage'))

// ── Route Guard ────────────────────────────────────────────────
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const location = useLocation()

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.must_change_password && location.pathname !== '/profile') {
    return <Navigate to="/profile?change-password=1" replace />
  }
  return <>{children}</>
}

function RequireGuest({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function ProtectedRoute({ roles, children }: { roles: string[]; children?: ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuthStore()

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (!userCanAccessRoles(user?.roles, roles)) return <Navigate to="/dashboard" replace />

  return children ? <>{children}</> : <Outlet />
}

// ── App Component ──────────────────────────────────────────────
export default function RootRouter() {
  const { fetchUser } = useAuthStore()

  useEffect(() => {
    void fetchUser()
  }, [fetchUser])

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Verification Route */}
        <Route path="/verify-document/:token" element={<PublicDocumentVerification />} />
        
        {/* ── Auth Routes ──────────────────────────────────── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
          <Route path="/two-factor" element={<RequireGuest><TwoFactorPage /></RequireGuest>} />
          <Route path="/forgot-password" element={<RequireGuest><ForgotPasswordPage /></RequireGuest>} />
          <Route path="/reset-password" element={<RequireGuest><ResetPasswordPage /></RequireGuest>} />
          <Route path="/auth/callback" element={<SsoCallbackPage />} />
        </Route>

        <Route path="/inscription" element={<RequireGuest><InscriptionPage /></RequireGuest>} />
        <Route path="/mon-dossier/modifier" element={<ModifierDossierPage />} />

        {/* Public Utility Routes */}
        <Route path="/verify/document/:id" element={<VerifyDocument />} />
        <Route path="/verify/pv/:moduleId/:groupId" element={<VerifyPv />} />

        {/* Printable Document Preview (No Sidebar) */}
        <Route path="/admin/documents/preview/:type?" element={<ProtectedRoute roles={ADMIN_ROLES}><DocumentPreviewPage /></ProtectedRoute>} />

        {/* ── Authenticated App Shell ───────────────────────── */}
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route path="/dashboard" element={<DashboardRouter />} />

          <Route element={<ProtectedRoute roles={['student', 'professor', 'super-admin']} />}>
          <Route path="/cedoc/dashboard" element={<DoctorantDashboard />} />
          </Route>

          {/* Students — staff directory */}
          <Route element={<ProtectedRoute roles={STAFF_ROLES} />}>
            <Route path="/students" element={<StudentsListPage />} />
            <Route path="/students/new" element={<StudentCreatePage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />
            <Route path="/admin/student-cards" element={<AdminStudentCardsPage />} />
          </Route>
          <Route path="/profile/card" element={<DigitalCardPage />} />
          <Route element={<ProtectedRoute roles={['student']} />}>
            <Route path="/student/course-analysis" element={<StudentCourseAnalysisPage />} />
            <Route path="/student/recommendations" element={<StudentRecommendationsPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={TEACHING_ROLES} />}>
            <Route path="/professor/recommendations" element={<ProfessorRecommendationsPage />} />
          </Route>

          {/* HR */}
          <Route element={<ProtectedRoute roles={HR_ROLES} />}>
            <Route path="/hr/professors" element={<ProfessorsListPage />} />
            <Route path="/hr/vacataires" element={<VacatairesManager />} />
          </Route>

          {/* Student Portal */}
          <Route element={<ProtectedRoute roles={['student']} />}>
            <Route path="student/*" element={<StudentRouter />} />
          </Route>

          {/* Professor Portal */}
          <Route element={<ProtectedRoute roles={['professor', 'vacataire', 'department-head', 'filiere-head', 'super-admin', 'institution-admin', 'director']} />}>
            <Route path="professor/*" element={<ProfessorRouter />} />
          </Route>

          {/* Attendance */}
          <Route element={<ProtectedRoute roles={['professor', 'vacataire', 'department-head', 'filiere-head', 'super-admin', 'institution-admin', 'director']} />}>
            <Route path="/attendance/manage" element={<ProfessorAttendanceView />} />
          </Route>
          <Route element={<ProtectedRoute roles={['student']} />}>
            <Route path="/attendance/scan" element={<QRScannerPage />} />
          </Route>

          {/* Vacataires */}
          <Route element={<ProtectedRoute roles={HR_ROLES} />}>
            <Route path="/vacataires" element={<VacatairesListPage />} />
            <Route path="/vacataires/:id/contract" element={<VacataireContractPage />} />
          </Route>

          {/* Admission */}
          <Route element={<ProtectedRoute roles={ADMIN_ROLES} />}>
            <Route path="/admissions/candidatures" element={<CandidaturesPage />} />
            <Route path="/admission/applications" element={<ApplicationsPage />} />
          </Route>

          {/* Academic */}
          <Route element={<ProtectedRoute roles={ACADEMIC_ROLES} />}>
            <Route path="/academic/years" element={<AcademicYearsPage />} />
            <Route path="/admin/academic" element={<AcademicYearSettingsPage />} />
            <Route path="/admin/professor-assignments" element={<AcademicYearSettingsPage />} />
            <Route path="/admin/textbooks" element={<AdminTextbooksPage />} />
            <Route path="/admin/substitutions" element={<DepartmentSubstitutionsPage />} />
            <Route path="/admin/roles-permissions" element={<AdminRolesPermissionsPage />} />
            <Route path="/admin/parapheur" element={<AdminParapheurPage />} />
            <Route path="/academic/architecture" element={<AcademicArchitecturePage />} />
            <Route path="/academic/groups" element={<AcademicArchitecturePage />} />
            <Route path="/academic/filieres" element={<AcademicArchitecturePage />} />
            <Route path="/academic/departments" element={<AcademicArchitecturePage />} />
            <Route path="/academic/modules" element={<ModulesListPage />} />
            <Route path="/academic/deliberations" element={<DeliberationManager />} />
            <Route path="/professors" element={<ProfessorsListPage />} />
          </Route>

          {/* Grades & PV Routes */}
          <Route element={<ProtectedRoute roles={TEACHING_ROLES} />}>
            <Route path="/admin/grades" element={<AdminGradesPage />} />
            <Route path="/admin/grades/edit" element={<AdminGradesEditPage />} />
            <Route path="/admin/grades/pv" element={<AdminGradesPVPage />} />
            <Route path="/professor/grades" element={<AdminGradesPage />} />
            <Route path="/admin/grade-appeals" element={<AdminGradeAppealsPage />} />
            <Route path="/professor/grade-appeals" element={<AdminGradeAppealsPage />} />
            <Route path="/admin/specialty-allocation" element={<AdminSpecialtyAllocationPage />} />
          </Route>

          {/* Timetable & Exams */}
          <Route element={<ProtectedRoute roles={TEACHING_ROLES} />}>
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/academic/timetable" element={<TimetableAdminView />} />
            <Route path="/admin/ai-timetable-scheduler" element={<AdminAiTimetableSchedulerPage />} />
            <Route path="/admin/schedules/engine" element={<AdminAiTimetableSchedulerPage />} />
            <Route path="/admin/timetable/engine" element={<AdminAiTimetableSchedulerPage />} />
            <Route path="/admin/timetable/calendar" element={<AdminAiTimetableSchedulerPage />} />
            <Route path="/professor/schedules" element={<ProfessorSchedulePage />} />
            <Route path="/admin/academic-calendar" element={<AdminAcademicCalendarPage />} />
            <Route path="/academic/exam-planning/:examId/live" element={<ExamLivePresence />} />
            <Route path="/academic/exam-planning/:examId/affichage" element={<ExamDisplayList />} />
            <Route path="/academic/exam-planning/:examId/emargement" element={<ExamAttendanceSheet />} />
            <Route path="/academic/exam-planning/:id/surveillance" element={<AdminExamSurveillanceHubPage />} />
            <Route path="/admin/exams/:id/surveillance" element={<AdminExamSurveillanceHubPage />} />
            <Route path="/admin/exams/pv-archive" element={<AdminExamPvArchivePage />} />
            <Route path="/admin/exams/archives" element={<AdminExamPvArchivePage />} />
            <Route path="/admin/exams/analytics" element={<AdminExamAnalyticsPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={[...TEACHING_ROLES, 'scolarite']} />}>
            <Route path="/admin/rooms/availability" element={<AdminRoomAvailabilityPage />} />
          </Route>


          
          {/* Convocations Officielles */}
          <Route element={<ProtectedRoute roles={TEACHING_ROLES} />}>
            <Route path="/academic/convocations/dashboard" element={<AdminConvocationsUIPage />} />
            <Route path="/academic/convocations/student/:id/print" element={<StudentConvocationPdf />} />
            <Route path="/academic/convocations/professor/:id/print" element={<ProfessorConvocationPdf />} />
            <Route path="/academic/scanner" element={<ProfessorScannerApp />} />
          </Route>

          {/* Core Academic Administration */}
          <Route element={<ProtectedRoute roles={ACADEMIC_ROLES} />}>
            <Route path="/academic/enrollments" element={<EnrollmentManager />} />
            <Route path="/academic/holidays" element={<HolidayManager />} />
            <Route path="/academic/credits-derogations" element={<CreditsAndDerogations />} />
            <Route path="/academic/internships" element={<AdminInternshipsPage />} />
            <Route path="/academic/predictive-analytics" element={<PredictiveDashboard />} />
            <Route path="/academic/documents" element={<DocumentCenter />} />
            <Route path="/admissions/campaigns" element={<AdmissionCampaignManager />} />
            <Route path="/admissions/applications" element={<ApplicationsPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['student']} />}>
            <Route path="/student/internships" element={<StudentInternshipsPage />} />
          </Route>
          <Route path="/alumni/dashboard" element={<AlumniDashboard />} />

          {/* Attendance */}
          <Route element={<ProtectedRoute roles={TEACHING_ROLES} />}>
            <Route path="/attendance" element={<AttendancePage />} />
          </Route>

          {/* Exams & Grades */}
          <Route element={<ProtectedRoute roles={TEACHING_ROLES} />}>
            <Route path="/exams" element={<ExamSessionsPage />} />
            <Route path="/exams/deliberations" element={<Navigate to="/admin/grades/pv" replace />} />
            <Route path="/academic/deliberations" element={<Navigate to="/admin/grades/pv" replace />} />
            <Route path="/exams/deliberations/:id/jury" element={<DeliberationJuryPage />} />
          </Route>

          {/* Documents */}
          <Route element={<ProtectedRoute roles={ADMIN_ROLES} />}>
            <Route path="/documents/requests" element={<DocumentRequestsPage />} />
            <Route path="/documents/templates" element={<DocumentTemplatesPage />} />
            <Route path="/documents/diplomas" element={<DiplomasPage />} />
            <Route path="/documents/attestations" element={<DocumentsAttestationsPage />} />
          </Route>

          {/* LMS */}
          <Route path="/lms/courses" element={<CoursesPage />} />
          <Route path="/lms/courses/:id" element={<CourseDetailPage />} />
          <Route path="/lms/assignments" element={<AssignmentsPage />} />

          {/* Internships & PFE */}
          <Route element={<ProtectedRoute roles={STAFF_ROLES} />}>
            <Route path="/internships" element={<InternshipsPage />} />
            <Route path="/final-projects" element={<FinalProjectsPage />} />
            <Route path="/infrastructure" element={<InfrastructurePage />} />
            <Route path="/infrastructure/classrooms" element={<ClassroomsPage />} />
            <Route path="/admin/rooms/availability" element={<RoomAvailabilityHubPage />} />
            <Route path="/admin/reservations" element={<RoomAvailabilityHubPage />} />
            <Route path="/infrastructure/availability" element={<RoomAvailabilityHubPage />} />
          </Route>

          {/* Communication */}
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/support" element={<TicketsPage />} />

          {/* Library */}
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/borrowings" element={<BorrowingsPage />} />

          {/* Clubs & Discipline */}
          <Route path="/clubs" element={<ClubsPage />} />
          <Route element={<ProtectedRoute roles={[...ADMIN_ROLES, 'discipline-committee']} />}>
            <Route path="/discipline" element={<DisciplinePage />} />
          </Route>

          {/* AI */}
          <Route path="/ai" element={<AiAssistantPage />} />

          {/* Profile & Settings */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route element={<ProtectedRoute roles={ADMIN_ROLES} />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Outils */}
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/faq" element={<FAQPage />} />

          {/* Administration */}
          <Route element={<ProtectedRoute roles={ADMIN_ROLES} />}>
            <Route path="/admin/activity-logs" element={<ActivityLogsPage />} />
            <Route path="/admin/textbooks" element={<TextbooksPage />} />
            <Route path="/admin/evaluations" element={<AdminEvaluationsPage />} />

            <Route path="/admin/clubs" element={<AdminClubsPage />} />
            <Route path="/admin/clubs/calendar" element={<AdminClubsCalendarPage />} />
            <Route path="/admin/clubs-room-requests" element={<AdminClubsRoomRequestsPage />} />
            <Route path="/admin/club-finance" element={<AdminClubFinancePage />} />
            <Route path="/admin/tafem" element={<AdminTafem />} />
            <Route path="/admin/mobility" element={<AdminMobility />} />
            <Route path="/admin/jury-pfe" element={<AdminPFEWorkflowPage />} />
            <Route path="/admin/predictive-analytics" element={<AdminPredictiveAnalytics />} />
            <Route path="/admin/workflow-builder" element={<AdminWorkflowBuilder />} />
            <Route path="/admin/exam-locking" element={<ExamLockingPage />} />
            <Route path="/admin/smart-campus" element={<AdminSmartCampus />} />
            <Route path="/admin/academic" element={<AcademicYearSettingsPage />} />
            <Route path="/admin/users" element={<StaffProfessorsPage />} />
            <Route path="/admin/users/create" element={<AddUserPage />} />
            <Route path="/admin/users/:id/edit" element={<EditUserPage />} />
            <Route path="/admin/users/:id" element={<ViewUserPage />} />
            <Route path="/admin/students" element={<AdminStudentsPage />} />
            <Route path="/admin/students/:id" element={<AdminStudentDetailPage />} />
            <Route path="/admin/ai-timetable-scheduler" element={<AdminAiTimetableSchedulerPage />} />
            <Route path="/admin/timetable/ai-scheduler" element={<AdminAiTimetableSchedulerPage />} />
            <Route path="/admin/schedules" element={<AdminAiTimetableSchedulerPage />} />
            <Route path="/admin/schedules/create" element={<CreateSchedulePage />} />
            <Route path="/admin/reservations" element={<ReservationsPage />} />
            <Route path="/admin/reservations/create" element={<ReservationCreatePage />} />
            <Route path="/admin/reservations/:id/edit" element={<ReservationEditPage />} />
            <Route path="/admin/students-credits" element={<StudentsCreditsPage />} />
            <Route path="/admin/students-credits/:id/manage" element={<ManageStudentCreditPage />} />
            <Route path="/admin/grades" element={<AdminGradesPage />} />
            <Route path="/admin/grades/edit" element={<AdminGradesEditPage />} />
            <Route path="/admin/grades/pv" element={<AdminGradesPVPage />} />
            <Route path="/admin/reservistes" element={<AdminReservistesPage />} />
            <Route path="/admin/absences" element={<AdminAbsencesPage />} />
            <Route path="/admin/students-risk" element={<StudentsRiskPage />} />
            <Route path="/admin/textbooks" element={<AdminTextbooksPage />} />
            <Route path="/admin/requests" element={<AdminGuichetPage />} />
            <Route path="/admin/messages" element={<AdminMessagesPage />} />
            <Route path="/admin/activity-logs" element={<AdminActivityLogsPage />} />
            <Route path="/admin/alerts" element={<AdminAlertsPage />} />
            <Route path="/admin/ministry-report" element={<AdminMinistryReportPage />} />
            <Route path="/admin/pfe-workflow" element={<AdminPFEWorkflowPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/archiving" element={<AdminAcademicArchivingPage />} />
            <Route path="/admin/academic-archiving" element={<AdminAcademicArchivingPage />} />
            <Route path="/admin/pwa-notifications" element={<AdminPwaPushHubPage />} />
            <Route path="/admin/push-notifications" element={<AdminPwaPushHubPage />} />
            <Route path="/admin/finance" element={<AdminFinanceDashboard />} />
            <Route path="/admin/finance-dashboard" element={<AdminFinanceDashboard />} />
            <Route path="/admin/reinscriptions" element={<AdminReinscriptionCockpitPage />} />
            <Route path="/admin/blockchain-diplomas" element={<AdminBlockchainDiplomas />} />
            <Route path="/admin/predictive-analytics" element={<AdminPredictiveAnalytics />} />
            <Route path="/admin/smart-campus" element={<AdminSmartCampus />} />
            <Route path="/admin/tafem" element={<AdminTafem />} />
            <Route path="/admin/mobility" element={<AdminMobility />} />
            <Route path="/admin/jury-pfe" element={<AdminPFEWorkflowPage />} />
            <Route path="/admin/alumni" element={<AlumniNetwork />} />
            <Route path="/admin/pilotage" element={<PilotagePage />} />
            <Route path="/admin/exams" element={<AdminExamsPage />} />
            <Route path="/admin/exams/:id/edit" element={<AdminExamEditPage />} />
            <Route path="/admin/exams/:id/display-list" element={<AdminExamDisplayListPage />} />
            <Route path="/admin/exams/:id/attendance-sheet" element={<AdminExamAttendanceSheetPage />} />
            <Route path="/admin/exams/:id/live-attendance" element={<AdminExamLiveAttendancePage />} />
            <Route path="/admin/exams/:id/live-attendance/report" element={<AdminExamLiveAttendanceReportPage />} />
            <Route path="/admin/retake" element={<AdminRetakePage />} />
            <Route path="/admin/convocations" element={<AdminConvocationsPage />} />
            <Route path="/admin/exams/scan" element={<AdminExamScanPage />} />
            <Route path="/admin/convocations/print-professors" element={<AdminPrintProfessorsConvocationPage />} />
            <Route path="/admin/professor-availability" element={<AdminProfessorAvailabilityPage />} />
            <Route path="/admin/schedule-change-requests" element={<AdminScheduleChangeRequestsPage />} />
            <Route path="/admin/exams/analytics" element={<AdminExamAnalyticsPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsDashboard />} />
            <Route path="/admin/guichet" element={<AdminGuichetPage />} />
          </Route>
          <Route path="/classroom" element={<ClassroomPage />} />
          <Route path="/classroom/show/:classId/:groupId" element={<ClassroomShowPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
