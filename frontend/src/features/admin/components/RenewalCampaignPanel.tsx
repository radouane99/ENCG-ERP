import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@shared/components/ui/Button'
import { errorMessage } from '@features/admissions/api/workflow'
import { saveRenewalCampaign, useRenewalCampaign } from '@features/students/api/renewalCampaign'

export default function RenewalCampaignPanel() {
  const query = useRenewalCampaign(); const cache = useQueryClient()
  const [form, setForm] = useState({ status: 'draft', opens_on: '', closes_on: '', public_message: '' })
  const [message, setMessage] = useState('')
  const calendar = query.data?.data
  const { version, academic_year_id: yearId, status: campaignStatus, opens_on: opensOn, closes_on: closesOn, public_message: publicMessage } = calendar ?? {}
  useEffect(() => { if (yearId) setForm({ status: campaignStatus ?? 'draft', opens_on: opensOn ?? '', closes_on: closesOn ?? '', public_message: publicMessage ?? '' }) }, [version, yearId, campaignStatus, opensOn, closesOn, publicMessage])
  const save = useMutation({ mutationFn: () => saveRenewalCampaign({ ...form, version: calendar?.version ?? 0 }),
    onSuccess: async result => { cache.setQueryData(['renewal-campaign'], result); setMessage('Calendrier enregistré. Les contrôles étudiant et serveur sont à jour.'); await cache.invalidateQueries({ queryKey: ['student-reinscription-status'] }) } })
  const field = 'mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm'
  return <section aria-label="Calendrier des réinscriptions" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
    <h2 className="text-lg font-semibold">Calendrier des réinscriptions</h2>
    <p className="mt-1 text-sm text-muted-foreground">Publiez les dates de confirmation annuelle et les consignes visibles par les étudiants. Les dates sont inclusives, heure du Maroc.</p>
    {query.isPending ? <p role="status" className="mt-4">Chargement du calendrier…</p> : query.isError ? <p role="alert" className="mt-4">Calendrier indisponible. <Button variant="outline" onClick={() => query.refetch()}>Réessayer</Button></p> : <>
      <p role="status" className={`mt-4 rounded-xl p-3 text-sm ${calendar?.is_open ? 'bg-emerald-50 text-emerald-950' : 'bg-amber-50 text-amber-950'}`}>{calendar?.academic_year} · {calendar?.message}</p>
      {message && <p role="status" className="mt-3 text-sm">{message}</p>}
      {save.error && <p role="alert" className="mt-3 text-sm text-red-700">{errorMessage(save.error)}</p>}
      <form className="mt-4" onSubmit={e => { e.preventDefault(); setMessage(''); save.mutate() }}><fieldset disabled={!query.data?.can_manage || calendar?.state === 'year_locked' || save.isPending} className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm">Ouverture<input className={field} type="date" required value={form.opens_on} onChange={e => setForm({ ...form, opens_on: e.target.value })} /></label>
        <label className="text-sm">Clôture<input className={field} type="date" required min={form.opens_on || undefined} value={form.closes_on} onChange={e => setForm({ ...form, closes_on: e.target.value })} /></label>
        <label className="text-sm">Publication<select aria-label="Publication" className={field} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Brouillon</option><option value="open">Publier selon les dates</option><option value="closed">Fermer la campagne</option></select></label>
        <label className="text-sm sm:col-span-3">Consignes publiques<textarea className={field} rows={2} maxLength={1000} value={form.public_message} onChange={e => setForm({ ...form, public_message: e.target.value })} placeholder="Pièces à présenter au guichet, horaires et contact de la scolarité…" /></label>
        <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3"><p className="max-w-xl text-xs text-muted-foreground">Les dossiers déjà confirmés restent consultables après clôture. Leur contrôle physique peut se poursuivre.</p><Button type="submit" isLoading={save.isPending}>Enregistrer le calendrier</Button></div>
      </fieldset></form>
    </>}
  </section>
}
