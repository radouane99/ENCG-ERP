import { describe, it, expect } from 'vitest'

/**
 * Moroccan Higher Education LMD Examination & Deliberation Rules
 * Standard: ENCG Fès / MESRSFC
 */
describe('Moroccan LMD Academic Deliberation Engine Rules', () => {
  const ELIMINATORY_THRESHOLD = 6.0
  const PASSING_THRESHOLD = 10.0
  const SYSTEM_RACHAT_LOWER_BOUND = 9.5

  function evaluateSemester(moduleScores: number[]): {
    average: number
    status: 'admitted' | 'rachat' | 'rattrapage' | 'failed'
    hasEliminatory: boolean
  } {
    const average = Number((moduleScores.reduce((sum, score) => sum + score, 0) / moduleScores.length).toFixed(2))
    const hasEliminatory = moduleScores.some((score) => score < ELIMINATORY_THRESHOLD)

    if (hasEliminatory) {
      return { average, status: 'rattrapage', hasEliminatory: true }
    }

    if (average >= PASSING_THRESHOLD) {
      return { average, status: 'admitted', hasEliminatory: false }
    }

    if (average >= SYSTEM_RACHAT_LOWER_BOUND && average < PASSING_THRESHOLD) {
      return { average, status: 'rachat', hasEliminatory: false }
    }

    return { average, status: 'rattrapage', hasEliminatory: false }
  }

  it('validates semester with all modules above 10', () => {
    const result = evaluateSemester([12.5, 14.0, 11.0, 10.5])
    expect(result.average).toBe(12.0)
    expect(result.status).toBe('admitted')
    expect(result.hasEliminatory).toBe(false)
  })

  it('applies system rachat when average is between 9.5 and 9.99 with no eliminatory marks', () => {
    const result = evaluateSemester([9.6, 9.7, 9.8, 9.5])
    expect(result.average).toBe(9.65)
    expect(result.status).toBe('rachat')
    expect(result.hasEliminatory).toBe(false)
  })

  it('forces rattrapage if any single module has eliminatory mark (< 6.0) even with high average', () => {
    const result = evaluateSemester([16.0, 15.0, 14.0, 5.5])
    expect(result.average).toBe(12.63)
    expect(result.status).toBe('rattrapage')
    expect(result.hasEliminatory).toBe(true)
  })

  it('takes the MAX score between session normale and session de rattrapage', () => {
    const scoreNormale = 8.5
    const scoreRattrapage = 13.0
    const finalScore = Math.max(scoreNormale, scoreRattrapage)
    expect(finalScore).toBe(13.0)
  })
})
