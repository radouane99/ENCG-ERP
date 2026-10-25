import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { workflowBase } from '../model/workflow'
import { errorMessage } from '../api/workflow'

interface Ticket { id: number; application_id: number; number: number; desk: string; status: string; version: number; served_by: number | null; agent: string | null; first_name: string; last_name: string; cne: string }
interface DeskResponse { tickets: { data: Ticket[]; last_page: number }; counts: Record<string, number>; current_user_id: number; can_release_other?: boolean }
const labels: Record<string, string> = { waiting: 'En attente', serving: 'En cours', done: 'Passage terminé', cancelled: 'Annulé' }
export default function AdmissionDeskQueue({ campaignId, onOpen }: { campaignId: number; onOpen: (id: number) => void }) {
  const [recovery, setRecovery] = useState<Ticket | null>(null); const [reason, setReason] = useState('')
  const [page, setPage] = useState(1); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const cache = useQueryClient()
  const query = useQuery({ queryKey: ['admission-desk', campaignId, page], refetchInterval: 15000, queryFn: async ({ signal }) => {
    const data = (await api.get<DeskResponse>(`${workflowBase}/operations/desk`, { params: { campaign_id: campaignId, page }, signal })).data
    if (!Array.isArray(data.tickets?.data) || !data.counts || !data.current_user_id) throw new Error('File indisponible. Actualisez le suivi du guichet.')
    return data
  } })
  async function act(ticket: Ticket, event: string) {
    setBusy(true); setError('')
    try { await api.post(`${workflowBase}/operations/desk/${ticket.id}`, { event, version: ticket.version, reason: reason || null }); setRecovery(null); setReason(''); await Promise.all([query.refetch(), cache.invalidateQueries({ queryKey: ['admission-operations'] })]) }
    catch (err) { setError(errorMessage(err)); void query.refetch() } finally { setBusy(false) }
  }
  const button = 'min-h-11 rounded-lg border border-border px-3 py-2 text-sm font-semibold disabled:opacity-50'
  return <section className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">File du guichet · aujourd’hui</h2><p className="mt-1 text-sm text-muted-foreground">Enregistrez l’arrivée depuis le dossier. Un agent traite un seul passage à la fois.</p></div><button className={button} onClick={() => void query.refetch()}>Actualiser la file</button></div>
    <div className="my-4 flex flex-wrap gap-2">{['waiting', 'serving', 'done'].map(status => <span key={status} className="rounded-full bg-muted px-3 py-2 text-sm">{labels[status]} : {query.data?.counts[status] ?? 0}</span>)}</div>
    {(error || query.isError) && <p role="alert" className="my-3 rounded-lg bg-red-50 p-3 text-red-800">{error || errorMessage(query.error)}</p>}
    {query.isLoading && <p role="status">Chargement de la file…</p>}
    {query.data?.tickets.data.length === 0 && <p className="py-4 text-sm text-muted-foreground">Aucune arrivée enregistrée aujourd’hui.</p>}
    {recovery && <form className="my-4 rounded-xl border border-amber-300 p-4" onSubmit={e => { e.preventDefault(); void act(recovery, 'release') }}><label className="block text-sm">Motif de reprise du passage #{recovery.number}<textarea required minLength={10} maxLength={500} className="mt-2 min-h-20 w-full border border-border bg-background p-3 rounded-[var(--control-radius)]" value={reason} onChange={e => setReason(e.target.value)}/></label><div className="mt-3 flex gap-3"><button disabled={busy} className={button}>Confirmer la libération</button><button type="button" className={button} onClick={() => setRecovery(null)}>Annuler</button></div></form>}
    <ol className="space-y-3">{query.data?.tickets.data.map(ticket => <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"><div className="flex items-center gap-3"><strong className="rounded-xl bg-primary/5 px-4 py-3 text-xl text-primary">#{String(ticket.number).padStart(3, '0')}</strong><div><button className="min-h-11 text-start font-semibold underline" onClick={() => onOpen(ticket.application_id)}>{ticket.last_name} {ticket.first_name}</button><p className="text-sm text-muted-foreground">{ticket.cne} · {ticket.desk} · {labels[ticket.status]}{ticket.agent && ` · ${ticket.agent}`}</p></div></div><div className="flex flex-wrap gap-2">{ticket.status === 'waiting' && <><button disabled={busy} className={button} onClick={() => void act(ticket, 'claim')}>Appeler et prendre en charge</button><button disabled={busy} className={button} onClick={() => void act(ticket, 'cancel')}>Annuler le passage</button></>}{ticket.status === 'serving' && ticket.served_by === query.data?.current_user_id && <><button disabled={busy} className={button} onClick={() => void act(ticket, 'release')}>Libérer le dossier</button><button disabled={busy} className={button} onClick={() => void act(ticket, 'complete')}>Clôturer le passage</button></>}{ticket.status === 'serving' && ticket.served_by !== query.data?.current_user_id && query.data?.can_release_other && <button disabled={busy} className={button} onClick={() => { setRecovery(ticket); setReason('') }}>Libérer en tant que responsable</button>}</div></li>)}</ol>
    <div className="mt-4 flex gap-3"><button className={button} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</button><span className="py-3 text-sm">Page {page}</span><button className={button} disabled={!query.data || page >= query.data.tickets.last_page} onClick={() => setPage(p => p + 1)}>Suivant</button></div><p className="mt-3 text-xs text-muted-foreground">Clôturer le passage ne valide pas l’inscription : la décision et le contrôle physique restent dans le dossier.</p>
  </section>
}
