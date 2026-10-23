import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Clock3, FileCheck2, GraduationCap, Printer } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@shared/components/layout/PageHeader'
import { Button } from '@shared/components/ui/Button'
import { confirmStudentRenewal, useRenewalStatus } from '../api/renewal'

const field = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'
export default function StudentReinscriptionPage() {
  const cache = useQueryClient()
  const status = useRenewalStatus()
  const [contact, setContact] = useState({ phone: '', address: '', city: '' })
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { if (status.data) setContact({ phone: status.data.phone ?? '', address: status.data.address ?? '', city: status.data.city ?? '' }) }, [status.data?.student_name])
  const confirm = useMutation({ mutationFn: confirmStudentRenewal, onSuccess: async () => {
    toast.success('Réinscription annuelle confirmée.')
    await cache.invalidateQueries({ queryKey: ['student-reinscription-status'] })
  }, onError: (err: unknown) => { const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'La confirmation a échoué. Vos coordonnées sont conservées.'; setError(message); toast.error(message) } })
  const data = status.data
  const receipt = data?.is_confirmed || confirm.isSuccess
  const paymentComplete = data?.payment_status === 'paid' || !data?.payment_required
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); if (consent && data?.can_confirm) confirm.mutate(contact) }
  return <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6 print:max-w-none print:p-0">
    <PageHeader title="Ma réinscription annuelle" subtitle={data ? `Année universitaire ${data.academic_year}` : 'Vérification de votre inscription annuelle'} />
    {status.isPending ? <p role="status" className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">Chargement de votre dossier…</p> : status.isError ? <div role="alert" className="space-y-3 rounded-2xl border border-border bg-card p-8"><p>Votre dossier ne peut pas être chargé. Aucune confirmation n’a été enregistrée depuis cet écran.</p><Button variant="outline" onClick={() => status.refetch()}>Réessayer</Button></div> : data && <>
      <section className={`rounded-2xl border p-5 md:p-6 ${receipt ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100' : 'border-border bg-card'}`}>
        <div className="flex items-start gap-3">{receipt ? <CheckCircle2 className="h-6 w-6 shrink-0" /> : <GraduationCap className="h-6 w-6 shrink-0 text-primary" />}<div><h2 className="text-lg font-bold">{receipt ? 'Réinscription confirmée' : data.is_admis ? 'Inscription académique validée' : 'Validation académique en attente'}</h2><p className="mt-1 text-sm">{receipt ? 'Votre confirmation annuelle est enregistrée. Conservez la référence ci-dessous.' : data.blocking_reason ?? 'Vérifiez vos coordonnées et les étapes ci-dessous pour confirmer votre inscription.'}</p></div></div>
      </section>
      <ol className="grid gap-3 sm:grid-cols-3 print:hidden" aria-label="Étapes de la réinscription">{[
        { name: 'Validation académique', done: data.is_admis, detail: data.target_semester ? `Semestre S${data.target_semester}` : 'Décision attendue de la scolarité' },
        { name: 'Situation financière', done: paymentComplete, detail: !data.payment_required ? 'Cursus exonéré' : paymentComplete ? 'Règlement vérifié' : 'À régulariser auprès de la régie' },
        { name: 'Confirmation annuelle', done: !!receipt, detail: receipt ? 'Confirmation enregistrée' : 'Coordonnées à confirmer' },
      ].map((step, index) => <li className="rounded-xl border border-border bg-card p-4" key={step.name}><div className="flex items-center gap-2 text-sm font-semibold">{step.done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Clock3 className="h-4 w-4 text-amber-600" />}<span>{index + 1}. {step.name}</span></div><p className="mt-2 text-xs text-muted-foreground">{step.detail}</p></li>)}</ol>
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6"><h2 className="mb-4 font-bold">Votre dossier</h2><dl className="grid gap-5 text-sm sm:grid-cols-2">{[['Étudiant', data.student_name], ['CNE / Massar', data.cne], ['Formation', data.current_filiere], ['Inscription cible', data.target_semester ? `Semestre S${data.target_semester}` : 'En attente']].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value || 'Non renseigné'}</dd></div>)}</dl></section>
      {data.payment_required && !paymentComplete && !receipt && <aside className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"><p className="font-semibold">Règlement à vérifier par la régie</p><p className="mt-1">{data.invoice_reference ? `Facture ${data.invoice_reference}. Solde : ${data.invoice_remaining?.toFixed(2)} MAD.` : 'Contactez la régie pour connaître votre situation de facturation.'} La confirmation sera disponible après enregistrement du règlement.</p></aside>}
      {receipt ? <section className="rounded-2xl border border-border bg-card p-5 md:p-6" aria-label="Confirmation annuelle"><div className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-emerald-600" /><h2 className="font-bold">Récépissé de confirmation</h2></div><p className="mt-4 text-xs text-muted-foreground">Référence enregistrée</p><p className="mt-1 break-all rounded-lg bg-muted p-3 font-mono text-sm">{data.receipt_reference ?? confirm.data?.data.receipt_reference ?? 'Chargement de la référence…'}</p><p className="mt-3 text-sm text-muted-foreground">Confirmée le {data.confirmed_at ? new Date(data.confirmed_at).toLocaleString('fr-FR') : 'Confirmation en cours de synchronisation'}.</p><Button className="mt-5 print:hidden" variant="outline" leadingIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Imprimer ma confirmation</Button></section> : <section className="rounded-2xl border border-border bg-card p-5 md:p-6"><h2 className="font-bold">Confirmer mes coordonnées</h2><p className="mt-1 text-sm text-muted-foreground">Ces informations seront enregistrées avec votre réinscription annuelle.</p><form className="mt-5 space-y-4" onSubmit={submit}>
        {error && <p role="alert" className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Téléphone<input className={field} type="tel" autoComplete="tel" required maxLength={20} value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} /></label><label className="text-sm font-medium">Ville<input className={field} autoComplete="address-level2" required maxLength={100} value={contact.city} onChange={e => setContact({ ...contact, city: e.target.value })} /></label></div>
        <label className="block text-sm font-medium">Adresse<input className={field} autoComplete="street-address" required maxLength={255} value={contact.address} onChange={e => setContact({ ...contact, address: e.target.value })} /></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" required checked={consent} onChange={e => setConsent(e.target.checked)} />Je confirme l’exactitude de mes coordonnées.</label>
        {!data.can_confirm && <p className="text-sm text-muted-foreground">La confirmation sera disponible après validation académique et régularisation des éventuels frais.</p>}
        <div className="flex justify-end border-t border-border pt-4"><Button disabled={!data.can_confirm || !consent} isLoading={confirm.isPending} type="submit">Confirmer ma réinscription</Button></div>
      </form></section>}
    </>}
  </div>
}