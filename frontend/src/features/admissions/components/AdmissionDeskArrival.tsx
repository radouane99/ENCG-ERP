import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAdmissionOperations } from '../api/operations'
import api from '@shared/lib/api'
import { errorMessage } from '../api/workflow'
import { workflowBase } from '../model/workflow'

export default function AdmissionDeskArrival({ applicationId }: { applicationId: number }) {
  const query = useAdmissionOperations(applicationId); const cache = useQueryClient(); const [desk, setDesk] = useState('Guichet scolarité'); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const ticket = query.data?.desk_ticket
  return <section className="rounded-xl border border-border p-4"><h3 className="font-semibold">Arrivée au guichet</h3>{ticket ? <p role="status" className="mt-3 text-sm">Passage #{String(ticket.number).padStart(3, '0')} · {ticket.desk} · {{ waiting: 'En attente', serving: 'En cours', done: 'Terminé', cancelled: 'Annulé' }[ticket.status]}</p> : <form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); setBusy(true); setError(''); void api.post(`${workflowBase}/operations/desk`, { application_id: applicationId, desk }).then(() => Promise.all([query.refetch(), cache.invalidateQueries({ queryKey: ['admission-desk'] })])).catch(err => setError(errorMessage(err))).finally(() => setBusy(false)) }}><label className="flex-1 text-sm">Guichet<input required maxLength={80} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background p-3" value={desk} onChange={e => setDesk(e.target.value)}/></label><button disabled={busy || !query.data} className="min-h-11 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Confirmer la présence et attribuer un numéro</button></form>}{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</section>
}
