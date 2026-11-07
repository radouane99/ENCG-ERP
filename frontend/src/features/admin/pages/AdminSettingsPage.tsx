import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Building2, CheckCircle2, Mail, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import api from '@shared/lib/api'
import PageHeader from '@shared/components/layout/PageHeader'
import { Button } from '@shared/components/ui/Button'
import PublicPortalManager from '../components/PublicPortalManager'
import PublicSupportInbox from '../components/PublicSupportInbox'

const empty = { institutionName: '', nameAr: '', universityName: '', directorName: '', rectorName: '', officialEmail: '', supportPhone: '', address: '', websiteUrl: '', cndpDeclaration: '' }
const field = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'
interface Settings { institution: typeof empty; academic_year: { label: string; is_locked: boolean } | null; runtime: { mailer: string; mail_from: string; maintenance_mode: boolean; token_expiration_minutes: number | null }; academic_rules: { validation_threshold: number; eliminatory_threshold: number; paid_filiere_types: string[] } }
export default function AdminSettingsPage() {
  const { t } = useTranslation('admin', { keyPrefix: 'institution_settings' })
  const query = useQuery({ queryKey: ['institution-settings'], queryFn: () => api.get('/admin/institution-settings').then(r => r.data as Settings) })
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [testingMail, setTestingMail] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { if (query.data?.institution) setForm(Object.fromEntries(Object.keys(empty).map(key => [key, query.data.institution[key as keyof typeof empty] ?? ''])) as typeof empty) }, [query.data])
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try { await api.post('/admin/institution-settings', form); toast.success(t('saved')); await query.refetch() }
    catch (err: unknown) { const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('save_error'); setError(message); toast.error(message) }
    finally { setBusy(false) }
  }
  async function testMail() { setTestingMail(true); try { const response = await api.post('/admin/institution-settings/test-email'); toast.success(response.data.message) } catch { toast.error(t('mail_error')) } finally { setTestingMail(false) } }
  const data = query.data
  return <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
    <PageHeader title={t('title')} subtitle={t('description')} />
    {query.isPending ? <p role="status" className="p-10 text-center text-muted-foreground">{t('loading')}</p> : query.isError ? <div role="alert" className="rounded-xl border border-border bg-card p-6"><p>{t('load_error')}</p><Button className="mt-3" variant="outline" onClick={() => query.refetch()}>{t('retry')}</Button></div> : data && <>
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6"><h2 className="flex items-center gap-2 font-bold"><Building2 className="h-5 w-5 text-primary" />{t('contact')}</h2><form onSubmit={save} className="mt-5 space-y-4">{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}<div className="grid gap-4 sm:grid-cols-2">{([
        ['institutionName', t('name'), 'text'], ['nameAr', t('arabic_name'), 'text'], ['universityName', t('university'), 'text'], ['directorName', t('director'), 'text'], ['rectorName', t('presidency'), 'text'], ['officialEmail', t('email'), 'email'], ['supportPhone', t('phone'), 'tel'], ['websiteUrl', t('website'), 'url'], ['address', t('address'), 'text'], ['cndpDeclaration', t('cndp'), 'text'],
      ] as const).map(([key, label, type]) => <label className="text-sm font-medium" key={key}>{label}<input className={field} type={type} required={key === 'institutionName'} maxLength={key === 'address' ? 1000 : 255} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} dir={key === 'nameAr' ? 'rtl' : undefined} /></label>)}</div><div className="flex justify-end border-t border-border pt-4"><Button type="submit" isLoading={busy}>{t('save')}</Button></div></form></section>
      <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-5 w-5 text-primary" />{t('academic')}</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t('active_year')}</dt><dd className="font-semibold">{data.academic_year?.label ?? t('undefined')}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t('year_status')}</dt><dd>{data.academic_year?.is_locked ? t('locked') : t('open')}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t('module')}</dt><dd>≥ {data.academic_rules.validation_threshold} / 20</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t('threshold')}</dt><dd>&lt; {data.academic_rules.eliminatory_threshold} / 20</dd></div></dl><p className="mt-4 text-xs text-muted-foreground">{t('academic_help')}</p><Link className="mt-4 inline-block text-sm font-medium text-primary underline" to="/admin/specialty-allocation">{t('campaign')}</Link></section>
      <section className="rounded-2xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5 text-primary" />{t('services')}</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t('mailer')}</dt><dd>{data.runtime.mailer}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t('sender')}</dt><dd className="break-all">{data.runtime.mail_from}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t('maintenance')}</dt><dd>{data.runtime.maintenance_mode ? t('active') : t('inactive')}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t('expiration')}</dt><dd>{data.runtime.token_expiration_minutes == null ? t('policy') : t('minutes', { count: data.runtime.token_expiration_minutes })}</dd></div></dl><Button className="mt-4" variant="outline" leadingIcon={<Mail className="h-4 w-4" />} isLoading={testingMail} onClick={testMail}>{t('test_mail')}</Button><p className="mt-4 text-xs text-muted-foreground">{t('services_help')}</p></section></div>
      <PublicPortalManager />
      <PublicSupportInbox />
    </>}
  </div>
}
