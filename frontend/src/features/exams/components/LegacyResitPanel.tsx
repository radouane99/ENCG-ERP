import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { toast } from 'sonner'

interface LegacyResit { id: number; student_name: string; cne: string; module_name: string; reason: string; status: string; created_at: string }

export default function LegacyResitPanel({ onReconciled }: { onReconciled: () => void }) {
  const queryClient = useQueryClient()
  const [year, setYear] = useState('')
  const [reason, setReason] = useState('')
  const { data, isError } = useQuery({ queryKey: ['legacy-resit-years'], queryFn: async () => (await api.get<{ data: LegacyResit[]; count: number }>('/retakes/legacy')).data })
  const { data: years = [] } = useQuery({ queryKey: ['academic-years'], queryFn: async () => (await api.get('/academic-years')).data.data || [] })
  const reconcile = useMutation({
    mutationFn: (id: number) => api.patch(`/retakes/${id}/year`, { academic_year_id: Number(year), reason }),
    onSuccess: async () => {
      toast.success('Année rattachée. La décision existante est conservée.')
      setYear(''); setReason('')
      await queryClient.invalidateQueries({ queryKey: ['legacy-resit-years'] })
      onReconciled()
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Rattachement refusé; dossier conservé.'),
  })
  if (isError) return <p role="alert" className="rounded-xl border p-3 text-sm text-destructive">Vérification des anciens droits de rattrapage indisponible.</p>
  if (!data?.count) return null
  return <details className="rounded-2xl border border-amber-300 bg-amber-50/40 p-4 space-y-4">
    <summary className="cursor-pointer font-semibold text-amber-900">{data.count} ancien(s) droit(s) de rattrapage sans année — à réconcilier</summary>
    <p className="text-sm text-muted-foreground">Ces droits sont conservés et exclus des convocations tant que leur année n’est pas confirmée. Aucun rattachement automatique à l’année courante.</p>
    <div className="grid gap-3 md:grid-cols-2">
      <div><label htmlFor="legacy-resit-year" className="block text-sm font-medium mb-1">Année confirmée par le dossier</label><select id="legacy-resit-year" value={year} onChange={event => setYear(event.target.value)} className="w-full rounded-lg border bg-background p-2"><option value="">Choisir explicitement l’année</option>{years.map((item: any) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
      <div><label htmlFor="legacy-resit-reason" className="block text-sm font-medium mb-1">Élément justifiant le rattachement</label><input id="legacy-resit-reason" value={reason} onChange={event => setReason(event.target.value)} minLength={10} className="w-full rounded-lg border bg-background p-2" placeholder="Référence du PV ou du dossier vérifié" /></div>
    </div>
    <ul className="max-h-80 space-y-2 overflow-y-auto">{(data.data || []).map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 text-sm">
      <span><strong>{row.student_name}</strong> · {row.cne}<span className="block text-muted-foreground">{row.module_name} · {row.status || 'Statut historique'} · Créé le {row.created_at}</span><span className="block text-xs text-muted-foreground">{row.reason}</span></span>
      <button type="button" disabled={!year || reason.trim().length < 10 || reconcile.isPending} onClick={() => reconcile.mutate(row.id)} className="rounded-lg bg-primary px-3 py-2 text-primary-foreground disabled:opacity-40">Rattacher ce dossier</button>
    </li>)}</ul>
  </details>
}
