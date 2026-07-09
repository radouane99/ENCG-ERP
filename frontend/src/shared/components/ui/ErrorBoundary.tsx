import React, { Component, type ErrorInfo, type ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// ErrorBoundary.tsx
//
// [FE-02] Global React ErrorBoundary component.
//
// Catches any runtime error thrown inside the React tree and shows
// a polished fallback UI instead of a blank crash screen.
//
// Usage:
//   <ErrorBoundary>
//     <App />
//   </ErrorBoundary>
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback UI (replaces the default crash screen) */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group('[ErrorBoundary] Caught runtime error');
      console.error(error);
      console.error(errorInfo.componentStack);
      console.groupEnd();
    }

    // TODO: Replace with a real error monitoring service (e.g., Sentry)
    // captureException(error, { extra: errorInfo });
  }

  private handleReload = (): void => {
    window.location.href = '/';
  };

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Allow custom fallback
    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: '#0f172a',
          color: '#f1f5f9',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            fontSize: '2rem',
          }}
        >
          ⚠️
        </div>

        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            color: '#f8fafc',
          }}
        >
          Une erreur inattendue est survenue
        </h1>

        <p style={{ color: '#94a3b8', marginBottom: '2rem', textAlign: 'center', maxWidth: 480 }}>
          L'application a rencontré une erreur critique. Vous pouvez essayer de
          recharger la page ou de revenir à l'accueil.
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(99, 102, 241, 0.5)',
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#a5b4fc',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            Réessayer
          </button>
          <button
            onClick={this.handleReload}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#6366f1',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            Retour à l'accueil
          </button>
        </div>

        {/* Technical details — only shown in dev */}
        {import.meta.env.DEV && this.state.error && (
          <details
            style={{
              maxWidth: 640,
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              padding: '1rem',
            }}
          >
            <summary
              style={{ cursor: 'pointer', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}
            >
              Détails techniques (développement uniquement)
            </summary>
            <pre
              style={{
                fontSize: '0.75rem',
                color: '#fca5a5',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                marginTop: '0.5rem',
              }}
            >
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
          </details>
        )}
      </div>
    );
  }
}

export default ErrorBoundary;
