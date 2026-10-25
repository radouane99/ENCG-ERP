import { expect, test } from 'vitest'
import { assignmentSuggestions } from './assignmentSuggestions'
test('proposals use actual declared loads and never cross curriculum groups', () => {
  const professors = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
  const modules = [{ id: 10, name: 'M', filiere_id: 1, semester_number: 1, credit_hours: 18 }]
  const groups = [{ id: 1, name: 'G1', filiere_id: 1, semester_number: 1 }, { id: 2, filiere_id: 2, semester_number: 1 }]
  const result = assignmentSuggestions(professors, modules, groups, [{ professor_id: 1, module_id: 20, group_id: 1, assigned_hours: 90 }])
  expect(result).toHaveLength(1); expect(result[0]).toMatchObject({ prof_id: 2, group_id: 1, assigned_hours: 18 }); expect(result[0]).not.toHaveProperty('match_score')
  expect(assignmentSuggestions(professors, modules, groups, [{ professor_id: 1, assigned_hours: null }, { professor_id: 2, assigned_hours: null }])).toEqual([])
})
