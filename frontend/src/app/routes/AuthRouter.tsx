import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { useAuthStore } from '@stores/authStore';
import AuthLayout from '@shared/components/layout/AuthLayout';
import LoadingScreen from '@shared/components/ui/LoadingScreen';

const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'))
const TwoFactorPage = lazy(() => import('@features/auth/pages/TwoFactorPage'))
const ForgotPasswordPage = lazy(() => import('@features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@features/auth/pages/ResetPasswordPage'))

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function AuthRouter() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="login" element={<RequireGuest><LoginPage /></RequireGuest>} />
        <Route path="two-factor" element={<RequireGuest><TwoFactorPage /></RequireGuest>} />
        <Route path="forgot-password" element={<RequireGuest><ForgotPasswordPage /></RequireGuest>} />
        <Route path="reset-password" element={<RequireGuest><ResetPasswordPage /></RequireGuest>} />
      </Route>
    </Routes>
  );
}
