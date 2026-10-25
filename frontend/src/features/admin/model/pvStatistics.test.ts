import { expect, test } from 'vitest'
import { moduleSuccessRates } from './pvStatistics'
test('module rates preserve zero grades, compensation and unknown results', () => {
  const rows = [{ module_grades: { 1: { note: 0, decision: 'NV' } } }, { module_grades: { 1: { note: 8, decision: 'VPC' } } }, { module_grades: {} }]
  expect(moduleSuccessRates([{ id: 1, code: 'A' }, { id: 2, code: 'B' }], rows)).toEqual([{ name: 'A', 'Taux Réussite': 50, evaluated: 2, missing: 1 }, { name: 'B', 'Taux Réussite': null, evaluated: 0, missing: 3 }])
})
