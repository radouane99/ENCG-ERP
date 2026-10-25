import { useState, type FormEvent } from 'react'
import { Modal } from '@shared/components/ui/Modal'
import api from '@shared/lib/api'
import { type PvContext, usePvWorkflow } from '../api/usePvWorkflow'

export default function PvMeetingForm({ context, onClose }: { context: PvContext; onClose: () => void }) {
  const query = usePvWorkflow(context, true); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [result, setResult] = useState('')
  const input = 'mt-1 min-h-11 w-full rounded-lg border border-border bg-background p-3'
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError('')
    try { const response = await api.post('/academic/pv-workflow/meeting', { ...context, starts_at: new Date(String(form.get('starts_at'))).toISOString(), duration_minutes: Number(form.get('duration')), room_id: Number(form.get('room')), president_id: Number(form.get('president')), member_ids: form.getAll('members').map(Number), version: query.data?.meeting?.version ?? 0 }); await query.refetch(); setResult(`Réunion enregistrée. ${response.data.notifications_portal} notification(s) dans les espaces des membres.`) }
    catch (err: any) { setError(err.response?.data?.message || 'Enregistrement impossible.'); if (err.response?.status === 409) void query.refetch() } finally { setBusy(false) }
  }
  return <Modal open title="Planifier le jury" onClose={() => !busy && onClose()} size="lg" preventBackdropClose={busy}><form className="space-y-4" onSubmit={event => void submit(event)}>
    {query.data?.meeting && <p className="rounded-lg bg-muted p-3 text-sm">Réunion enregistrée : {new Date(query.data.meeting.starts_at).toLocaleString('fr-FR')} — version {query.data.meeting.version}</p>}
    {(error || query.isError) && <p role="alert" className="text-sm text-red-700">{error || 'Impossible de charger les salles et les membres.'}</p>}{result && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{result}</p>}
    <fieldset disabled={busy || !query.data || !!result || !!query.data.deliberation?.is_sealed} className="grid gap-4 sm:grid-cols-2"><label>Date et heure<input required name="starts_at" type="datetime-local" className={input}/></label><label>Durée (minutes)<input required name="duration" type="number" min={30} max={480} defaultValue={120} className={input}/></label><label>Salle<select required name="room" className={input}><option value="">Choisir une salle</option>{query.data?.rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label><label>Président<select required name="president" className={input}><option value="">Choisir le président</option>{query.data?.agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label><label className="sm:col-span-2">Autres membres<select multiple name="members" className={input}>{query.data?.agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select><span className="text-xs text-muted-foreground">Choisissez les membres dans les comptes habilités de l’établissement.</span></label><button className="min-h-11 rounded-lg bg-secondary px-4 text-white disabled:opacity-50">{busy ? 'Enregistrement…' : 'Enregistrer la réunion'}</button></fieldset>
  </form></Modal>
}
