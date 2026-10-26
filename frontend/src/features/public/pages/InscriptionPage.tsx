import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ShieldCheck, FileCheck2 } from 'lucide-react'
import api from '@shared/lib/api'
import { useAuthStore } from '@stores/authStore'
import CandidateAdmissionWorkspace from '@features/admissions/components/CandidateAdmissionWorkspace'
import { useAdmissionCalendar } from '../api/useAdmissionCalendar'
import AdmissionCalendarPanel from '../components/AdmissionCalendarPanel'
import { errorMessage } from '@features/admissions/api/workflow'

export default function InscriptionPage(_props: { editMode?: boolean }) {
  const calendar = useAdmissionCalendar()
  const [selectedCampaign, setSelectedCampaign] = useState(() => new URLSearchParams(window.location.search).get('campaign_id') || '')
  const activeCampaigns = calendar.isError ? [] : (calendar.data?.campaigns.filter(campaign => campaign.state === 'open') || [])
  const campaignId = selectedCampaign || String(activeCampaigns[0]?.id || '')
  const canRegister = activeCampaigns.some(campaign => String(campaign.id) === campaignId)
  const authenticated = useAuthStore(s => s.isAuthenticated)
  const completeSession = useAuthStore(s => s.completeSession)
  const navigate = useNavigate()
  const [token] = useState(() => { const value = new URLSearchParams(window.location.search).get('activation'); if (value) window.history.replaceState(null, '', '/inscription'); return value })
  const [tab, setTab] = useState<'activation' | 'register'>('activation')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [form, setForm] = useState({ cne: '', cin: '', first_name: '', last_name: '', email: '', password: '', password_confirmation: '' })
  const input = 'mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600'
  if (authenticated) return <CandidateAdmissionWorkspace />
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      if (!token && !canRegister) throw new Error('Cette session n’est pas ouverte. Consultez le calendrier des inscriptions.')
      if (token) {
        await api.post('/public/admissions/activate', { token, password: form.password, password_confirmation: form.password_confirmation })
        window.history.replaceState(null, '', '/inscription')
        await completeSession(); navigate('/dashboard', { replace: true })
      } else if (tab === 'activation') {
        const r = await api.post('/public/admissions/request-activation', { cne: form.cne, cin: form.cin, campaign_id: Number(campaignId) })
        setMessage(r.data.message)
      } else {
        if (!consent) throw new Error('Confirmez la création et le traitement administratif de votre dossier.')
        await api.post('/v1/auth/register', { ...form, campaign_id: Number(campaignId) })
        await completeSession(); navigate('/dashboard', { replace: true })
      }
    } catch (e) { setError(errorMessage(e)) } finally { setBusy(false) }
  }
  return <main data-testid="tafem-inscription-page" className="min-h-screen bg-muted/50 px-4 py-10 text-foreground dark:bg-background">
    <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid lg:grid-cols-[.9fr_1.1fr]">
      <aside className="bg-blue-950 p-7 text-white sm:p-10"><p className="text-xs font-bold uppercase tracking-widest text-blue-200">ENCG · Admissions</p><h1 className="mt-6 leading-tight erp-page-title">Admissions TAFEM / CNAEM</h1><p className="mt-5 leading-relaxed text-blue-100">Un seul espace pour compléter votre dossier, vérifier vos documents et suivre chaque étape de votre inscription.</p>
        <ol className="mt-8 space-y-5 text-sm">{['Activez votre accès personnel', 'Ajoutez les documents et confirmez vos informations', 'Soumettez votre dossier complet', 'Suivez la revue et votre rendez-vous'].map((text, i) => <li key={text} className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-400">{i + 1}</span><span className="pt-1">{text}</span></li>)}</ol><p className="mt-8 text-sm text-blue-200" lang="ar" dir="rtl">يمكنكم إدخال المعلومات يدوياً ومراجعة الوثائق قبل إرسال الملف. تواصلوا مع مصلحة التسجيل عند الحاجة.</p>
      </aside>
      <section className="p-7 sm:p-10"><ShieldCheck className="text-primary"/><h2 className="mt-4 text-xl font-bold">{token ? 'Activer mon dossier' : 'Mon accès personnel'}</h2>
        {!token && <AdmissionCalendarPanel compact />}
        {!token && activeCampaigns.length > 0 && <label className="my-4 block text-sm">Session d’inscription<select aria-label="Session d’inscription" value={campaignId} onChange={event => setSelectedCampaign(event.target.value)} className={input}>{!canRegister && <option value={campaignId}>Session indisponible — choisissez une session ouverte</option>}{activeCampaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name} · {campaign.entry_route.toUpperCase()} · S{campaign.entry_semester}</option>)}</select></label>}
        {(token || canRegister) && <>
        {!token && <div className="mt-5 flex gap-2" role="tablist" aria-label="Accès inscription">{[['activation', 'Déjà sur la liste officielle'], ['register', 'Créer un compte']].map(([value, label]) => <button key={value} role="tab" aria-selected={tab === value} className={`min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${tab === value ? "bg-secondary text-white" : "bg-muted"}`} onClick={() => { setTab(value as typeof tab); setError(''); setMessage('') }}>{label}</button>)}</div>}
        <p className="my-5 text-sm leading-relaxed text-muted-foreground">{token ? 'Ce lien est personnel et utilisable une seule fois. Choisissez votre mot de passe.' : tab === 'activation' ? 'Le lien sera envoyé uniquement au contact personnel vérifié par le service admissions. Si aucun contact n’est encore vérifié, présentez-vous au service avec vos justificatifs.' : 'Un compte permet de préparer un brouillon. L’inscription définitive reste soumise à l’admissibilité officielle et à la vérification des pièces.'}</p>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}{message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
        <form onSubmit={e => void submit(e)} className="space-y-4"><fieldset disabled={busy} className="space-y-4">
          {!token && <div className="grid gap-4 sm:grid-cols-2">{[['cne', 'CNE / Code Massar'], ['cin', 'Numéro CNIE']].map(([key, label]) => <label className="block text-sm font-medium" key={key}>{label}<input required autoComplete="off" className={input} maxLength={30} value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value.toUpperCase().trim() }))}/></label>)}</div>}
          {!token && tab === 'register' && <>{[['first_name', 'Prénom'], ['last_name', 'Nom'], ['email', 'Email personnel']].map(([key, label]) => <label className="block text-sm font-medium" key={key}>{label}<input required type={key === 'email' ? 'email' : 'text'} autoComplete={key === 'email' ? 'email' : key === 'first_name' ? 'given-name' : 'family-name'} className={input} value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}/></label>)}</>}
          {(!!token || tab === 'register') && <>{[['password', 'Mot de passe'], ['password_confirmation', 'Confirmer le mot de passe']].map(([key, label]) => <label className="block text-sm font-medium" key={key}>{label}<input required type="password" minLength={8} autoComplete="new-password" className={input} value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}/></label>)}</>}
          {!token && tab === 'register' && <label className="flex gap-3 text-sm text-muted-foreground"><input required type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0"/>Je demande la création de mon dossier et le traitement de mes données pour mon inscription. L’extraction OCR reste facultative et se demande séparément.</label>}
          <button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18}/> : <FileCheck2 size={18}/>} {token ? 'Activer mon accès' : tab === 'activation' ? 'Demander le lien d’activation' : 'Créer mon compte et préparer le dossier'}</button>
        </fieldset></form>
        </>}<p className="mt-6 text-center text-sm text-muted-foreground">Un compte existe déjà ? <a href="/login" className="min-h-11 font-semibold text-primary underline">Se connecter</a></p><a className="mt-5 block text-center text-sm text-muted-foreground underline" href="/">Retour à l’accueil</a>
      </section>
    </div>
  </main>
}
