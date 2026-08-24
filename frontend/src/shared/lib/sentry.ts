import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

export function initSentry(): void {
  if (!dsn) {
    return
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    sendDefaultPii: false,
  })
}

export function captureException(error: unknown, extra?: Record<string, unknown>): void {
  if (!dsn) {
    return
  }
  Sentry.captureException(error, { extra })
}
