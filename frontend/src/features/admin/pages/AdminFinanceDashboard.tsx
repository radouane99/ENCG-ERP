import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Banknote, CheckCircle2, ChevronLeft, ChevronRight, Plus, RefreshCw, Search, Send } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@shared/components/layout/PageHeader'
import { Button } from '@shared/components/ui/Button'
import { Modal } from '@shared/components/ui/Modal'
import { createTuitionInvoice, remindTuitionInvoice, useFinanceOptions, useTuitionLedger, verifyTuitionPayment, type TuitionInvoice } from '../api/tuitionFinance'

const field = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'
const card = 'rounded-2xl border border-border bg-card p-5'
const money = (value: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(value)
const failure = (error: unknown) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'La demande a échoué. Réessayez.'

export default function AdminFinanceDashboard() {
  const cache = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [selected, setSelected] = useState<TuitionInvoice | null>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const ledger = useTuitionLedger(page, search, status)
  const options = useFinanceOptions(studentSearch, createOpen)
  const refresh = () => cache.invalidateQueries({ queryKey: ['admin-finance-stats'] })
  const close = () => { if (!busy) { setCreateOpen(false); setSelected(null); setFormError('') } }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    setBusy(true); setFormError('')
    try {
      if (selected) {
        await verifyTuitionPayment(selected.id, { reference: fields.get('reference'), amount: fields.get('amount'), provider: fields.get('provider'), verification_note: fields.get('verification_note'), receipt_verified: fields.get('receipt_verified') === 'on' })
        toast.success('Règlement vérifié et enregistré.')
      } else {
        await createTuitionInvoice(Object.fromEntries(fields))
        toast.success('Facture créée pour l’inscription sélectionnée.')
      }
      setCreateOpen(false); setSelected(null); await refresh()
    } catch (error) { const message = failure(error); setFormError(message); toast.error(message) }
    finally { setBusy(false) }
  }
  async function remind(id?: number) {
    setBusy(true)
    try { const response = await remindTuitionInvoice(id); toast.success(`${response.data.sent_count} rappel(s) enregistré(s) dans les espaces personnels.`) }
    catch (error) { toast.error(failure(error)) }
    finally { setBusy(false) }
  }
  const data = ledger.data
  return <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
    <PageHeader title="Régie & frais de formation" subtitle="Factures annuelles, règlements vérifiés et suivi des soldes." actions={<>
      <Button variant="outline" onClick={() => ledger.refetch()} aria-label="Actualiser les factures"><RefreshCw className="h-4 w-4" /></Button>
      <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => { setFormError(''); setCreateOpen(true) }}>Créer une facture</Button>
    </>} />
    <div className="grid gap-4 sm:grid-cols-3">
      {[['Encaissements vérifiés ce mois', data?.revenue_month], ['Solde restant à régulariser', data?.unpaid_amount], ['Factures non soldées', data?.unpaid_count]].map(([label, value]) => <div className={card} key={String(label)}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums">{value ?? '—'}</p></div>)}
    </div>
    <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"><Banknote className="h-5 w-5 shrink-0" /><p>Les formations Grande École sont exonérées. Chaque règlement est enregistré après vérification du justificatif par la régie.</p></div>
    <section className="overflow-hidden rounded-2xl border border-border bg-card" aria-label="Factures de formation">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-end">
        <label className="flex-1 text-sm font-medium">Rechercher un étudiant ou une facture<div className="relative"><Search className="absolute start-3 top-4 h-4 w-4 text-muted-foreground" /><input className={`${field} ps-10`} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Nom, CNE ou référence" /></div></label>
        <label className="text-sm font-medium">Statut<select className={field} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}><option value="ALL">Toutes les factures</option><option value="PENDING">À régulariser</option><option value="LATE">Échéance dépassée</option><option value="PAID">Soldées</option></select></label>
        <Button variant="outline" disabled={busy || !data?.unpaid_count} leadingIcon={<Send className="h-4 w-4" />} onClick={() => remind()}>Relancer les impayés</Button>
      </div>
      {ledger.isPending ? <p role="status" className="p-10 text-center text-muted-foreground">Chargement des factures…</p> : ledger.isError ? <div role="alert" className="space-y-3 p-8 text-center"><p>Les factures ne peuvent pas être chargées.</p><Button variant="outline" onClick={() => ledger.refetch()}>Réessayer</Button></div> : !data?.payments.length ? <div className="p-12 text-center"><Banknote className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h2 className="font-semibold">Aucune facture à afficher</h2><p className="mt-1 text-sm text-muted-foreground">Créez une facture pour une inscription à un cursus payant ou ajustez vos filtres.</p></div> : <>
        <div className="overflow-x-auto"><table className="w-full text-start text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr>{['Étudiant', 'Formation & échéance', 'Montant', 'Solde', 'Statut', 'Actions'].map(label => <th className="p-4 text-start font-semibold" key={label}>{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{data.payments.map(invoice => <tr key={invoice.id} className="hover:bg-muted/25">
          <td className="p-4"><p className="font-semibold">{invoice.name}</p><p className="text-xs text-muted-foreground">{invoice.cne}</p></td>
          <td className="max-w-xs p-4"><p>{invoice.type}</p><p className="text-xs text-muted-foreground">Échéance : {invoice.date ? new Date(`${invoice.date}T12:00:00`).toLocaleDateString('fr-FR') : 'Non renseignée'}</p><p className="mt-1 max-w-48 truncate text-xs text-muted-foreground" title={invoice.receipt_number}>{invoice.receipt_number}</p></td>
          <td className="whitespace-nowrap p-4 tabular-nums">{invoice.amount}</td><td className="whitespace-nowrap p-4 font-semibold tabular-nums">{invoice.remaining_amount == null ? '—' : money(invoice.remaining_amount)}</td>
          <td className="p-4"><span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : invoice.status === 'LATE' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'bg-muted text-foreground'}`}>{invoice.status === 'PAID' && <CheckCircle2 className="h-3 w-3" />}{invoice.status === 'PAID' ? 'Soldée' : invoice.status === 'LATE' ? 'En retard' : 'À régulariser'}</span></td>
          <td className="p-4">{invoice.status !== 'PAID' && <div className="flex gap-2"><Button size="sm" onClick={() => { setFormError(''); setSelected(invoice) }}>Valider</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => remind(invoice.id)}>Rappeler</Button></div>}</td>
        </tr>)}</tbody></table></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-sm text-muted-foreground"><p>{data.meta?.total ?? data.payments.length} facture(s) · Page {page} / {data.meta?.last_page ?? 1}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} aria-label="Page précédente"><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" disabled={page >= (data.meta?.last_page ?? 1)} onClick={() => setPage(p => p + 1)} aria-label="Page suivante"><ChevronRight className="h-4 w-4" /></Button></div></div>
      </>}
    </section>
    <Modal open={createOpen || !!selected} onClose={close} preventBackdropClose={busy} preventEscapeClose={busy} title={selected ? `Vérifier le règlement — ${selected.name}` : 'Créer une facture de formation'} description={selected ? 'Contrôlez la réception du règlement avant de confirmer.' : 'La facture doit correspondre à une inscription existante au même cursus et à la même année.'}>
      <form onSubmit={save} className="space-y-4">
        {formError && <p role="alert" className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"><AlertCircle className="h-4 w-4 shrink-0" />{formError}</p>}
        {selected ? <>
          <p className="rounded-lg bg-muted p-3 text-sm">Solde de la facture : <strong>{selected.remaining_amount == null ? 'Consulter la régie' : money(selected.remaining_amount)}</strong></p>
          <label className="block text-sm font-medium">Référence du justificatif<input className={field} name="reference" required minLength={4} maxLength={150} /></label>
          <label className="block text-sm font-medium">Montant reçu (MAD)<input className={field} name="amount" type="number" required min="0.01" max={selected.remaining_amount} step="0.01" /></label>
          <label className="block text-sm font-medium">Mode de règlement<select className={field} name="provider"><option value="bank">Virement bancaire</option><option value="cash">Espèces à la régie</option><option value="cmi">Justificatif CMI</option><option value="wafacash">Justificatif Wafacash</option></select></label>
          <label className="block text-sm font-medium">Compte rendu de vérification<textarea className={field} name="verification_note" required minLength={10} maxLength={2000} rows={3} /></label>
          <label className="flex items-start gap-2 text-sm"><input className="mt-1" name="receipt_verified" type="checkbox" required />J’ai vérifié le justificatif et la réception du règlement.</label>
        </> : <>
          <label className="block text-sm font-medium">Rechercher l’étudiant<input className={field} value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Nom ou CNE" /></label>
          {options.isError && <p role="alert" className="text-sm text-red-700">Impossible de charger les inscriptions. <button type="button" className="underline" onClick={() => options.refetch()}>Réessayer</button></p>}
          <label className="block text-sm font-medium">Étudiant<select className={field} name="student_id" required key={studentSearch}><option value="">{options.isPending ? 'Chargement…' : 'Sélectionner un étudiant'}</option>{options.data?.students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.cne}</option>)}</select></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Année universitaire<select className={field} name="academic_year_id" required><option value="">Sélectionner</option>{options.data?.years.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}</select></label><label className="block text-sm font-medium">Formation payante<select className={field} name="filiere_id" required><option value="">Sélectionner</option>{options.data?.filieres.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label></div>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Montant facturé (MAD)<input className={field} name="amount" type="number" required min="0.01" max="99999999" step="0.01" /></label><label className="block text-sm font-medium">Date d’échéance<input className={field} name="due_on" type="date" required /></label></div>
        </>}
        <div className="flex justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="outline" disabled={busy} onClick={close}>Annuler</Button><Button type="submit" isLoading={busy} disabled={!selected && !options.data}>{selected ? 'Enregistrer le règlement' : 'Créer la facture'}</Button></div>
      </form>
    </Modal>
  </div>
}