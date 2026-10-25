import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { Button } from '@shared/components/ui/Button'
import { Modal } from '@shared/components/ui/Modal'
import { errorMessage } from '@features/admissions/api/workflow'

interface Graduate { id: number; name: string; cne: string; filiere: string | null; academic_year: string | null }
interface Candidate { decision_id: number; name: string; filiere: string; academic_year: string; decision: string }
export default function GraduateRegister() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [candidatePage, setCandidatePage] = useState(1)
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const cache = useQueryClient()
  const candidates = useQuery({ queryKey: ['graduation-candidates', candidatePage], queryFn: async ({ signal }) =>
    (await api.get<{ data: Candidate[]; last_page: number }>('/alumni/graduation-candidates', { params: { page: candidatePage }, signal })).data })
  async function finalize() {
    if (!selected) return
    setBusy(true); setError('')
    try { await api.post('/alumni/graduates/finalize', { decision_id: selected.decision_id }); setSelected(null); await Promise.all([cache.invalidateQueries({ queryKey: ['graduate-register'] }), cache.invalidateQueries({ queryKey: ['graduation-candidates'] }), cache.invalidateQueries({ queryKey: ['admin-reinscription-stats'] }), cache.invalidateQueries({ queryKey: ['student-reinscription-status'] })]) }
    catch (e) { setError(errorMessage(e)) } finally { setBusy(false) }
  }
  const rows = useQuery({ queryKey: ['graduate-register', search, page], queryFn: async ({ signal }) =>
    (await api.get<{ data: Graduate[]; total: number; last_page: number }>('/alumni/graduates', { params: { search, page }, signal })).data })
  return <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
    <details className="mb-5 rounded-xl border border-border bg-muted/30 p-4"><summary className="cursor-pointer font-semibold">Diplomations à finaliser après le jury</summary><p className="my-3 text-sm text-muted-foreground">Parcours en année terminale avec décision annuelle favorable et PV scellé. Vérifiez la formation et la promotion avant de clôturer le cursus.</p>
      {candidates.isPending ? <p role="status">Chargement…</p> : candidates.isError ? <p role="alert">Décisions indisponibles.</p> : <><ul className="divide-y divide-border">{candidates.data.data.map(row => <li key={row.decision_id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{row.name}</p><p className="text-xs text-muted-foreground">{row.filiere} · {row.academic_year} · Jury : {row.decision}</p></div><Button variant="outline" onClick={() => { setSelected(row); setError('') }}>Finaliser la diplomation</Button></li>)}</ul>{!candidates.data.data.length && <p className="text-sm text-muted-foreground">Aucune décision terminale scellée à traiter.</p>}<div className="mt-3 flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={candidatePage <= 1} onClick={() => setCandidatePage(candidatePage - 1)}>Décisions précédentes</Button><Button variant="outline" disabled={candidatePage >= candidates.data.last_page} onClick={() => setCandidatePage(candidatePage + 1)}>Décisions suivantes</Button></div></>}
    </details>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-lg font-semibold">Registre des lauréats</h2><p className="mt-1 text-sm text-muted-foreground">Cursus terminés et enregistrés par la scolarité. L’inscription à l’annuaire ne dépend pas d’un questionnaire professionnel.</p></div>
      <label className="text-sm">Rechercher un lauréat<input className="mt-1 block min-h-11 w-full border border-border bg-background px-3 rounded-[var(--control-radius)]" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Nom, CNE ou numéro étudiant" /></label></div>
    {rows.isPending ? <p role="status" className="py-6">Chargement du registre…</p> : rows.isError ? <div role="alert" className="py-6">Registre indisponible. <Button variant="outline" onClick={() => rows.refetch()}>Réessayer</Button></div> : <>
      <p className="my-4 text-sm text-muted-foreground">{rows.data.total} lauréat(s)</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr>{['Lauréat', 'CNE', 'Formation', 'Dernière année du parcours'].map(label => <th key={label} className="p-3 font-medium">{label}</th>)}</tr></thead><tbody>{rows.data.data.map(row => <tr key={row.id} className="border-b border-border"><td className="p-3 font-medium">{row.name}</td><td className="p-3">{row.cne}</td><td className="p-3">{row.filiere || 'À rapprocher'}</td><td className="p-3">{row.academic_year || 'À rapprocher'}</td></tr>)}</tbody></table></div>
      {!rows.data.data.length && <p className="py-6 text-sm text-muted-foreground">Aucun lauréat correspondant. Un bilan provisoire ne constitue pas une diplomation.</p>}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</Button><span className="text-sm">Page {page} / {Math.max(1, rows.data.last_page)}</span><Button variant="outline" disabled={page >= rows.data.last_page} onClick={() => setPage(page + 1)}>Suivant</Button></div>
    </>}
    <Modal open={!!selected} onClose={() => { if (!busy) setSelected(null) }} title="Confirmer la fin du cursus"><p className="text-sm">{selected?.name} · {selected?.filiere} · {selected?.academic_year}</p><p className="mt-3 text-sm text-muted-foreground">Cette confirmation inscrit l’étudiant au registre des lauréats et clôture son parcours actif. Ses notes et ses inscriptions historiques sont conservées.</p>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-5 flex justify-end gap-3"><Button variant="outline" disabled={busy} onClick={() => setSelected(null)}>Annuler</Button><Button isLoading={busy} onClick={finalize}>Confirmer la diplomation</Button></div></Modal>
  </section>
}
