import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

const ProfessorDashboard = lazy(() => import('@features/professor-portal/pages/ProfessorDashboard'))
const ProfessorScanner = lazy(() => import('@features/professor-portal/pages/ProfessorScanner'))
const ProfessorProctoring = lazy(() => import('@features/professor-portal/pages/ProfessorProctoring'))
const ProfessorAvailability = lazy(() => import('@features/professor-portal/pages/ProfessorAvailability'))
const TextbooksPage = lazy(() => import('@features/admin/pages/TextbooksPage')) // used in professor/textbook
const ProfessorInternships = lazy(() => import('@features/internships/ui/pages/ProfessorSupervisionPage'))
const ProfessorAbsences = lazy(() => import('@features/absences/ui/pages/ProfessorAbsencesView'))
const ProfessorCall = lazy(() => import('@features/professor-portal/pages/ProfessorCall'))
const ProfessorClassroom = lazy(() => import('@features/professor-portal/pages/ProfessorClassroom'))
const ProfessorReservations = lazy(() => import('@features/professor-portal/pages/ProfessorReservations'))
const ProfessorQCMGenerator = lazy(() => import('@features/professor-portal/pages/ProfessorQCMGenerator'))
const ProfessorAnalytics = lazy(() => import('@features/professor-portal/pages/ProfessorAnalytics'))
const ProfessorSmartGrading = lazy(() => import('@features/professor-portal/pages/ProfessorSmartGrading'))
const ProfessorProjectsKanban = lazy(() => import('@features/professor-portal/pages/ProfessorProjectsKanban'))

export default function ProfessorRouter() {
  return (
    <Routes>
      <Route path="dashboard" element={<ProfessorDashboard />} />
      <Route path="check-in/scanner" element={<ProfessorScanner />} />
      <Route path="proctor-convocations" element={<ProfessorProctoring />} />
      <Route path="availability" element={<ProfessorAvailability />} />
      <Route path="textbook" element={<TextbooksPage />} />
      <Route path="internships" element={<ProfessorInternships />} />
      <Route path="absences" element={<ProfessorAbsences />} />
      <Route path="absences/call/:sessionId" element={<ProfessorCall />} />
      <Route path="classroom/:moduleId" element={<ProfessorClassroom />} />
      <Route path="reservations" element={<ProfessorReservations />} />
      <Route path="qcm-generator" element={<ProfessorQCMGenerator />} />
      <Route path="analytics" element={<ProfessorAnalytics />} />
      <Route path="grading" element={<ProfessorSmartGrading />} />
      <Route path="projects-kanban" element={<ProfessorProjectsKanban />} />
    </Routes>
  );
}
