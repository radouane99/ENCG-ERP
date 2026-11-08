import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearOfflineExamVault,
  loadConvocationsFromOfflineVault,
  saveConvocationsToOfflineVault,
} from './offlineExamVault'

describe('offlineExamVault', () => {
  beforeEach(() => {
    clearOfflineExamVault()
  })

  it('persists exam convocations with deterministic QR seals for 100% offline access', () => {
    const sample = [
      {
        id: 42,
        code: 'GFC-S4-01',
        module: 'Comptabilité Analytique Approfondie',
        date: '15/06/2026',
        time: '08:30',
        duration: '2h00',
        room: 'Amphi A',
        seat: 'Place #018',
      },
    ]

    const saved = saveConvocationsToOfflineVault(sample)
    expect(saved.records).toHaveLength(1)
    expect(saved.records[0].qrSeal).toMatch(/^CONV-ENCG-42-[0-9A-F]{8}$/)

    const loaded = loadConvocationsFromOfflineVault()
    expect(loaded).not.toBeNull()
    expect(loaded?.records[0].module).toBe('Comptabilité Analytique Approfondie')
    expect(loaded?.records[0].room).toBe('Amphi A')
    expect(loaded?.records[0].qrSeal).toBe(saved.records[0].qrSeal)
  })

  it('returns null when vault is empty or cleared', () => {
    expect(loadConvocationsFromOfflineVault()).toBeNull()
  })
})

