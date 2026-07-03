import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { useAuthStore } from '@stores/authStore'
import AppShell from '@shared/components/layout/AppShell'
import AuthLayout from '@shared/components/layout/AuthLayout'
import LoadingScreen from '@shared/components/ui/LoadingScreen'
// ── Lazy-loaded feature routes ─────────────────────────────────
const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'))
const TwoFactorPage = lazy(() => import('@features/auth/pages/TwoFactorPage'))
const ForgotPasswordPage = lazy(() => import('@features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@features/auth/pages/ResetPasswordPage'))
const VerifyDocument = lazy(() => import('@features/documents/pages/VerifyDocument'))
const LandingPage = lazy(() => import('@features/public/pages/LandingPage'))
const InscriptionPage = lazy(() => import('@features/public/pages/InscriptionPage'))
const InfrastructurePage = lazy(() => import('@features/public/pages/LandingPage')) // Fallback for now if it doesn't exist

// Professor Portal
const ProfessorDashboard = lazy(() => import('@features/professor-portal/pages/ProfessorDashboard'))
const ProfessorScanner = lazy(() => import('@features/professor-portal/pages/ProfessorScanner'))
const ProfessorProctoring = lazy(() => import('@features/professor-portal/pages/ProfessorProctoring'))
const ProfessorAvailability = lazy(() => import('@features/professor-portal/pages/ProfessorAvailability'))
const ProfessorInternships = lazy(() => import('@features/professor-portal/pages/ProfessorInternships'))
const ProfessorAbsences = lazy(() => import('@features/professor-portal/pages/ProfessorAbsences'))
const ProfessorCall = lazy(() => import('@features/professor-portal/pages/ProfessorCall'))
const ProfessorClassroom = lazy(() => import('@features/professor-portal/pages/ProfessorClassroom'))
const ProfessorReservations = lazy(() => import('@features/professor-portal/pages/ProfessorReservations'))
const ProfessorQCMGenerator = lazy(() => import('@features/professor-portal/pages/ProfessorQCMGenerator'))
const ProfessorAnalytics = lazy(() => import('@features/professor-portal/pages/ProfessorAnalytics'))
const ProfessorSmartGrading = lazy(() => import('@features/professor-portal/pages/ProfessorSmartGrading'))
const ProfessorProjectsKanban = lazy(() => import('@features/professor-portal/pages/ProfessorProjectsKanban'))

// Outils
const CalendarPage = lazy(() => import('@features/tools/pages/CalendarPage'))
const ChatPage = lazy(() => import('@features/tools/pages/ChatPage'))
const FAQPage = lazy(() => import('@features/tools/pages/FAQPage'))

const DashboardRouter = lazy(() => import('@features/dashboard/pages/DashboardRouter'))

const StudentsListPage = lazy(() => import('@features/students/pages/StudentsPage'))
const StudentDetailPage = lazy(() => import('@features/students/pages/StudentDetailPage'))
const DigitalCardPage = lazy(() => import('@features/students/pages/DigitalCardPage'))
const StudentCreatePage = lazy(() => import('@features/students/pages/StudentCreatePage'))
// Student Portal
const StudentDashboard = lazy(() => import('@features/dashboard/pages/StudentDashboard'))
const StudentGrades = lazy(() => import('@features/student-portal/pages/StudentGrades'))
const StudentExams = lazy(() => import('@features/student-portal/pages/StudentExams'))
const StudentConvocations = lazy(() => import('@features/student-portal/pages/StudentConvocations'))
const ConvocationPDFView = lazy(() => import('@features/student-portal/pages/ConvocationPDFView'))
const StudentInternships = lazy(() => import('@features/student-portal/pages/StudentInternships'))
const StudentEvaluations = lazy(() => import('@features/student-portal/pages/StudentEvaluations'))
const StudentSchedule = lazy(() => import('@features/student-portal/pages/StudentSchedule'))
const StudentPortfolio = lazy(() => import('@features/student-portal/pages/StudentPortfolio'))
const StudentProjectsMarket = lazy(() => import('@features/student-portal/pages/StudentProjectsMarket'))
const StudentClubsHub = lazy(() => import('@features/student-portal/pages/StudentClubsHub'))
const StudentDigitalLibrary = lazy(() => import('@features/student-portal/pages/StudentDigitalLibrary'))
const StudentGamification = lazy(() => import('@features/student-portal/pages/StudentGamification'))

