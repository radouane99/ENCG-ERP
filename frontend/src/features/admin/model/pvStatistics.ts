export function moduleSuccessRates(modules: any[], students: any[]) {
  return modules.map(module => {
    const results = students.map(student => student.module_grades?.[module.id]).filter(result => result && result.note !== null && result.note !== undefined)
    const passed = results.filter(result => ['V', 'VAR', 'VPC', 'VC'].includes(result.decision)).length
    return { name: module.code || module.name, 'Taux Réussite': results.length ? Math.round(100 * passed / results.length) : null, evaluated: results.length, missing: students.length - results.length }
  })
}
