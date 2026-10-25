import React,{ Suspense,lazy } from 'react';
import { useAuthStore } from '@/stores/authStore';
import LoadingScreen from '@/shared/components/ui/LoadingScreen';

const AdminDashboard = lazy(() => import('./AdminDashboard'));
const StudentDashboard = lazy(() => import('./StudentDashboard'));
const ProfessorDashboard = lazy(() => import('@features/professor-portal/pages/ProfessorDashboard'));
const ExecutiveDashboard = lazy(() => import('./ExecutiveDashboard'));
const CandidateDossierPortal = lazy(() => import('@features/public/components/CandidateDossierPortal'));
const OperationalWorkspace = lazy(() => import('../components/OperationalWorkspace'));

const DashboardRouter: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return <LoadingScreen />;

  const roles = (user.roles ?? []).map((r: any) => (typeof r === 'string' ? r : r.name || '').toLowerCase());

  const isAdmin = roles.some(r => ['admin', 'super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'scolarite'].includes(r));
  const isDirector = roles.some(r => ['director', 'directeur'].includes(r));
  const isProfessor = roles.some(r => ['professor', 'professeur', 'vacataire'].includes(r));
  const isEnrolledStudent = !user.admission_pending && roles.some(r => ['student', 'etudiant'].includes(r));

  return (
    <Suspense fallback={<LoadingScreen />}>
      {(isAdmin || isDirector || isProfessor || isEnrolledStudent) && <OperationalWorkspace />}
      {isAdmin ? (
        <AdminDashboard />
      ) : isDirector ? (
        <ExecutiveDashboard />
      ) : isProfessor ? (
        <ProfessorDashboard />
      ) : isEnrolledStudent ? (
        <StudentDashboard />
      ) : (
        <CandidateDossierPortal />
      )}
    </Suspense>
  );
};


export default DashboardRouter;
