interface Entity { id: string | number; [key: string]: any }
/** Proposals use declared hours only; availability and specialty need human confirmation. */
export function assignmentSuggestions(professors: Entity[], modules: Entity[], groups: Entity[], assignments: any[]) {
  const proposed = new Set(assignments.map(a => `${a.module_id}-${a.group_id}`)); const results: any[] = []
  const loads = professors.map(professor => {
    const rows = assignments.filter(a => String(a.professor_id ?? a.prof_id) === String(professor.id))
    return { professor, hours: rows.some(a => !Number.isFinite(Number(a.assigned_hours)) || a.assigned_hours === null) ? null : rows.reduce((sum, a) => sum + Number(a.assigned_hours), 0) }
  })
  for (const module of modules) for (const group of groups) {
    if (results.length >= 4 || String(module.filiere_id) !== String(group.filiere_id) || Number(module.semester_number) !== Number(group.semester_number) || proposed.has(`${module.id}-${group.id}`)) continue
    const candidates = loads.filter(p => p.professor.is_active !== false && p.hours !== null && (!module.department_id || String(p.professor.department_id) === String(module.department_id))).sort((a, b) => a.hours! - b.hours! || String(a.professor.id).localeCompare(String(b.professor.id)))
    const best = candidates[0]; if (!best) continue
    const hours = Number(module.credit_hours)
    if (!Number.isFinite(hours) || hours <= 0) continue
    results.push({ prof_id: best.professor.id, prof_name: best.professor.name || best.professor.user?.name || `${best.professor.first_name || ''} ${best.professor.last_name || ''}`.trim() || `Enseignant ${best.professor.id}`, module_id: module.id, module_name: `${module.code || ''} ${module.name}`, group_id: group.id, group_name: group.name, assigned_hours: hours, session_type: 'cm', reason: `Charge déclarée : ${best.hours} h ; volume du module : ${hours} h. Spécialité, répartition CM/TD/TP et disponibilités à confirmer avant affectation.` })
    best.hours! += hours; proposed.add(`${module.id}-${group.id}`)
  }
  return results
}
