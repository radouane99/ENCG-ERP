import { cn } from '@shared/lib/utils'
import { decisionLabel, normalizeDecision } from '@shared/lib/lmd'

export default function LmdBadge({
  decision,
  score,
}: {
  decision?: string | null
  score?: number | null
}) {
  const code = decisionLabel(String(normalizeDecision(decision, score)))
  const isV = code === 'V'
  const isRat = code === 'RAT'

  return (
    <span
      data-testid="lmd-badge"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide px-2.5 py-1 rounded-full',
        isV && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
        isRat && 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
        !isV && !isRat && 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          isV && 'bg-emerald-500',
          isRat && 'bg-amber-500',
          !isV && !isRat && 'bg-rose-500'
        )}
      />
      {code}
    </span>
  )
}