// HR
const VacatairesManager = lazy(() => import('@features/hr/pages/VacatairesManager'))
const ProfessorsListPage = lazy(() => import('@features/professors/pages/ProfessorsListPage'))
const AdminWorkflowBuilder = lazy(() => import('@features/admin/pages/AdminWorkflowBuilder'))
const VacatairesListPage = lazy(() => import('@features/vacataire/components/VacataireList'))
const VacataireContractPage = lazy(() => import('@features/vacataire/pages/VacataireContractPage'))

const CandidaturesPage = lazy(() => import('@features/admissions/components/CandidatureList'))
const ApplicationsPage = lazy(() => import('@features/admission/pages/ApplicationsPage'))

const AcademicYearsPage = lazy(() => import('@features/academic/pages/AcademicYearsPage'))
const GroupsPage = lazy(() => import('@features/academic/pages/GroupsPage'))
const FilieresPage = lazy(() => import('@features/academic/components/FiliereList'))
const DepartmentsPage = lazy(() => import('@features/academic/components/DepartmentList'))
const ModulesListPage = lazy(() => import('@features/modules/pages/ModulesListPage'))
const DeliberationManager = lazy(() => import('@features/academic/pages/DeliberationManager'))

// Attendance
const ProfessorAttendanceView = lazy(() => import('@features/attendance/pages/ProfessorAttendanceView'))
const QRScannerPage = lazy(() => import('@features/attendance/pages/QRScannerPage'))

const TimetablePage = lazy(() => import('@features/timetable/pages/ModernTimetable'))
const AttendancePage = lazy(() => import('@features/attendance/pages/AttendancePage'))

const ExamSessionsPage = lazy(() => import('@features/exams/pages/ExamSessionsPage'))
const GradeEntryPage = lazy(() => import('@features/exams/components/GradeEntry'))
const DeliberationPage = lazy(() => import('@features/deliberation/pages/DeliberationPage'))

const DocumentRequestsPage = lazy(() => import('@features/documents/pages/DocumentRequestsPage'))
const DocumentTemplatesPage = lazy(() => import('@features/documents/pages/DocumentTemplatesPage'))
const DiplomasPage = lazy(() => import('@features/documents/pages/DiplomasPage'))
const DocumentsAttestationsPage = lazy(() => import('@features/documents/pages/DocumentsAttestationsPage'))

const CoursesPage = lazy(() => import('@features/lms/pages/CoursesPage'))
const CourseDetailPage = lazy(() => import('@features/lms/pages/CourseDetailPage'))
const AssignmentsPage = lazy(() => import('@features/lms/pages/AssignmentsPage'))

const InternshipsPage = lazy(() => import('@features/internships/pages/InternshipsPage'))
const FinalProjectsPage = lazy(() => import('@features/finalprojects/pages/FinalProjectsPage'))

const MessagesPage = lazy(() => import('@features/communication/pages/MessagesPage'))
const AnnouncementsPage = lazy(() => import('@features/communication/pages/AnnouncementsPage'))
const TicketsPage = lazy(() => import('@features/support/pages/TicketsPage'))

const LibraryPage = lazy(() => import('@features/library/pages/LibraryPage'))
const BorrowingsPage = lazy(() => import('@features/library/pages/BorrowingsPage'))
const ClubsPage = lazy(() => import('@features/clubs/pages/ClubsPage'))

