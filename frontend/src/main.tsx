import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { AxiosError } from 'axios'
import App from './App'
import { ThemeProvider } from './shared/components/layout/ThemeProvider'
// [FE-02] Use the proper standalone ErrorBoundary component
import { ErrorBoundary } from './shared/components/ui/ErrorBoundary'
import './index.css'
import './app/i18n'

// ─────────────────────────────────────────────────────────────────────────────
// React Query client
// [FE-01] Replaced `any` in retry callback with typed AxiosError
// ─────────────────────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount: number, error: unknown) => {
        const status = (error as AxiosError)?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="encg-ui-theme">
            <App />
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
