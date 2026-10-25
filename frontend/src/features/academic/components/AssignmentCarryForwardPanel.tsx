import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import { toast } from 'sonner'

interface Preview { applied?: boolean; source_year: string; target_year: string; created: number; candidates: { module: string; group: string; hours: number; session_type: string }[]; skipped: { module: string; group: string; reason: string }[] }

export default function AssignmentCarryForwardPanel({ years }: { years: { id: string | number; label: string; is_current?: boolean }[] }) {
  const [source, setSource] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const client = useQueryClient()
  const error = (err: any) => toast.error(err.response?.data?.message || 'Opération impossible.')
  const carry = useMutation({
    mutationFn: (apply: boolean) => api.post('/professor-assignments/carry-forward', { source_year_id: Number(source), apply }).then(res => res.data.data as Preview),
    onSuccess: (data, apply) => {
      setPreview(data)
      if (apply) { toast.success(`${data.created} affectations reconduites. Les affectations existantes sont conservées.`); client.invalidateQueries({ queryKey: ['professor-assignments'] }); client.invalidateQueries({ queryKey: ['edt-campaign-workspace'] }) }
    }, onError: error,
  })
  const download = useMutation({
    mutationFn: () => api.get('/professor-assignments/orders-zip', { responseType: 'blob' }),
    onSuccess: response => {
      const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.download = 'ordres-de-service.zip'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    },
    onError: async (err: any) => {
      try { const message = JSON.parse(await err.response.data.text()).message; toast.error(message || 'Export impossible.') } catch { toast.error('Export ZIP impossible.') }
    },
  })
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 space-y-3" aria-labelledby="carry-forward-title">
    <div className="flex flex-wrap justify-between gap-3"><div><h2 id="carry-forward-title" className="font-bold text-lg">Préparer les affectations du semestre</h2><p className="text-sm text-slate-500">Reprendre une année précédente après contrôle des groupes et des enseignants actifs.</p></div><button onClick={() => download.mutate()} disabled={download.isPending} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">{download.isPending ? 'Création du ZIP…' : 'Exporter les ordres de service (ZIP)'}</button></div>
    <div className="flex flex-wrap items-end gap-3"><label className="text-sm font-semibold" htmlFor="assignment-source-year">Année source<select id="assignment-source-year" disabled={carry.isPending} value={source} onChange={event => { setSource(event.target.value); setPreview(null) }} className="block mt-1 rounded-lg border p-2 dark:bg-slate-800"><option value="">Choisir une année</option>{years.filter(year => !year.is_current).map(year => <option key={year.id} value={year.id}>{year.label}</option>)}</select></label><button disabled={!source || carry.isPending} onClick={() => carry.mutate(false)} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Prévisualiser la reconduction</button></div>
    {preview && <div className="space-y-2 text-sm"><p>{preview.source_year} → {preview.target_year} : {preview.candidates.length} affectations proposées, {preview.skipped.length} conservées ou à vérifier.</p>
      <details><summary className="cursor-pointer font-semibold">Examiner le résultat</summary><ul className="mt-2 space-y-1">{preview.candidates.map((item, index) => <li key={`candidate-${index}`}>{item.module} · {item.group} · {item.session_type.toUpperCase()} · {item.hours} h</li>)}{preview.skipped.map((item, index) => <li key={`skip-${index}`} className="text-amber-800 dark:text-amber-300">{item.module} · {item.group} : {item.reason}</li>)}</ul></details>
      <button disabled={carry.isPending || preview.applied || preview.candidates.length === 0} onClick={() => carry.mutate(true)} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{preview.applied ? 'Reconduction appliquée' : 'Appliquer les affectations compatibles'}</button>
    </div>}
  </section>
}
