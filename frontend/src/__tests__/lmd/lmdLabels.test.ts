import { describe, it, expect } from 'vitest'
import { decisionFromScore, decisionLabel, documentStatusLabel, normalizeDecision } from '@shared/lib/lmd'

describe('LMD labels', () => {
  it('maps scores to V / RAT / NV', () => {
    expect(decisionFromScore(10)).toBe('V')
    expect(decisionFromScore(6)).toBe('RAT')
    expect(decisionFromScore(5.9)).toBe('NV')
  })

  it('normalizes R to RAT', () => {
    expect(normalizeDecision('R')).toBe('RAT')
    expect(decisionLabel('RATTRAPAGE')).toBe('RAT')
  })

  it('maps guichet statuses to French', () => {
    expect(documentStatusLabel('pending')).toBe('En attente')
    expect(documentStatusLabel('ready')).toBe('Prêt')
    expect(documentStatusLabel('collected')).toBe('À retirer')
  })
})
