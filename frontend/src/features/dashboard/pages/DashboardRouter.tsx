import React, { Suspense, lazy } from 'react';
import { useAuthStore } from '@/stores/authStore';
import LoadingScreen from '@/shared/components/ui/LoadingScreen';

const AdminDashboard = lazy(() => import('./AdminDashboard'));
const StudentDashboard = lazy(() => import('./StudentDashboard'));
const ProfessorDashboard = lazy(() => import('./ProfessorDashboard'));
const ExecutiveDashboard = lazy(() => import('./ExecutiveDashboard'));

const DashboardRouter: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return <LoadingScreen />;

  const hasRole = (name: string) =>
    user.roles?.some((r: any) => (typeof r === 'string' ? r === name : r.name === name));

  const isStudent = hasRole('student');
  const isProfessor = hasRole('professor') || hasRole('vacataire');
  const isAdmin = hasRole('admin');
  const isDirector = hasRole('director');

  return (
    <Suspense fallback={<LoadingScreen />}>
      {isStudent ? (
        <StudentDashboard />
      ) : isProfessor ? (
        <ProfessorDashboard />
      ) : isDirector ? (
        <ExecutiveDashboard />
      ) : (
        <AdminDashboard />
      )}
    </Suspense>
  );
};

export default DashboardRouter;
