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

  const isStudent = user.roles?.some((r: any) => r.name === 'student');
  const isProfessor = user.roles?.some((r: any) => r.name === 'professor' || r.name === 'vacataire');
  const isAdmin = user.roles?.some((r: any) => r.name === 'admin');
  const isDirector = user.roles?.some((r: any) => r.name === 'director');

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
