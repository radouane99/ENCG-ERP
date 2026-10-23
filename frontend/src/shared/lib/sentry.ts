const dsn = import.meta.env.VITE_SENTRY_DSN
let sdk: Promise<typeof import('@sentry/react')> | undefined

function loadSentry() {
  return sdk ??= import('@sentry/react').then(Sentry => {
    Sentry.init({
      dsn,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
      sendDefaultPii: false,
    })
    return Sentry
  })
}

export function initSentry(): void {
  if (!dsn) {
    return
  }

  void loadSentry().catch(() => { /* Telemetry must not prevent startup. */ })
}

export function captureException(error: unknown, extra?: Record<string, unknown>): void {
  if (!dsn) {
    return
  }
  void loadSentry().then(Sentry => Sentry.captureException(error, { extra })).catch(() => {})
}
