import { Link } from 'react-router-dom'

export interface SemesterReadiness {
  configured: boolean
  modules?: number
  groups?: number
  missing_assignments_count?: number
  operational_rooms?: number
  unavailable_rooms?: number
  issues: string[]
  missing_assignments?: { module_id: number; module_name: string; group_name: string }[]
  professor_loads?: { professor_id: number; name: string; assigned_hours: number; unknown_hours: number; assignments: number }[]
}

export default function SemesterReadinessPanel({ data }: { data: SemesterReadiness }) {
  return (
    <section aria-labelledby="semester-readiness" className="rounded-2xl border border-border bg-card p-5 dark:border-border dark:bg-card space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div><h2 id="semester-readiness" className="text-lg font-bold text-foreground dark:text-white">Préparer le semestre</h2>
          <p className="text-sm text-muted-foreground">Affectations, charges déclarées et salles avant la génération du planning.</p></div>
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <Link to="/admin/professor-assignments" className="rounded-lg border px-3 py-2 text-primary dark:text-indigo-300">Affecter les modules</Link>
          <Link to="/admin/rooms/availability" className="rounded-lg border px-3 py-2 text-primary dark:text-indigo-300">Disponibilité des salles</Link>
        </div>
      </div>
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[['Modules', data.modules], ['Groupes', data.groups], ['Affectations manquantes', data.missing_assignments_count], ['Salles opérationnelles', data.operational_rooms]].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl bg-muted/50 p-3 dark:bg-card"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-2xl font-bold text-foreground dark:text-white">{value ?? '—'}</dd></div>
        ))}
      </dl>
      {data.issues.length > 0 ? <ul className="list-disc pl-5 text-sm text-amber-800 dark:text-amber-300 space-y-1">{data.issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : <p className="text-sm text-emerald-700 dark:text-emerald-300">Les prérequis renseignés sont disponibles. Vérifiez ensuite les créneaux et les confirmations des enseignants.</p>}
      {!!data.missing_assignments?.length && <details className="text-sm"><summary className="cursor-pointer font-semibold">Voir les modules à affecter</summary><ul className="mt-2 space-y-1 text-muted-foreground dark:text-foreground">{data.missing_assignments.map(item => <li key={`${item.module_id}-${item.group_name}`}>{item.module_name} · {item.group_name}</li>)}</ul></details>}
      {!!data.professor_loads?.length && <details className="text-sm"><summary className="cursor-pointer font-semibold">Comparer les charges des enseignants</summary>
        <p className="my-2 text-xs text-muted-foreground">Heures affectées pour cette période. La comparaison ne remplace pas les disponibilités ni les obligations de service individuelles.</p>
        <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b"><th className="py-2">Enseignant</th><th>Heures déclarées</th><th>À compléter</th></tr></thead><tbody>{data.professor_loads.map(load => <tr key={load.professor_id} className="border-b"><td className="py-2">{load.name || `Enseignant #${load.professor_id}`}</td><td>{load.assigned_hours} h</td><td>{load.unknown_hours}</td></tr>)}</tbody></table></div>
      </details>}
    </section>
  )
}
