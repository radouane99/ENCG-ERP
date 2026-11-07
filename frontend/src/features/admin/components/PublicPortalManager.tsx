import '../../public/public-portal.css'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
import type { PortalContent, PortalAnnouncement } from '@features/public/api/usePublicPortal'
import { useAuthStore } from '@stores/authStore'

const field = 'mt-1 block w-full rounded-xl border border-input bg-background p-3 text-sm'
export default function PublicPortalManager() {
  const { t } = useTranslation('admin', { keyPrefix: 'public_portal' })
  const actor = useAuthStore(state => state.user)
  const query = useQuery({ queryKey: ['admin-public-portal', actor?.institution_id, actor?.id], queryFn: async () => (await api.get('/admin/public-portal')).data.data as PortalContent, refetchOnWindowFocus: false })
  const [form, setForm] = useState<PortalContent | null>(null)
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('')
  useEffect(() => { if (query.data) setForm(query.data) }, [query.data])
  const update = (index: number, patch: Partial<PortalAnnouncement>) => setForm(previous => previous && ({ ...previous, announcements: previous.announcements.map((item, position) => position === index ? { ...item, ...patch } : item) }))
  return <section className="portal-surface p-5 sm:p-6" id="public-portal"><h2 className="portal-heading">{t('title')}</h2><p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
    {query.isPending && <p role="status" className="mt-4">{t('loading')}</p>}{query.isError && <p role="alert" className="mt-4 text-destructive">{t('unavailable')}</p>}
    {form && <form className="mt-5 space-y-5" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); setMessage(''); try {
      const response = await api.put('/admin/public-portal', { revision: form.revision, hours: form.contact.hours, guides: { tafem: { instructions: form.guides.tafem.instructions }, cnaem: { instructions: form.guides.cnaem.instructions } }, announcements: form.announcements })
      setForm(response.data.data); setMessage(t('saved'))
    } catch (failure: any) { setError(failure.response?.data?.message || t('save_error')) } finally { setBusy(false) } }}>
      <label className="block text-sm font-medium">{t('hours')}<textarea disabled={busy} maxLength={1000} className={field} value={form.contact.hours} onChange={event => setForm({ ...form, contact: { ...form.contact, hours: event.target.value } })} placeholder={t('hours_placeholder')} /></label>
      <div className="grid gap-4 md:grid-cols-2">{(['tafem', 'cnaem'] as const).map(route => <label key={route} className="text-sm font-medium">{t('guide', { route: route.toUpperCase() })}<textarea disabled={busy} maxLength={5000} rows={5} className={field} value={form.guides[route].instructions} onChange={event => setForm({ ...form, guides: { ...form.guides, [route]: { ...form.guides[route], instructions: event.target.value } } })} /></label>)}</div>
      <p className="text-xs text-muted-foreground">{t('guide_help')}</p>
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{t('announcements')}</h3><button type="button" disabled={busy || form.announcements.length >= 30} className="min-h-11 rounded-xl border border-border px-4" onClick={() => setForm({ ...form, announcements: [...form.announcements, { id: crypto.randomUUID(), title: '', body: '', status: 'draft', starts_on: '', ends_on: '', attachment_id: null }] })}>{t('add')}</button></div>
      {form.announcements.map((item, index) => <fieldset disabled={busy} key={item.id} className="portal-notice space-y-4"><legend className="px-2 text-sm font-semibold">{t('announcement', { number: index + 1 })}</legend><label className="block text-sm">{t('heading')}<input required maxLength={180} value={item.title} onChange={event => update(index, { title: event.target.value })} className={field} /></label><label className="block text-sm">{t('content')}<textarea required maxLength={5000} rows={4} value={item.body} onChange={event => update(index, { body: event.target.value })} className={field} /></label>
        <div className="grid gap-4 sm:grid-cols-3"><label className="text-sm">{t('starts')}<input required={item.status === 'published'} type="date" value={item.starts_on} onChange={event => update(index, { starts_on: event.target.value })} className={field} /></label><label className="text-sm">{t('ends')}<input required={item.status === 'published'} type="date" min={item.starts_on} value={item.ends_on} onChange={event => update(index, { ends_on: event.target.value })} className={field} /></label><label className="text-sm">{t('status')}<select aria-label={t('announcement_status', { number: index + 1 })} value={item.status} onChange={event => update(index, { status: event.target.value as PortalAnnouncement['status'] })} className={field}><option value="draft">{t('draft')}</option><option value="published">{t('published')}</option><option value="archived">{t('archived')}</option></select></label></div>
        <label className="block text-sm">{t('pdf')}<select value={item.attachment_id || ''} onChange={event => update(index, { attachment_id: event.target.value || null })} className={field}><option value="">{t('no_attachment')}</option>{form.attachments?.map(file => <option key={file.id} value={file.id}>{file.name}</option>)}</select></label>
        {item.attachment_id && <a href={`${(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')}/admin/public-portal/attachments/${item.attachment_id}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline">{t('verify_pdf')}</a>}
        <label className="block text-sm">{t('upload')}<input type="file" accept="application/pdf" className={field} onChange={async event => { const file = event.target.files?.[0]; if (!file) return; setBusy(true); setError(''); try { const data = new FormData(); data.append('file', file); const response = await api.post('/admin/public-portal/attachments', data); setForm(previous => previous && ({ ...previous, attachments: [...(previous.attachments || []), response.data], announcements: previous.announcements.map((value, position) => position === index ? { ...value, attachment_id: response.data.id } : value) })); setMessage(t('uploaded')) } catch (failure: any) { setError(failure.response?.data?.message || t('upload_error')) } finally { setBusy(false) } }} /></label>
        <button type="button" onClick={() => setForm({ ...form, announcements: form.announcements.filter((_, position) => position !== index) })} className="min-h-11 text-sm text-destructive underline">{t('remove')}</button>
      </fieldset>)}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
      <div className="flex flex-wrap gap-3"><button disabled={busy} className="portal-action portal-action-primary disabled:opacity-50">{busy ? t('saving') : t('save')}</button><button type="button" disabled={busy} onClick={() => { void query.refetch() }} className="min-h-11 rounded-xl border border-border px-4 text-sm">{t('reload')}</button><a href="/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm text-primary underline">{t('view')}</a></div>
    </form>}
  </section>
}
