export interface OfflineConvocationRecord {
  id: number
  code: string
  module: string
  date: string
  time: string
  duration?: string
  room: string
  seat: string
  qrSeal: string
  cachedAt: string
}

export interface OfflineExamVaultPayload {
  version: 1
  updatedAt: string
  records: OfflineConvocationRecord[]
}

const VAULT_STORAGE_KEY = 'encg_offline_exam_vault_v1'

function computeDeterministicQrSeal(conv: Partial<OfflineConvocationRecord>): string {
  const raw = `${conv.id ?? 0}|${conv.code ?? 'MOD'}|${conv.date ?? ''}|${conv.room ?? ''}|${conv.seat ?? ''}`
  let hash = 2166136261
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0')
  return `CONV-ENCG-${conv.id ?? 0}-${hex}`
}

export function saveConvocationsToOfflineVault(convocations: any[]): OfflineExamVaultPayload {
  const nowIso = new Date().toISOString()
  const records: OfflineConvocationRecord[] = (convocations ?? []).map((conv) => ({
    id: Number(conv.id ?? 0),
    code: String(conv.code ?? 'ENCG-EX'),
    module: String(conv.module ?? 'Module'),
    date: String(conv.date ?? ''),
    time: String(conv.time ?? ''),
    duration: conv.duration ? String(conv.duration) : '1h30',
    room: String(conv.room ?? 'Amphi'),
    seat: String(conv.seat ?? 'Place assignée'),
    qrSeal: String(conv.qrSeal || computeDeterministicQrSeal(conv)),
    cachedAt: nowIso,
  }))

  const payload: OfflineExamVaultPayload = {
    version: 1,
    updatedAt: nowIso,
    records,
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(payload))
    }
  } catch {
    // Ignore storage quota errors in restricted browsing modes
  }

  return payload
}

export function loadConvocationsFromOfflineVault(): OfflineExamVaultPayload | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null
    }
    const raw = window.localStorage.getItem(VAULT_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as OfflineExamVaultPayload
    if (!parsed || !Array.isArray(parsed.records)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearOfflineExamVault(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(VAULT_STORAGE_KEY)
    }
  } catch {
    // Ignore
  }
}

