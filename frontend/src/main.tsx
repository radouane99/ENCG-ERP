import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@shared/lib/queryClient'
import { useAuthStore } from '@stores/authStore'
import { initSentry } from './shared/lib/sentry'
import App from './App'
import { ThemeProvider } from './shared/components/layout/ThemeProvider'
// [FE-02] Use the proper standalone ErrorBoundary component
import { ErrorBoundary } from './shared/components/ui/ErrorBoundary'
import './index.css'
import './app/i18n'

// Register PWA Service Worker
import { registerSW } from 'virtual:pwa-register'
initSentry()
registerSW({ immediate: true })

function AuthenticatedQueryProvider({ children }: { children: React.ReactNode }) {
  const identity = useAuthStore((state) => `${state.user?.institution_id ?? ''}:${state.user?.id ?? 'anonymous'}:${state.activeRole ?? ''}`)
  return <QueryClientProvider key={identity} client={queryClient}>{children}</QueryClientProvider>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthenticatedQueryProvider>
          <ThemeProvider defaultTheme="system" storageKey="encg-ui-theme">
            <App />
          </ThemeProvider>
        </AuthenticatedQueryProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