const ClassroomsPage = lazy(() => import('@features/infrastructure/pages/ClassroomsPage'))
const TimetableAdminView = lazy(() => import('@features/academic/pages/TimetableAdminView'))
const ExamPlanningManager = lazy(() => import('@features/academic/pages/ExamPlanningManager'))
const ExamLivePresence = lazy(() => import('@features/academic/pages/ExamLivePresence'))
const ExamDisplayList = lazy(() => import('@features/academic/pages/ExamDisplayList'))
const ExamAttendanceSheet = lazy(() => import('@features/academic/pages/ExamAttendanceSheet'))
const ConvocationDashboard = lazy(() => import('@features/academic/pages/ConvocationDashboard'))
const StudentConvocationPdf = lazy(() => import('@features/academic/pages/StudentConvocationPdf'))
const ProfessorConvocationPdf = lazy(() => import('@features/academic/pages/ProfessorConvocationPdf'))
const ProfessorScannerApp = lazy(() => import('@features/academic/pages/ProfessorScannerApp'))
const StudentAbsenceUpload = lazy(() => import('@features/academic/pages/StudentAbsenceUpload'))
const EnrollmentManager = lazy(() => import('@features/academic/pages/EnrollmentManager'))
const HolidayManager = lazy(() => import('@features/academic/pages/HolidayManager'))
const CreditsAndDerogations = lazy(() => import('@features/academic/pages/CreditsAndDerogations'))
const InternshipManager = lazy(() => import('@features/academic/pages/InternshipManager'))
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
const EvaluationsPage = lazy(() => import('@features/admin/pages/EvaluationsPage'))
const AdminClubsPage = lazy(() => import('@features/admin/pages/ClubsPage'))
const AdminPilotage = lazy(() => import('@features/admin/pages/AdminPilotage'))
const AdminTafem = lazy(() => import('@features/admin/pages/AdminTafem'))
const AdminMobility = lazy(() => import('@features/admin/pages/AdminMobility'))
const AdminJuryPFE = lazy(() => import('@features/admin/pages/AdminJuryPFE'))
const StudentMobility = lazy(() => import('@features/student-portal/pages/StudentMobility'))
const DoctorantDashboard = lazy(() => import('@features/cedoc/pages/DoctorantDashboard'))
const AdminPredictiveAnalytics = lazy(() => import('@features/admin/pages/AdminPredictiveAnalytics'))
const AdminSmartCampus = lazy(() => import('@features/admin/pages/AdminSmartCampus'))
const ExamLockingPage = lazy(() => import('@features/admin/pages/ExamLockingPage'))
const AcademicYearSettingsPage = lazy(() => import('@features/academic/pages/AcademicYearSettingsPage'))
const StaffProfessorsPage = lazy(() => import('@features/admin/pages/StaffProfessorsPage'))
const AddUserPage = lazy(() => import('@features/admin/pages/AddUserPage'))
const EditUserPage = lazy(() => import('@features/admin/pages/EditUserPage'))
const ViewUserPage = lazy(() => import('@features/admin/pages/ViewUserPage'))
const AdminStudentsPage = lazy(() => import('@features/admin/pages/AdminStudentsPage'))
const AdminStudentDetailPage = lazy(() => import('@features/admin/pages/AdminStudentDetailPage'))
const SchedulesEnginePage = lazy(() => import('@features/admin/pages/SchedulesEnginePage'))
const InteractiveCalendarPage = lazy(() => import('@features/admin/pages/InteractiveCalendarPage'))
const CreateSchedulePage = lazy(() => import('@features/admin/pages/CreateSchedulePage'))
const ReservationsPage = lazy(() => import('@features/admin/pages/ReservationsPage'))
const ReservationCreatePage = lazy(() => import('@features/admin/pages/ReservationCreatePage'))
const ReservationEditPage = lazy(() => import('@features/admin/pages/ReservationEditPage'))
const StudentsCreditsPage = lazy(() => import('@features/admin/pages/StudentsCreditsPage'))
const ManageStudentCreditPage = lazy(() => import('@features/admin/pages/ManageStudentCreditPage'))
const AdminGradesPage = lazy(() => import('@features/admin/pages/AdminGradesPage'))
const AdminGradesEditPage = lazy(() => import('@features/admin/pages/AdminGradesEditPage'))
const AdminAbsencesPage = lazy(() => import('@features/admin/pages/AdminAbsencesPage'))
const StudentsRiskPage = lazy(() => import('@features/admin/pages/StudentsRiskPage'))
const AdminTextbooksPage = lazy(() => import('@features/admin/pages/AdminTextbooksPage'))
const AdminRequestsPage = lazy(() => import('@features/admin/pages/AdminRequestsPage'))
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
const AdminExamDisplayListPage = lazy(() => import('@features/exams/pages/AdminExamDisplayListPage'))
const AdminExamAttendanceSheetPage = lazy(() => import('@features/exams/pages/AdminExamAttendanceSheetPage'))
const AdminExamLiveAttendancePage = lazy(() => import('@features/exams/pages/AdminExamLiveAttendancePage'))
const AdminExamLiveAttendanceReportPage = lazy(() => import('@features/exams/pages/AdminExamLiveAttendanceReportPage'))
const AdminExamEditPage = lazy(() => import('@features/exams/pages/AdminExamEditPage'))
const AdminRetakePage = lazy(() => import('@features/exams/pages/AdminRetakePage'))
const AdminConvocationsPage = lazy(() => import('@features/exams/pages/AdminConvocationsPage'))
const AdminPrintProfessorsConvocationPage = lazy(() => import('@features/exams/pages/AdminPrintProfessorsConvocationPage'))
const AdminProfessorAvailabilityPage = lazy(() => import('@features/exams/pages/AdminProfessorAvailabilityPage'))
const AdminScheduleChangeRequestsPage = lazy(() => import('@features/exams/pages/AdminScheduleChangeRequestsPage'))
const AdminExamAnalyticsPage = lazy(() => import('@features/exams/pages/AdminExamAnalyticsPage'))
const AdminFinanceDashboard = lazy(() => import('@features/admin/pages/AdminFinanceDashboard'))
const AdminBlockchainDiplomas = lazy(() => import('@features/admin/pages/AdminBlockchainDiplomas'))
const AlumniNetwork = lazy(() => import('@features/admin/pages/AlumniNetwork'))
const PilotagePage = lazy(() => import('@features/admin/pages/PilotagePage'))
const DocumentPreviewPage = lazy(() => import('@features/documents/pages/DocumentPreviewPage'))

