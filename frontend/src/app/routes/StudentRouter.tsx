import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

const StudentDashboard = lazy(() => import('@features/dashboard/pages/StudentDashboard'))
const StudentGrades = lazy(() => import('@features/student-portal/pages/StudentGrades'))
const StudentExams = lazy(() => import('@features/student-portal/pages/StudentExams'))
const StudentConvocations = lazy(() => import('@features/exams/ui/pages/StudentConvocationsPage'))
const StudentMobility = lazy(() => import('@features/student-portal/pages/StudentMobility'))
const ConvocationPDFView = lazy(() => import('@features/student-portal/pages/ConvocationPDFView'))
const StudentInternships = lazy(() => import('@features/internships/ui/pages/StudentInternshipsPage'))
const StudentEvaluations = lazy(() => import('@features/student-portal/pages/StudentEvaluations'))
const StudentSchedule = lazy(() => import('@features/student-portal/pages/StudentSchedule'))
const TicketsPage = lazy(() => import('@features/support/pages/TicketsPage'))
const StudentPortfolio = lazy(() => import('@features/student-portal/pages/StudentPortfolio'))
const StudentProjectsMarket = lazy(() => import('@features/student-portal/pages/StudentProjectsMarket'))
const StudentClubsHub = lazy(() => import('@features/student-portal/pages/StudentClubsHub'))
const StudentDigitalLibrary = lazy(() => import('@features/student-portal/pages/StudentDigitalLibrary'))
const StudentGamification = lazy(() => import('@features/student-portal/pages/StudentGamification'))
const StudentAbsencesPage = lazy(() => import('@features/absences/ui/pages/StudentAbsencesPage'))

export default function StudentRouter() {
  return (
    <Routes>
      <Route path="dashboard" element={<StudentDashboard />} />
      <Route path="grades" element={<StudentGrades />} />
      <Route path="exams" element={<StudentExams />} />
      <Route path="convocations" element={<StudentConvocations />} />
      <Route path="mobility" element={<StudentMobility />} />
      <Route path="convocations/:id/download" element={<ConvocationPDFView />} />
      <Route path="internships" element={<StudentInternships />} />
      <Route path="evaluations" element={<StudentEvaluations />} />
      <Route path="schedule" element={<StudentSchedule />} />
      <Route path="requests" element={<TicketsPage />} />
      <Route path="portfolio" element={<StudentPortfolio />} />
      <Route path="projects" element={<StudentProjectsMarket />} />
      <Route path="clubs" element={<StudentClubsHub />} />
      <Route path="library" element={<StudentDigitalLibrary />} />
      <Route path="gamification" element={<StudentGamification />} />
      <Route path="absences" element={<StudentAbsencesPage />} />
    </Routes>
  );
}
