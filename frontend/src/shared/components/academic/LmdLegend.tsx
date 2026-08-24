import { ELIMINATORY_THRESHOLD, VALIDATION_THRESHOLD } from '@shared/lib/lmd'

export default function LmdLegend() {
  return (
    <p data-testid="lmd-legend" className="text-xs text-slate-500 font-medium">
      CC / Exam / RAT — décision : <strong>V</strong> (≥ {VALIDATION_THRESHOLD}) · <strong>RAT</strong> · <strong>NV</strong>
      {' '}· note &lt; {ELIMINATORY_THRESHOLD}/20 éliminatoire
    </p>
  )
}
