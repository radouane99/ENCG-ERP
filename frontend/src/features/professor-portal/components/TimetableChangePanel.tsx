import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { Button } from '@shared/components/ui/Button'
import { toast } from 'sonner'

const days = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi']
export default function TimetableChangePanel({ sessions }: { sessions: any[] }) {
  const [open, setOpen] = useState(false)
  const [schedule, setSchedule] = useState('')
  const [error, setError] = useState('')
  const [day, setDay] = useState('1'); const [start, setStart] = useState('08:30'); const [end, setEnd] = useState('10:30'); const [reason, setReason] = useState('')
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['my-timetable-changes'], queryFn: async () => {
    const response = await api.get('/timetable/change-requests')
    if (!Array.isArray(response.data.data)) throw new Error('Suivi indisponible')
    return response.data.data.filter((row: any) => row.request_type === 'timetable_change')
  } })
  const submit = useMutation({ mutationFn: () => api.post('/timetable/change-requests', { schedule_id: Number(schedule), day_of_week: Number(day), start_time: start, end_time: end, reason }),
    onSuccess: () => { toast.success('Demande transmise à la scolarité. Votre planning reste inchangé.'); setReason(''); setOpen(false); void client.invalidateQueries({ queryKey: ['my-timetable-changes'] }) },
    onError: (reason: any) => setError(reason.response?.data?.message || 'Demande non enregistrée.') })
  const inputClass = 'block w-full rounded-[var(--control-radius)] border border-input bg-card p-3 text-sm'
  return <section className="erp-surface space-y-4 p-5" aria-label="Demandes de changement de planning">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Un changement à demander ?</h2><p className="text-sm text-muted-foreground">Le planning est publié par la scolarité. Un changement exige son accord après contrôle des disponibilités et des conflits.</p></div><Button variant="outline" onClick={() => setOpen(value => !value)} disabled={!sessions.length}>Demander un changement</Button></div>
    {open && <form className="grid gap-4 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); if (!submit.isPending) { setError(''); submit.mutate() } }}>
      {error && <p role="alert" className="text-destructive sm:col-span-2">{error}</p>}
      <label className="space-y-1 text-sm font-medium sm:col-span-2">Séance concernée<select required value={schedule} onChange={event => { setSchedule(event.target.value); const row = sessions.find(item => String(item.id) === event.target.value); if (row) { setDay(String(row.day_of_week)); setStart(row.start_time.slice(0,5)); setEnd(row.end_time.slice(0,5)) } }} className={inputClass}><option value="">Choisir une séance publiée</option>{sessions.map(row => <option key={row.id} value={row.id}>{row.module_name} · {row.group_code} · {row.day_name} {row.time}</option>)}</select></label>
      <label className="space-y-1 text-sm font-medium">Jour souhaité<select value={day} onChange={event => setDay(event.target.value)} className={inputClass}>{days.map((name,index) => <option key={name} value={index+1}>{name}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-sm font-medium">Début souhaité<input type="time" required min="08:30" max="18:45" value={start} onChange={event => setStart(event.target.value)} className={inputClass}/></label><label className="space-y-1 text-sm font-medium">Fin souhaitée<input type="time" required min="08:30" max="18:45" value={end} onChange={event => setEnd(event.target.value)} className={inputClass}/></label></div>
      <label className="space-y-1 text-sm font-medium sm:col-span-2">Motif de la demande<textarea required minLength={10} maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} className={inputClass}/></label>
      <p className="text-xs text-muted-foreground sm:col-span-2">La durée et la salle sont conservées. Pour un CM partagé, la demande concerne tous les groupes de la séance.</p><Button type="submit" isLoading={submit.isPending} disabled={!schedule || reason.trim().length < 10}>Transmettre la demande</Button>
    </form>}
    {query.isError && <p role="alert">Suivi des demandes indisponible. <button className="underline" onClick={() => void query.refetch()}>Réessayer</button></p>}
    {query.data?.map((row: any) => <div key={row.id} className="rounded-xl border p-3 text-sm"><p className="font-semibold">{row.module_name} · {row.status === 'pending' ? 'En attente de décision' : row.status === 'approved' ? 'Acceptée et appliquée' : 'Refusée'}</p><p>{row.reason}</p>{row.review_note && <p className="mt-1 text-muted-foreground">Réponse : {row.review_note}</p>}</div>)}
  </section>
}
