import { Suspense, useEffect } from 'react'
import { useAuthStore } from '@stores/authStore'
import LoadingScreen from '@shared/components/ui/LoadingScreen'
import RootRouter from './app/routes/RootRouter'
import { GlobalErrorBoundary } from '@shared/components/GlobalErrorBoundary'

/**
 * App.tsx - Root Application Entry Point
 * Extremely thin component: Only responsible for rendering global providers
 * and the Root Router which handles all lazy-loaded route boundaries.
 */
export default function App() {
  const { fetchUser } = useAuthStore()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <Suspense fallback={<LoadingScreen />}>
      {/* 
        In a real scenario, Global Context Providers (QueryClient, Toaster, AuthProvider) 
        would wrap the RootRouter here. For now, we keep it minimal.
      */}
      <GlobalErrorBoundary>
        <RootRouter />
      </GlobalErrorBoundary>
    </Suspense>
  )
}
