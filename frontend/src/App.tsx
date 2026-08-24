import { Suspense, useEffect } from 'react'
import { useAuthStore } from '@stores/authStore'
import LoadingScreen from '@shared/components/ui/LoadingScreen'
import RootRouter from './app/routes/RootRouter'
import ErrorBoundary from './components/ErrorBoundary'
import I18nRoot from '@shared/components/i18n/I18nRoot'

export default function App() {
  const { fetchUser } = useAuthStore()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <Suspense fallback={<LoadingScreen />}>
      <ErrorBoundary>
        <I18nRoot>
          <RootRouter />
        </I18nRoot>
      </ErrorBoundary>
    </Suspense>
  )
}
