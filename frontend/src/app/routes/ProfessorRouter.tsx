import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

const ProfessorDashboard = lazy(() => import('@features/professor-portal/pages/ProfessorDashboard'))
const ProfessorScanner = lazy(() => import('@features/professor-portal/pages/ProfessorScanner'))
const ProfessorProctoring = lazy(() => import('@features/professor-portal/pages/ProfessorProctoring'))
const ProfessorAvailability = lazy(() => import('@features/professor-portal/pages/ProfessorAvailability'))
const TextbooksPage = lazy(() => import('@features/admin/pages/TextbooksPage'))
const ProfessorInternships = lazy(() => import('@features/internships/ui/pages/ProfessorSupervisionPage'))
const ProfessorAbsences = lazy(() => import('@features/absences/ui/pages/ProfessorAbsencesView'))
const ProfessorCall = lazy(() => import('@features/professor-portal/pages/ProfessorCall'))
const ProfessorClassroom = lazy(() => import('@features/professor-portal/pages/ProfessorClassroom'))
const ProfessorReservations = lazy(() => import('@features/professor-portal/pages/ProfessorReservations'))
const AdminRoomAvailabilityPage = lazy(() => import('@features/admin/pages/AdminRoomAvailabilityPage'))
const ProfessorQCMGenerator = lazy(() => import('@features/professor-portal/pages/ProfessorQCMGenerator'))
const ProfessorAnalytics = lazy(() => import('@features/professor-portal/pages/ProfessorAnalytics'))
const ProfessorSmartGrading = lazy(() => import('@features/professor-portal/pages/ProfessorSmartGrading'))
const ProfessorAiCopilotPage = lazy(() => import('@features/professor-portal/pages/ProfessorAiCopilotPage'))
const AdminGradesPage = lazy(() => import('@features/admin/pages/AdminGradesPage'))
const ProfessorProjectsKanban = lazy(() => import('@features/professor-portal/pages/ProfessorProjectsKanban'))
const ProfessorRecommendationsPage = lazy(() => import('@features/professor-portal/pages/ProfessorRecommendationsPage'))

// 🌟 New Excellence Suite Pages
const ProfessorVoiceTextbook = lazy(() => import('@features/professor-portal/pages/ProfessorVoiceTextbook'))
const ProfessorPfeEvaluationPage = lazy(() => import('@features/professor-portal/pages/ProfessorPfeEvaluationPage'))
const ProfessorDoubleGradingPage = lazy(() => import('@features/professor-portal/pages/ProfessorDoubleGradingPage'))
const ProfessorResearchPage = lazy(() => import('@features/professor-portal/pages/ProfessorResearchPage'))
const ProfessorWorkloadPage = lazy(() => import('@features/professor-portal/pages/ProfessorWorkloadPage'))
const ProfessorDocumentsPage = lazy(() => import('@features/professor-portal/pages/ProfessorDocumentsPage'))

const ProfessorInteractiveCalendar = lazy(() => import('@features/admin/pages/InteractiveCalendarPage'))

import { useReverbNotifications } from '@features/professors/hooks/useReverbNotifications'

export default function ProfessorRouter() {
  useReverbNotifications()

  return (
    <Routes>
      <Route path="schedule" element={<ProfessorInteractiveCalendar />} />
      <Route path="schedules" element={<ProfessorInteractiveCalendar />} />
      <Route path="dashboard" element={<ProfessorDashboard />} />
      <Route path="check-in/scanner" element={<ProfessorScanner />} />
      <Route path="scanner" element={<ProfessorScanner />} />
      <Route path="proctor-convocations" element={<ProfessorProctoring />} />
      <Route path="proctoring" element={<ProfessorProctoring />} />
      <Route path="availability" element={<ProfessorAvailability />} />
      <Route path="textbook" element={<TextbooksPage />} />
      <Route path="voice-textbook" element={<ProfessorVoiceTextbook />} />
      <Route path="internships" element={<ProfessorInternships />} />
      <Route path="absences" element={<ProfessorAbsences />} />
      <Route path="absences/call/:sessionId" element={<ProfessorCall />} />
      <Route path="classroom/:moduleId" element={<ProfessorClassroom />} />
      <Route path="reservations" element={<ProfessorReservations />} />
      <Route path="rooms/availability" element={<AdminRoomAvailabilityPage />} />
      <Route path="qcm-generator" element={<ProfessorQCMGenerator />} />
      <Route path="analytics" element={<ProfessorAnalytics />} />
      <Route path="grading" element={<ProfessorSmartGrading />} />
      <Route path="smart-grading" element={<ProfessorSmartGrading />} />
      <Route path="double-grading" element={<ProfessorDoubleGradingPage />} />
      <Route path="pfe-evaluation" element={<ProfessorPfeEvaluationPage />} />
      <Route path="research" element={<ProfessorResearchPage />} />
      <Route path="workload" element={<ProfessorWorkloadPage />} />
      <Route path="ai-copilot" element={<ProfessorAiCopilotPage />} />
      <Route path="grades" element={<AdminGradesPage />} />
      <Route path="projects-kanban" element={<ProfessorProjectsKanban />} />
      <Route path="recommendations" element={<ProfessorRecommendationsPage />} />
      <Route path="documents" element={<ProfessorDocumentsPage />} />
    </Routes>
  );
}
