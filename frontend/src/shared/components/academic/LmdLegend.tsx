import { ELIMINATORY_THRESHOLD, VALIDATION_THRESHOLD } from '@shared/lib/lmd'
import LmdBadge from './LmdBadge'

export default function LmdLegend() {
  return (
    <div data-testid="lmd-legend" className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
      <span>CC / Exam / RAT</span>
      <LmdBadge decision="V" />
      <span>≥ {VALIDATION_THRESHOLD}</span>
      <LmdBadge decision="RAT" />
      <LmdBadge decision="NV" />
      <span>· note &lt; {ELIMINATORY_THRESHOLD}/20 éliminatoire</span>
    </div>
  )
}