// ── Route Guard ────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function ProtectedRoute({ roles }: { roles: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuthStore()

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  
  const hasRole = roles.some(role => user?.roles?.includes(role))
  if (!hasRole) return <Navigate to="/dashboard" replace />
  
  return <Outlet />
}

// ── App Component ──────────────────────────────────────────────
export default function App() {
  const { user, fetchUser } = useAuthStore()

  useEffect(() => {
    fetchUser()
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
        </Route>

        <Route path="/inscription" element={<RequireGuest><InscriptionPage /></RequireGuest>} />

        {/* Public Utility Routes */}
        <Route path="/verify/document/:id" element={<VerifyDocument />} />

        {/* Printable Document Preview (No Sidebar) */}
        <Route path="/admin/documents/preview/:type?" element={<RequireAuth><DocumentPreviewPage /></RequireAuth>} />

        {/* ── Authenticated App Shell ───────────────────────── */}
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route path="/dashboard" element={<DashboardRouter />} />

          <Route element={<ProtectedRoute roles={['student', 'professor', 'super-admin']} />}>
          <Route path="/cedoc/dashboard" element={<DoctorantDashboard />} />
          </Route>

          {/* Students */}
          <Route path="/students" element={<StudentsListPage />} />
          <Route path="/students/new" element={<StudentCreatePage />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />
          <Route path="/profile/card" element={<DigitalCardPage />} />

          {/* HR */}
          <Route path="/hr/professors" element={<ProfessorsListPage />} />
          <Route path="/hr/vacataires" element={<VacatairesManager />} />

          {/* Student Portal */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/grades" element={<StudentGrades />} />
          <Route path="/student/exams" element={<StudentExams />} />
          <Route path="/student/convocations" element={<StudentConvocations />} />
          <Route path="/student/mobility" element={<StudentMobility />} />
          <Route path="/student/convocations/:id/download" element={<ConvocationPDFView />} />
          <Route path="/student/internships" element={<StudentInternships />} />
          <Route path="/student/evaluations" element={<StudentEvaluations />} />
          <Route path="/student/schedule" element={<StudentSchedule />} />
          <Route path="/student/requests" element={<TicketsPage />} />
          <Route path="/student/portfolio" element={<StudentPortfolio />} />
          <Route path="/student/projects" element={<StudentProjectsMarket />} />
          <Route path="/student/clubs" element={<StudentClubsHub />} />
          <Route path="/student/library" element={<StudentDigitalLibrary />} />
          <Route path="/student/gamification" element={<StudentGamification />} />

          {/* Professor Portal */}
          <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
          <Route path="/professor/check-in/scanner" element={<ProfessorScanner />} />
          <Route path="/professor/proctor-convocations" element={<ProfessorProctoring />} />
          <Route path="/professor/availability" element={<ProfessorAvailability />} />
          <Route path="/professor/textbook" element={<TextbooksPage />} />
          <Route path="/professor/internships" element={<ProfessorInternships />} />
          <Route path="/professor/absences" element={<ProfessorAbsences />} />
          <Route path="/professor/absences/call/:sessionId" element={<ProfessorCall />} />
          <Route path="/professor/classroom/:moduleId" element={<ProfessorClassroom />} />
          <Route path="/professor/reservations" element={<ProfessorReservations />} />
          
          {/* Premium Professor Tools */}
          <Route path="/professor/qcm-generator" element={<ProfessorQCMGenerator />} />
          <Route path="/professor/analytics" element={<ProfessorAnalytics />} />
          <Route path="/professor/grading" element={<ProfessorSmartGrading />} />
          <Route path="/professor/projects-kanban" element={<ProfessorProjectsKanban />} />

          {/* Attendance */}
          <Route path="/attendance/manage" element={<ProfessorAttendanceView />} />
          <Route path="/attendance/scan" element={<QRScannerPage />} />

          {/* Vacataires */}
          <Route path="/vacataires" element={<VacatairesListPage />} />
          <Route path="/vacataires/:id/contract" element={<VacataireContractPage />} />

          {/* Admission */}
          <Route path="/admissions/candidatures" element={<CandidaturesPage />} />
          <Route path="/admission/applications" element={<ApplicationsPage />} />

          {/* Academic */}
          <Route path="/academic/years" element={<AcademicYearsPage />} />
          <Route path="/academic/groups" element={<GroupsPage />} />
          <Route path="/academic/filieres" element={<FilieresPage />} />
          <Route path="/academic/departments" element={<DepartmentsPage />} />
          <Route path="/academic/modules" element={<ModulesListPage />} />
          <Route path="/academic/deliberations" element={<DeliberationManager />} />
          <Route path="/professors" element={<ProfessorsListPage />} />

          {/* Timetable & Exams */}
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/academic/timetable" element={<TimetableAdminView />} />
          <Route path="/academic/exam-planning" element={<ExamPlanningManager />} />
          <Route path="/academic/exam-planning/:examId/live" element={<ExamLivePresence />} />
          <Route path="/academic/exam-planning/:examId/affichage" element={<ExamDisplayList />} />
          <Route path="/academic/exam-planning/:examId/emargement" element={<ExamAttendanceSheet />} />
          
          {/* Convocations Officielles */}
          <Route path="/academic/convocations/dashboard" element={<ConvocationDashboard />} />
          <Route path="/academic/convocations/student/:id/print" element={<StudentConvocationPdf />} />
          <Route path="/academic/convocations/professor/:id/print" element={<ProfessorConvocationPdf />} />

          {/* Scanner & Absences */}
          <Route path="/academic/scanner" element={<ProfessorScannerApp />} />
          <Route path="/student/absences" element={<StudentAbsenceUpload />} />

          {/* Core Academic Administration */}
          <Route path="/academic/enrollments" element={<EnrollmentManager />} />
          <Route path="/academic/holidays" element={<HolidayManager />} />
          <Route path="/academic/credits-derogations" element={<CreditsAndDerogations />} />
          <Route path="/academic/internships" element={<InternshipManager />} />

          <Route path="/academic/predictive-analytics" element={<PredictiveDashboard />} />
          <Route path="/academic/documents" element={<DocumentCenter />} />
          <Route path="/admissions/campaigns" element={<AdmissionCampaignManager />} />
          <Route path="/alumni/dashboard" element={<AlumniDashboard />} />

          {/* Attendance */}
          <Route path="/attendance" element={<AttendancePage />} />

          {/* Exams & Grades */}
          <Route path="/exams" element={<ExamSessionsPage />} />
          <Route path="/exams/notes" element={<GradeEntryPage />} />
          <Route path="/exams/deliberations" element={<DeliberationPage />} />

          {/* Documents */}
          <Route path="/documents/requests" element={<DocumentRequestsPage />} />
          <Route path="/documents/templates" element={<DocumentTemplatesPage />} />
          <Route path="/documents/diplomas" element={<DiplomasPage />} />
          <Route path="/documents/attestations" element={<DocumentsAttestationsPage />} />

          {/* LMS */}
          <Route path="/lms/courses" element={<CoursesPage />} />
          <Route path="/lms/courses/:id" element={<CourseDetailPage />} />
          <Route path="/lms/assignments" element={<AssignmentsPage />} />

          {/* Internships & PFE */}
          <Route path="/internships" element={<InternshipsPage />} />
          <Route path="/final-projects" element={<FinalProjectsPage />} />
          <Route path="/infrastructure" element={<InfrastructurePage />} />
          <Route path="/infrastructure/classrooms" element={<ClassroomsPage />} />

          {/* Communication */}
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/support" element={<TicketsPage />} />

          {/* Library */}
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/borrowings" element={<BorrowingsPage />} />

          {/* Clubs & Discipline */}
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/discipline" element={<DisciplinePage />} />

          {/* AI */}
          <Route path="/ai" element={<AiAssistantPage />} />

          {/* Profile & Settings */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Outils */}
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/faq" element={<FAQPage />} />

          {/* Administration */}
          <Route path="/admin/activity-logs" element={<ActivityLogsPage />} />
          <Route path="/admin/textbooks" element={<TextbooksPage />} />
          <Route path="/admin/evaluations" element={<EvaluationsPage />} />
          <Route path="/admin/clubs" element={<AdminClubsPage />} />
          <Route path="/admin/clubs/calendar" element={<AdminClubsCalendarPage />} />
          <Route path="/admin/clubs-room-requests" element={<AdminClubsRoomRequestsPage />} />
          <Route path="/admin/club-finance" element={<AdminClubFinancePage />} />
          <Route path="/admin/tafem" element={<AdminTafem />} />
          <Route path="/admin/mobility" element={<AdminMobility />} />
          <Route path="/admin/jury-pfe" element={<AdminJuryPFE />} />
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
          <Route path="/admin/schedules" element={<SchedulesEnginePage />} />
          <Route path="/admin/timetable/calendar" element={<InteractiveCalendarPage />} />
          <Route path="/admin/schedules/create" element={<CreateSchedulePage />} />
          <Route path="/admin/reservations" element={<ReservationsPage />} />
          <Route path="/admin/reservations/create" element={<ReservationCreatePage />} />
          <Route path="/admin/reservations/:id/edit" element={<ReservationEditPage />} />
          <Route path="/admin/students-credits" element={<StudentsCreditsPage />} />
          <Route path="/admin/students-credits/:id/manage" element={<ManageStudentCreditPage />} />
          <Route path="/admin/grades" element={<AdminGradesPage />} />
          <Route path="/admin/grades/edit" element={<AdminGradesEditPage />} />
          <Route path="/admin/absences" element={<AdminAbsencesPage />} />
          <Route path="/admin/students-risk" element={<StudentsRiskPage />} />
          <Route path="/admin/textbooks" element={<AdminTextbooksPage />} />
          <Route path="/admin/requests" element={<AdminRequestsPage />} />
          <Route path="/admin/messages" element={<AdminMessagesPage />} />
          <Route path="/admin/activity-logs" element={<AdminActivityLogsPage />} />
          <Route path="/admin/evaluations" element={<AdminEvaluationsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/finance" element={<AdminFinanceDashboard />} />
          <Route path="/admin/finance-dashboard" element={<AdminFinanceDashboard />} />
          <Route path="/admin/blockchain-diplomas" element={<AdminBlockchainDiplomas />} />
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
          <Route path="/admin/convocations/print-professors" element={<AdminPrintProfessorsConvocationPage />} />
          <Route path="/admin/professor-availability" element={<AdminProfessorAvailabilityPage />} />
          <Route path="/admin/schedule-change-requests" element={<AdminScheduleChangeRequestsPage />} />
          <Route path="/admin/analytics" element={<AdminExamAnalyticsPage />} />
          <Route path="/classroom" element={<ClassroomPage />} />
          <Route path="/classroom/show/:classId/:groupId" element={<ClassroomShowPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
