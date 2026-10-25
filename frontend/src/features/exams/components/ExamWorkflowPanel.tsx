import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react'
import api from '@shared/lib/api'

interface Readiness {
  exams: number; without_room: number; without_candidates: number; without_proctors: number
  candidates: number; emails_sent: number; attendance_recorded: number
  signed_proctors: number; total_proctors: number; pending_incidents: number; locked_exams: number
  is_active: boolean; is_locked: boolean
}

export default function ExamWorkflowPanel({ sessionId }: { sessionId?: number | null }) {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ['exam-session-readiness', sessionId],
    queryFn: async () => (await api.get<{ data: Readiness }>(`/exam-sessions/${sessionId}/readiness`)).data.data,
    enabled: !!sessionId,
    refetchInterval: 30_000,
  })
  const steps = [
    { label: '1. Ouvrir la session', to: '/exams', detail: data?.is_locked ? 'Verrouillée' : data?.is_active ? 'Ouverte' : 'Inactive', ready: data?.is_active },
    { label: '2. Planifier les épreuves', to: sessionId ? `/admin/exams?session_id=${sessionId}` : '/admin/exams', detail: data ? `${data.exams} épreuves · ${data.without_room} sans salle disponible` : 'Période, salles et groupes', ready: data && data.exams > 0 && data.without_room === 0 },
    { label: '3. Préparer les convocations', to: sessionId ? `/admin/convocations?session_id=${sessionId}` : '/admin/convocations', detail: data ? `${data.without_candidates} sans placement · ${data.without_proctors} sans surveillance` : 'Placement et surveillants', ready: data && data.exams > 0 && data.without_candidates === 0 && data.without_proctors === 0 },
    { label: '4. Superviser en direct', to: sessionId ? `/admin/exams/sessions/${sessionId}/live` : '/admin/exams', detail: data ? `${data.attendance_recorded}/${data.candidates} pointages · ${data.signed_proctors}/${data.total_proctors} visas` : 'Présences, incidents et PV', ready: data && data.candidates > 0 && data.attendance_recorded === data.candidates },
    { label: '5. Instruire les incidents', to: '/discipline', detail: data ? `${data.pending_incidents} dossiers à instruire` : 'Audition puis décision du conseil', ready: data && data.exams > 0 && data.pending_incidents === 0 },
    { label: '6. Délibérer et publier', to: '/admin/grades/pv', detail: 'Noyau de notes, jury et PV', ready: false },
    { label: '7. Traiter les recours', to: '/admin/grade-appeals', detail: 'Après publication des résultats', ready: false },
  ]
  return <section className="rounded-2xl border border-border bg-card p-4 md:p-5 space-y-4" aria-label="Parcours des examens">
    <div className="flex items-start justify-between gap-3">
      <div><h2 className="text-lg font-semibold text-foreground">Parcours de la session</h2><p className="text-sm text-muted-foreground">{sessionId ? 'Contrôles calculés sur la session sélectionnée. Les visas et l’envoi des emails sont suivis séparément.' : 'Sélectionnez une session pour afficher ses contrôles de préparation.'}</p></div>
      {sessionId && <button type="button" aria-label="Actualiser les contrôles de session" disabled={isFetching} onClick={() => void refetch()} className="rounded-lg border p-2 hover:bg-muted disabled:opacity-50"><RefreshCw className="h-4 w-4" /></button>}
    </div>
    {sessionId && isPending && <p role="status" className="text-sm text-muted-foreground">Vérification de la session…</p>}
    {isError && <p role="alert" className="text-sm text-destructive">Contrôles indisponibles. Actualisez avant de poursuivre.</p>}
    <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{steps.map(step => <li key={step.label}><Link to={step.to} className="flex h-full gap-2 rounded-xl border border-border p-3 hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
      {step.ready ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
      <span className="min-w-0"><span className="block text-sm font-medium">{step.label}</span><span className="block text-xs text-muted-foreground mt-1">{step.detail}</span></span>
    </Link></li>)}</ol>
    {data && (data.without_room > 0 || data.without_candidates > 0 || data.without_proctors > 0) && <p className="flex gap-2 text-sm text-amber-700 dark:text-amber-300"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />Complétez les salles, le placement et la surveillance avant diffusion. Un pointage non saisi reste à traiter.</p>}
  </section>
}
