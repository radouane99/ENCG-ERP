/**
 * <LoadingScreen> — Full-page loading splash
 * Used by Suspense boundaries during lazy-loaded route transitions.
 */
import { Spinner } from './Spinner'

export function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-[hsl(var(--background))] z-50"
      role="status"
      aria-label="Chargement de l'application ENCG ERP"
    >
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        {/* Logo mark — colored ring */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-xl tracking-tight">E</span>
          </div>
          <div className="absolute -inset-1 rounded-2xl border-2 border-[hsl(var(--color-primary)/0.3)] animate-pulse" />
        </div>

        <Spinner size="lg" label="Chargement en cours..." />

        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-[hsl(var(--foreground))] tracking-[-0.02em]">
            ENCG ERP
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Chargement en cours…
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
