import { describe, expect, it } from 'vitest'
import { ocrPrefill } from './ocrPrefill'
import type { OcrRun } from './workflow'

const run = { id: 'run', status: 'needs_review', document_id: 1, warnings: [], fields: Object.fromEntries([
  ['first_name_fr', 'Sara'], ['bac_average', 16.5], ['cin', 'AB123456'], ['status', 'approved'], ['bac_type', 'Sciences'],
].map(([key, value]) => [key, { value, conflict: false, requires_confirmation: true }])) } as OcrRun
describe('Document prefill', () => {
  it('fills empty editable fields without replacing typed information or official identifiers', () => {
    expect(ocrPrefill(run, { first_name: 'Salma' })).toEqual({ bac_average: 16.5, bac_series: 'Sciences' })
  })
  it('allows reviewed bulk replacement but never conflicts or administrative values', () => {
    const conflicting = { ...run, fields: { ...run.fields, bac_average: { value: 19, conflict: true, requires_confirmation: true } } }
    expect(ocrPrefill(conflicting, { first_name: 'Salma' }, true)).toEqual({ first_name: 'Sara', bac_series: 'Sciences' })
  })
})
