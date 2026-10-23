import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, CheckCircle2, Clock3, GraduationCap } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import PageHeader from '@shared/components/layout/PageHeader'
import { Button } from '@shared/components/ui/Button'
import { submitSpecialtyChoices, useSpecialtyChoices, type Specialty } from '../api/specialty'

export default function StudentSpecialtyOrientationPage() {
  const query = useSpecialtyChoices()
  const cache = useQueryClient()
  const [choices, setChoices] = useState<Specialty[]>([])
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { if (query.data && !dirty) {
    const ranks = new Map(query.data.existing_wishes.map(w => [w.filiere_id, w.preference_rank]))
    setChoices([...query.data.filieres].sort((a, b) => (ranks.get(a.id) ?? 999) - (ranks.get(b.id) ?? 999)))
  } }, [query.data, dirty])
  const data = query.data
  const assigned = data?.existing_wishes.find(w => w.allocation_status === 'assigned')
  const editable = !!data?.is_campaign_open && data.score_complete && !assigned
  const move = (index: number, direction: number) => { const target = index + direction; if (target < 0 || target >= choices.length) return; const next = [...choices]; [next[index], next[target]] = [next[target], next[index]]; setChoices(next); setDirty(true) }
  async function save() {
    setBusy(true); setError('')
    try { await submitSpecialtyChoices(choices.map(c => c.id)); setDirty(false); toast.success('Vos préférences ont été enregistrées.'); await cache.invalidateQueries({ queryKey: ['student-specialty-wishes'] }) }
    catch (err: unknown) { const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Vos choix n’ont pas pu être enregistrés.'; setError(message); toast.error(message) }
    finally { setBusy(false) }
  }
  return <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
    <PageHeader title="Mes choix de spécialité" subtitle="Classez les formations ouvertes selon vos préférences. L’affectation dépend du mérite et des places disponibles." />
    {query.isPending ? <p role="status" className="p-8 text-center text-muted-foreground">Chargement de la campagne…</p> : query.isError ? <div role="alert" className="rounded-xl border border-border bg-card p-6"><p>La campagne ne peut pas être chargée.</p><Button className="mt-3" variant="outline" onClick={() => query.refetch()}>Réessayer</Button></div> : data && <>
      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3"><div><p className="text-sm text-muted-foreground">Année cible</p><p className="mt-1 font-semibold">{data.academic_year}{data.target_semester ? ` · S${data.target_semester}` : ''}</p></div><div><p className="text-sm text-muted-foreground">Score calculé</p><p className="mt-1 font-semibold">{data.student_merit_score == null ? 'Bilan incomplet' : `${Number(data.student_merit_score).toFixed(2)} / 20`}</p></div><div><p className="text-sm text-muted-foreground">Date limite</p><p className="mt-1 font-semibold">{data.deadline ? new Date(data.deadline).toLocaleString('fr-FR') : 'Non définie'}</p></div></section>
      {assigned ? <div className="flex gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"><CheckCircle2 className="h-5 w-5 shrink-0" /><div><h2 className="font-semibold">Affectation enregistrée</h2><p className="mt-1 text-sm">{assigned.filiere.name}</p></div></div> : !editable && <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"><Clock3 className="h-5 w-5 shrink-0" /><p>{!data.is_campaign_open ? 'La campagne est fermée. Vos choix enregistrés restent consultables.' : 'Votre bilan académique doit être complété avant de soumettre vos choix. Contactez la scolarité.'}</p></div>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="border-b border-border p-5"><h2 className="font-bold">Votre ordre de préférence</h2><p className="mt-1 text-sm text-muted-foreground">La première formation est votre choix prioritaire.</p></div>{choices.length ? <ol className="divide-y divide-border">{choices.map((choice, index) => <li key={choice.id} className="flex items-center gap-3 p-4 sm:p-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{index + 1}</span><div className="min-w-0 flex-1"><p className="font-semibold">{choice.name}</p><p className="mt-1 text-xs text-muted-foreground">{choice.capacity ?? '—'} places · Seuil : {choice.min_score_required ?? '—'} / 20</p></div><div className="flex gap-1"><Button variant="outline" size="sm" aria-label={`Monter ${choice.name}`} disabled={!editable || busy || index === 0} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" /></Button><Button variant="outline" size="sm" aria-label={`Descendre ${choice.name}`} disabled={!editable || busy || index === choices.length - 1} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" /></Button></div></li>)}</ol> : <div className="p-10 text-center"><GraduationCap className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p>Aucune formation ouverte pour cette campagne.</p></div>}<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5"><p className="text-xs text-muted-foreground">{dirty ? 'Modifications non enregistrées' : data.existing_wishes.length ? 'Préférences enregistrées' : 'Aucun choix enregistré'}</p><Button disabled={!editable || !choices.length || choices.length > 5} isLoading={busy} onClick={save}>Enregistrer mes choix</Button></div></section>
    </>}
  </div>
}