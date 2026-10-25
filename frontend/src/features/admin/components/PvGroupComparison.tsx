import { useQuery } from '@tanstack/react-query'
import { Modal } from '@shared/components/ui/Modal'
import api from '@shared/lib/api'
export default function PvGroupComparison({ groups, moduleId, semester, filiere, year, session, onClose }: { groups: any[]; moduleId: string | null; semester: string; filiere: string; year: number; session: string; onClose: () => void }) {
  const query = useQuery({ queryKey: ['pv-group-comparison', groups.map(g => g.id), moduleId, semester, filiere, year, session], queryFn: async ({ signal }) => Promise.all(groups.map(async group => {
    const data = (await api.get(moduleId ? `/modules/${moduleId}/pv` : '/semester-pv', { params: { group_id: group.id, filiere_id: filiere, semester, academic_year_id: year, session }, signal })).data
    const rows = moduleId ? data.data : data.students
    if (!Array.isArray(rows)) throw new Error('Résultats du groupe indisponibles.')
    const scores = rows.map((row: any) => ({ name: `${row.last_name || ''} ${row.first_name || ''}`.trim(), average: moduleId ? row.moyenne_finale : row.moyenne_semestrielle, decision: moduleId ? row.decision_finale : row.decision_global })).filter((row: any) => row.average !== null && row.average !== undefined)
    return { id: group.id, name: group.name, count: rows.length, evaluated: scores.length, average: scores.length ? scores.reduce((sum: number, row: any) => sum + Number(row.average), 0) / scores.length : null, successRate: scores.length ? 100 * scores.filter((row: any) => ['V', 'VAR', 'VPC', 'VC'].includes(row.decision)).length / scores.length : null }
  })), retry: false })
  return <Modal open title="Comparaison des groupes · résultats enregistrés" onClose={onClose} size="lg"><p className="mb-4 text-sm text-muted-foreground">Même année, semestre et session. Les étudiants sans moyenne restent hors du dénominateur du taux.</p>{query.isPending ? <p role="status">Chargement…</p> : query.isError ? <p role="alert">Comparaison indisponible ou groupe non autorisé. <button className="min-h-11 underline" onClick={() => void query.refetch()}>Réessayer</button></p> : <ul className="space-y-3">{query.data?.map(group => <li key={group.id} className="rounded-xl border p-4"><strong>{group.name}</strong><p className="mt-2 text-sm">{group.evaluated}/{group.count} moyennes disponibles · Réussite : {group.successRate === null ? 'Indisponible' : `${group.successRate.toFixed(1)} %`} · Moyenne : {group.average === null ? 'Indisponible' : group.average.toFixed(2)}</p></li>)}</ul>}</Modal>
}
