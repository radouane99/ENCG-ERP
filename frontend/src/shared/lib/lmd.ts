export const ELIMINATORY_THRESHOLD = 6.0
export const VALIDATION_THRESHOLD = 10.0

export type LmdDecision = 'V' | 'RAT' | 'NV'

export function decisionFromScore(score: number | null | undefined): LmdDecision | null {
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return null
  }
  const value = Number(score)
  if (value >= VALIDATION_THRESHOLD) return 'V'
  if (value >= ELIMINATORY_THRESHOLD) return 'RAT'
  return 'NV'
}

export function normalizeDecision(raw: string | null | undefined, score?: number | null): LmdDecision | string {
  const code = (raw || '').toUpperCase().trim()
  if (code === 'R' || code === 'RATTRAPAGE') return 'RAT'
  if (code === 'VALIDE' || code === 'VALIDÉ' || code === 'VAR' || code === 'VPC' || code === 'VC') return code === 'VAR' || code === 'VPC' || code === 'VC' ? code : 'V'
  if (code === 'V' || code === 'RAT' || code === 'NV') return code
  const fromScore = decisionFromScore(score ?? null)
  return fromScore ?? (code || 'NV')
}

export function decisionLabel(decision: string): string {
  const code = normalizeDecision(decision)
  if (code === 'V' || code === 'VAR' || code === 'VPC' || code === 'VC') return 'V'
  if (code === 'RAT') return 'RAT'
  if (code === 'NV') return 'NV'
  return String(code)
}

export function documentStatusLabel(status: string | null | undefined): string {
  switch ((status || '').toLowerCase()) {
    case 'pending':
    case 'processing':
      return 'En attente'
    case 'ready':
    case 'approved':
      return 'Prêt'
    case 'collected':
    case 'withdrawn':
      return 'À retirer'
    case 'rejected':
      return 'Refusé'
    default:
      return status || '—'
  }
}
