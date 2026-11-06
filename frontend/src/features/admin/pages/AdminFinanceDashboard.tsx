import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Banknote, CheckCircle2, ChevronLeft, ChevronRight, Plus, RefreshCw, Search, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import PageHeader from '@shared/components/layout/PageHeader'
import { Button } from '@shared/components/ui/Button'
import { Modal } from '@shared/components/ui/Modal'
import { createTuitionInvoice, remindTuitionInvoice, useFinanceOptions, useTuitionLedger, verifyTuitionPayment, type TuitionInvoice } from '../api/tuitionFinance'

const field = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'
const card = 'rounded-2xl border border-border bg-card p-5'
const failure = (error: unknown, fallback: string) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback

export default function AdminFinanceDashboard() {
  const { t, i18n } = useTranslation('admin', { keyPrefix: 'finance' })
  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-MA' : 'fr-MA'
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'MAD' }).format(value)
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
        toast.success(t('payment_saved'))
      } else {
        await createTuitionInvoice(Object.fromEntries(fields))
        toast.success(t('invoice_saved'))
      }
      setCreateOpen(false); setSelected(null); await refresh()
    } catch (error) { const message = failure(error, t('failure')); setFormError(message); toast.error(message) }
    finally { setBusy(false) }
  }
  async function remind(id?: number) {
    setBusy(true)
    try { const response = await remindTuitionInvoice(id); toast.success(t('reminder_sent', { count: response.data.sent_count })) }
    catch (error) { toast.error(failure(error, t('failure'))) }
    finally { setBusy(false) }
  }
  const data = ledger.data
  return <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
    <PageHeader title={t('title')} subtitle={t('subtitle')} actions={<>
      <Button variant="outline" onClick={() => ledger.refetch()} aria-label={t('refresh')}><RefreshCw className="h-4 w-4" /></Button>
      <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => { setFormError(''); setCreateOpen(true) }}>{t('create')}</Button>
    </>} />
    <div className="grid gap-4 sm:grid-cols-3">
      {[[t('monthly'), data?.revenue_month], [t('balance'), data?.unpaid_amount], [t('outstanding'), data?.unpaid_count]].map(([label, value]) => <div className={card} key={String(label)}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums">{value ?? '—'}</p></div>)}
    </div>
    <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-blue-950 dark:border-primary dark:bg-blue-950/40 dark:text-blue-100"><Banknote className="h-5 w-5 shrink-0" /><p>{t('policy')}</p></div>
    <section className="overflow-hidden rounded-2xl border border-border bg-card" aria-label={t('invoices')}>
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-end">
        <label className="flex-1 text-sm font-medium">{t('search')}<div className="relative"><Search className="absolute start-3 top-4 h-4 w-4 text-muted-foreground" /><input className={`${field} ps-10`} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder={t('search_hint')} /></div></label>
        <label className="text-sm font-medium">{t('status')}<select className={field} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}><option value="ALL">{t('all')}</option><option value="PENDING">{t('pending')}</option><option value="LATE">{t('overdue')}</option><option value="PAID">{t('paid_filter')}</option></select></label>
        <Button variant="outline" disabled={busy || !data?.unpaid_count} leadingIcon={<Send className="h-4 w-4" />} onClick={() => remind()}>{t('remind_all')}</Button>
      </div>
      {ledger.isPending ? <p role="status" className="p-10 text-center text-muted-foreground">{t('loading_invoices')}</p> : ledger.isError ? <div role="alert" className="space-y-3 p-8 text-center"><p>{t('load_error')}</p><Button variant="outline" onClick={() => ledger.refetch()}>{t('retry')}</Button></div> : !data?.payments.length ? <div className="p-12 text-center"><Banknote className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h2 className="font-semibold">{t('empty')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('empty_help')}</p></div> : <>
        <div className="overflow-x-auto"><table className="w-full text-start text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr>{[t('student'), t('course_due'), t('amount'), t('remaining'), t('status'), t('actions')].map(label => <th className="p-4 text-start font-semibold" key={label}>{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{data.payments.map(invoice => <tr key={invoice.id} className="hover:bg-muted/25">
          <td className="p-4"><p className="font-semibold">{invoice.name}</p><p className="text-xs text-muted-foreground">{invoice.cne}</p></td>
          <td className="max-w-xs p-4"><p>{invoice.type}</p><p className="text-xs text-muted-foreground">{t('due_label')} · {invoice.date ? new Date(`${invoice.date}T12:00:00`).toLocaleDateString(locale) : t('missing')}</p><p className="mt-1 max-w-48 truncate text-xs text-muted-foreground" title={invoice.receipt_number}>{invoice.receipt_number}</p></td>
          <td className="whitespace-nowrap p-4 tabular-nums">{invoice.amount}</td><td className="whitespace-nowrap p-4 font-semibold tabular-nums">{invoice.remaining_amount == null ? '—' : money(invoice.remaining_amount)}</td>
          <td className="p-4"><span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : invoice.status === 'LATE' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'bg-muted text-foreground'}`}>{invoice.status === 'PAID' && <CheckCircle2 className="h-3 w-3" />}{invoice.status === 'PAID' ? t('paid') : invoice.status === 'LATE' ? t('late') : t('pending')}</span></td>
          <td className="p-4">{invoice.status !== 'PAID' && <div className="flex gap-2"><Button size="sm" onClick={() => { setFormError(''); setSelected(invoice) }}>{t('verify')}</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => remind(invoice.id)}>{t('remind')}</Button></div>}</td>
        </tr>)}</tbody></table></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-sm text-muted-foreground"><p>{t('page', { total: data.meta?.total ?? data.payments.length, page, last: data.meta?.last_page ?? 1 })}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} aria-label={t('previous')}><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></Button><Button variant="outline" size="sm" disabled={page >= (data.meta?.last_page ?? 1)} onClick={() => setPage(p => p + 1)} aria-label={t('next')}><ChevronRight className="h-4 w-4 rtl:rotate-180" /></Button></div></div>
      </>}
    </section>
    <Modal open={createOpen || !!selected} onClose={close} preventBackdropClose={busy} preventEscapeClose={busy} title={selected ? t('verify_for', { name: selected.name }) : t('new_invoice')} description={selected ? t('verify_help') : t('invoice_help')}>
      <form onSubmit={save} className="space-y-4">
        {formError && <p role="alert" className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"><AlertCircle className="h-4 w-4 shrink-0" />{formError}</p>}
        {selected ? <>
          <p className="rounded-lg bg-muted p-3 text-sm">{t('invoice_balance')} · <strong>{selected.remaining_amount == null ? t('contact') : money(selected.remaining_amount)}</strong></p>
          <label className="block text-sm font-medium">{t('reference')}<input className={field} name="reference" required minLength={4} maxLength={150} /></label>
          <label className="block text-sm font-medium">{t('received')}<input className={field} name="amount" type="number" required min="0.01" max={selected.remaining_amount} step="0.01" /></label>
          <label className="block text-sm font-medium">{t('provider')}<select className={field} name="provider"><option value="bank">{t('bank')}</option><option value="cash">{t('cash')}</option><option value="cmi">{t('cmi')}</option><option value="wafacash">{t('wafacash')}</option></select></label>
          <label className="block text-sm font-medium">{t('note')}<textarea className={field} name="verification_note" required minLength={10} maxLength={2000} rows={3} /></label>
          <label className="flex items-start gap-2 text-sm"><input className="mt-1" name="receipt_verified" type="checkbox" required />{t('confirmed')}</label>
        </> : <>
          <label className="block text-sm font-medium">{t('student_search')}<input className={field} value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder={t('student_hint')} /></label>
          {options.isError && <p role="alert" className="text-sm text-red-700">{t('options_error')} <button type="button" className="underline" onClick={() => options.refetch()}>{t('retry')}</button></p>}
          <label className="block text-sm font-medium">{t('student')}<select className={field} name="student_id" required key={studentSearch}><option value="">{options.isPending ? t('loading') : t('select_student')}</option>{options.data?.students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.cne}</option>)}</select></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">{t('year')}<select className={field} name="academic_year_id" required><option value="">{t('choose')}</option>{options.data?.years.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}</select></label><label className="block text-sm font-medium">{t('paid_course')}<select className={field} name="filiere_id" required><option value="">{t('choose')}</option>{options.data?.filieres.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label></div>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">{t('billed')}<input className={field} name="amount" type="number" required min="0.01" max="99999999" step="0.01" /></label><label className="block text-sm font-medium">{t('due_date')}<input className={field} name="due_on" type="date" required /></label></div>
        </>}
        <div className="flex justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="outline" disabled={busy} onClick={close}>{t('cancel')}</Button><Button type="submit" isLoading={busy} disabled={!selected && !options.data}>{selected ? t('save_payment') : t('save_invoice')}</Button></div>
      </form>
    </Modal>
  </div>
}
