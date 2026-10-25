import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { examsApi } from '@shared/api/exams'
import api from '@shared/lib/api'

const slots: Record<string, number> = { '08:30': 120, '10:45': 90, '14:30': 120, '16:45': 90 }

function PlanningForm({ details }: { details: any }) {
  const exam = details.exam
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ exam_date: String(exam.exam_date || '').slice(0, 10), start_time: String(exam.start_time || '').slice(0, 5), room_id: String(exam.room_id || ''), duration_minutes: Number(exam.duration_minutes || 120) })
  const { data: rooms = [] } = useQuery({ queryKey: ['exam-edit-rooms'], queryFn: async () => (await api.get('/rooms')).data.data || [] })
  const protectedPlan = exam.is_locked || exam.grades_published || details.seatings?.some((seat: any) => seat.sent_at || ['sent', 'present', 'absent', 'late'].includes(seat.status)) || details.surveillances?.some((row: any) => row.sent_at || row.confirmed_at || row.signed_at) || details.incidents?.length > 0
  const save = useMutation({
    mutationFn: () => api.put(`/exam-planning/${exam.id}/planning`, { ...form, room_id: Number(form.room_id), planning_revision: exam.planning_revision }),
    onSuccess: async () => {
      toast.success('Planning enregistré.')
      await queryClient.invalidateQueries({ queryKey: ['admin-exams'] })
      await queryClient.invalidateQueries({ queryKey: ['exam-details', String(exam.id)] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Le planning n’a pas été enregistré.'),
  })
  return <form onSubmit={event => { event.preventDefault(); if (!save.isPending) save.mutate() }} className="rounded-2xl border bg-card p-5 md:p-7 space-y-6">
    <dl className="grid gap-4 sm:grid-cols-3 text-sm">
      <div><dt className="text-muted-foreground">Module</dt><dd className="font-semibold">{exam.module?.name || '—'}</dd></div>
      <div><dt className="text-muted-foreground">Groupe</dt><dd className="font-semibold">{exam.group?.name || '—'}</dd></div>
      <div><dt className="text-muted-foreground">Session</dt><dd className="font-semibold">{exam.exam_session?.name || `Session ${exam.exam_session_id}`}</dd></div>
    </dl>
    {protectedPlan && <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Cette épreuve est déjà diffusée, confirmée, émargée ou verrouillée. Son planning est conservé pour protéger les convocations et les PV.</p>}
    <fieldset disabled={protectedPlan || save.isPending || !exam.planning_revision} className="grid gap-4 sm:grid-cols-2 disabled:opacity-60">
      <div><label htmlFor="exam-date" className="block text-sm font-medium mb-2">Date de l’épreuve</label><input id="exam-date" required type="date" value={form.exam_date} onChange={event => setForm(previous => ({ ...previous, exam_date: event.target.value }))} className="w-full rounded-lg border bg-background p-3" /></div>
      <div><label htmlFor="exam-slot" className="block text-sm font-medium mb-2">Créneau</label><select id="exam-slot" value={form.start_time} onChange={event => setForm(previous => ({ ...previous, start_time: event.target.value, duration_minutes: slots[event.target.value] || previous.duration_minutes }))} className="w-full rounded-lg border bg-background p-3">
        {!slots[form.start_time] && <option value={form.start_time}>{form.start_time} — créneau existant</option>}
        {Object.entries(slots).map(([time, duration]) => <option key={time} value={time}>{time} · {duration} min</option>)}
      </select></div>
      <div><label htmlFor="exam-room" className="block text-sm font-medium mb-2">Salle</label><select id="exam-room" required value={form.room_id} onChange={event => setForm(previous => ({ ...previous, room_id: event.target.value }))} className="w-full rounded-lg border bg-background p-3">
        <option value="">Choisir une salle</option>
        {!rooms.some((room: any) => String(room.id) === form.room_id) && exam.room && <option value={exam.room_id}>{exam.room.name}</option>}
        {rooms.map((room: any) => <option key={room.id} value={room.id}>{room.name}</option>)}
      </select></div>
      <p className="self-end rounded-lg bg-muted p-3 text-sm">Durée : {form.duration_minutes} min. Les durées des créneaux officiels sont contrôlées par le serveur.</p>
      <button type="submit" disabled={save.isPending} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">{save.isPending ? 'Enregistrement…' : 'Enregistrer le planning'}</button>
    </fieldset>
    <Link to={`/admin/convocations?session_id=${exam.exam_session_id}`} className="inline-block text-sm text-primary underline">Gérer les affectations de surveillance et les convocations</Link>
  </form>
}

export default function AdminExamEditPage() {
  const { id } = useParams()
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['exam-details', id], queryFn: () => examsApi.getExamDetails(Number(id)), enabled: !!id })
  return <main className="mx-auto max-w-5xl space-y-5 p-4 md:p-8 pb-24">
    <Link to="/admin/exams" className="text-sm text-primary underline">Retour au planning des examens</Link>
    <h1 className="text-2xl font-bold">Modifier le planning de l’épreuve</h1>
    {isPending && <p role="status">Chargement de l’épreuve…</p>}
    {isError && <div role="alert">Épreuve indisponible. <button type="button" onClick={() => void refetch()} className="underline">Réessayer</button></div>}
    {data?.exam && <PlanningForm key={`${data.exam.id}:${data.exam.planning_revision}`} details={data} />}
  </main>
}
