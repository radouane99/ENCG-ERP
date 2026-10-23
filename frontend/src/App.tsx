import { Suspense,useEffect } from 'react'
import { useAuthStore } from '@stores/authStore'
import LoadingScreen from '@shared/components/ui/LoadingScreen'
import RootRouter from './app/routes/RootRouter'
import ErrorBoundary from './components/ErrorBoundary'
import I18nRoot from '@shared/components/i18n/I18nRoot'

export default function App() {
  const { fetchUser, sessionError, isAuthenticated } = useAuthStore()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  if (sessionError && !isAuthenticated) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><section role="alert" className="max-w-lg rounded-2xl border bg-white p-8 text-slate-900"><h1 className="text-xl font-bold">Connexion momentanément indisponible</h1><p className="mt-4 text-sm">{sessionError}</p><button className="mt-5 min-h-11 rounded-lg bg-blue-900 px-5 text-white" onClick={() => void fetchUser()}>Réessayer</button></section></main>

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
