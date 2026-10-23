import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowUp, ArrowDown, Globe2 } from 'lucide-react'
import api from '@/shared/lib/api'
import PageHeader from '@shared/components/layout/PageHeader'
import { Button } from '@shared/components/ui/Button'
import { toast } from 'sonner'
type Partner = { id: number; name: string; country: string; city?: string; type: string; slots: number; gpa_required: number }
export default function StudentMobility() {
  const cache = useQueryClient()
  const [choices, setChoices] = useState<number[]>([])
  const [dirty, setDirty] = useState(false)
  const [search, setSearch] = useState('')
  const query = useQuery({ queryKey: ['student-mobility-partners'], queryFn: async () => (await api.get('/student-portal/mobility/partners')).data.data as { partners: Partner[]; voeux: number[] } })
  useEffect(() => { if (query.data && !dirty) setChoices(query.data.voeux) }, [query.data, dirty])
  const save = useMutation({ mutationFn: () => api.post('/student-portal/mobility/voeux', { voeux: choices }), onSuccess: async () => { await cache.invalidateQueries({ queryKey: ['student-mobility-partners'] }); setDirty(false); toast.success('Vos préférences de mobilité ont été enregistrées.') }, onError: (error: any) => toast.error(error.response?.data?.message || 'Enregistrement impossible. Vos modifications sont conservées.') })
  const change = (next: number[]) => { setChoices(next); setDirty(true) }
  const move = (index: number, direction: number) => { const next = [...choices]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; change(next) }
  const partners = query.data?.partners || []
  return <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
    <PageHeader title="Mobilité internationale" subtitle="Consultez les partenaires ouverts et classez jusqu’à trois préférences pour l’année active." />
    <p className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">L’enregistrement des préférences permet l’étude de votre dossier par l’administration. L’affectation dépend du mérite académique, des places et des conditions du partenaire. Les justificatifs linguistiques et le dossier complémentaire sont à transmettre au service de mobilité.</p>
    {query.isPending ? <p role="status">Chargement des partenaires…</p> : query.isError ? <div role="alert">Le catalogue est indisponible. <Button variant="outline" onClick={() => query.refetch()}>Réessayer</Button></div> : <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
      <section className="space-y-4"><label className="block text-sm font-medium">Rechercher un partenaire<input className="mt-2 w-full rounded-lg border border-border bg-card p-3" value={search} onChange={e => setSearch(e.target.value)} placeholder="Établissement, pays ou ville" /></label>
        <div className="grid gap-4 md:grid-cols-2">{partners.filter(p => `${p.name} ${p.country} ${p.city || ''}`.toLowerCase().includes(search.toLowerCase())).map(p => <article key={p.id} className="space-y-3 rounded-2xl border border-border bg-card p-5"><Globe2 className="h-6 w-6 text-primary" /><h2 className="font-semibold">{p.name}</h2><p className="text-sm text-muted-foreground">{[p.city, p.country].filter(Boolean).join(' · ')} · {p.type}</p><p className="text-sm">{p.slots} place(s) · Seuil académique : {p.gpa_required}/20</p><Button variant={choices.includes(p.id) ? 'outline' : 'primary'} disabled={save.isPending || (!choices.includes(p.id) && choices.length >= 3)} onClick={() => change(choices.includes(p.id) ? choices.filter(id => id !== p.id) : [...choices, p.id])}>{choices.includes(p.id) ? 'Retirer de mes choix' : 'Ajouter à mes choix'}</Button></article>)}</div>
        {!partners.length && <p className="rounded-xl border border-border p-6 text-muted-foreground">Aucun partenaire ouvert actuellement.</p>}
      </section>
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5" aria-label="Préférences de mobilité"><h2 className="font-semibold">Mes préférences · {choices.length}/3</h2>{dirty && <p role="status" className="text-sm text-amber-700 dark:text-amber-300">Modifications non enregistrées</p>}{choices.length === 0 && <p className="text-sm text-muted-foreground">Ajoutez un partenaire au catalogue.</p>}
        <ol className="space-y-3">{choices.map((id, index) => <li key={id} className="flex items-center gap-2 rounded-lg bg-muted/40 p-3"><span className="font-semibold">{index + 1}.</span><span className="min-w-0 flex-1 text-sm">{partners.find(p => p.id === id)?.name || 'Partenaire fermé — retirez ce choix'}</span><Button size="sm" variant="ghost" aria-label={`Monter le choix ${index + 1}`} disabled={!index || save.isPending} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" /></Button><Button size="sm" variant="ghost" aria-label={`Descendre le choix ${index + 1}`} disabled={index === choices.length - 1 || save.isPending} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" /></Button><Button size="sm" variant="ghost" disabled={save.isPending} onClick={() => change(choices.filter(value => value !== id))} aria-label={`Retirer le choix ${index + 1}`}>×</Button></li>)}</ol>
        <Button className="w-full" isLoading={save.isPending} disabled={!dirty} onClick={() => save.mutate()}>Enregistrer mes préférences</Button>
      </section>
    </div>}
  </div>
}