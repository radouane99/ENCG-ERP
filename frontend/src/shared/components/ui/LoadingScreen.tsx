/**
 * <LoadingScreen> — Full-page loading splash
 * Used by Suspense boundaries during lazy-loaded route transitions.
 */
import { Spinner } from './Spinner'

export function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-[var(--background)] z-50"
      role="status"
      aria-label="Chargement de l'application ENCG ERP"
    >
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        {/* Logo mark — ENCG Logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 p-3 flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-800">
            <img
              src="/logo-encg.png"
              alt="ENCG ERP Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="absolute -inset-1 rounded-2xl border-2 border-indigo-500/30 dark:border-indigo-400/20 animate-pulse" />
        </div>

        <Spinner size="lg" label="Chargement en cours..." />

        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-[var(--foreground)] tracking-[-0.02em]">
            ENCG ERP
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Chargement en cours…
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
