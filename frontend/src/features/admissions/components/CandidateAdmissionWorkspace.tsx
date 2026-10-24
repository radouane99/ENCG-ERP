import AdmissionConsistencyAlerts from './AdmissionConsistencyAlerts'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdmissionDraftAutosave } from '../hooks/useAdmissionDraftAutosave'
import AdmissionFinalReview from './AdmissionFinalReview'
import { admissionCopy, admissionFieldsAr } from '../model/admissionCopy'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, FileText, Loader2, Save, Upload } from 'lucide-react'
import { toast } from 'sonner'
import api from '@shared/lib/api'
import { QRCodeSVG } from 'qrcode.react'
import PrepareDocumentImage from './PrepareDocumentImage'
import { ocrPrefill } from '../model/ocrPrefill'
import { useAdmissionDossier, errorMessage } from '../api/workflow'
import { dateText, dayText, profileLabels, documentLabels, documentLabelsAr, documentTypes, statusLabels, statusLabelsAr, workflowBase, type AdmissionDossier, type DocumentType, type OcrRun } from '../model/workflow'

const inputClass = 'w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'
const buttonClass = 'min-h-11 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50'
const panelClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900'
const fields = [
  ['first_name', 'Prénom', 'text'], ['last_name', 'Nom', 'text'], ['first_name_ar', 'الاسم الشخصي', 'text'], ['last_name_ar', 'النسب', 'text'],
  ['phone', 'Téléphone personnel', 'tel'], ['birth_date', 'Date de naissance', 'date'], ['birth_city', 'Lieu de naissance', 'text'], ['nationality', 'Nationalité', 'text'],
  ['address', 'Adresse', 'text'], ['city', 'Ville', 'text'], ['bac_average', 'Moyenne du bac /20', 'number'], ['bac_year', 'Année du bac', 'number'],
  ['bac_series', 'Série du bac', 'text'], ['high_school', 'Lycée', 'text'], ['academy', 'Académie', 'text'], ['province', 'Province', 'text'],
  ['emergency_contact_name', 'Contact d’urgence', 'text'], ['emergency_contact_phone', 'Téléphone d’urgence', 'tel'],
] as const
const eventLabels: Record<string, string> = { draft_saved: 'Brouillon enregistré', document_uploaded: 'Document ajouté', document_withdrawn: 'Document retiré', submitted: 'Dossier soumis', activated: 'Accès activé', needs_correction: 'Correction demandée', approved: 'Inscription validée', rejected: 'Décision enregistrée', document_reviewed: 'Document examiné', appointment_reserved: 'Rendez-vous réservé', checked_in: 'Entrée enregistrée', ocr_consented: 'Extraction demandée', ministry_imported: 'Liste officielle importée', waiting_invited: 'Invitation depuis la liste d’attente' }

export default function CandidateAdmissionWorkspace() {
  const { i18n } = useTranslation()
  const ar = i18n.language.startsWith('ar'); const copy = admissionCopy[ar ? 'ar' : 'fr']
  const docLabels = ar ? documentLabelsAr : documentLabels; const stateLabels = ar ? statusLabelsAr : statusLabels
  const [reviewDossier, setReviewDossier] = useState<AdmissionDossier | null>(null)
  const query = useAdmissionDossier()
  const cache = useQueryClient()
  const app = query.data
  const [form, setForm] = useState<Record<string, string | number | boolean | null>>({})
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [consent, setConsent] = useState(false)
  const [mode, setMode] = useState<'local' | 'cloud'>('local')
  const [run, setRun] = useState<OcrRun | null>(null)
  const [prefillNotice, setPrefillNotice] = useState('')
  const appliedRun = useRef<string | null>(null)
  const [imagePreparation, setImagePreparation] = useState<{ type: DocumentType; file: File } | null>(null)
  const [slots, setSlots] = useState<{ id: number; starts_at: string; desk: string; capacity: number; reserved: number }[]>([])
  const initialId = useRef<number | null>(null)
  const mounted = useRef(true)
  const campaignId = app?.campaign.id
  useEffect(() => { if (app?.id) void cache.invalidateQueries({ queryKey: ['admission-operations', app.id] }) }, [app?.id, app?.version, cache])
  useEffect(() => {
    if (!run || !app || !['needs_review', 'succeeded'].includes(run.status) || !['draft', 'needs_correction'].includes(app.dossier_status)) return
    if (appliedRun.current === run.id || !Object.values(app.documents).some(doc => doc?.id === run.document_id)) return
    appliedRun.current = run.id
    void cache.invalidateQueries({ queryKey: ['admission-operations', app.id] })
    const proposed = ocrPrefill(run, form)
    if (Object.keys(proposed).length) {
      setForm(previous => ({ ...previous, ...proposed })); setDirty(true)
      setPrefillNotice(`${Object.keys(proposed).length} champ(s) prérempli(s). Comparez-les à votre document, puis enregistrez votre brouillon.`)
    }
  }, [run, app, form, cache])
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    if (app && (initialId.current !== app.id || !dirty)) {
      const changedDossier = initialId.current !== app.id; initialId.current = app.id
      setForm({ ...app.profile, first_name: app.profile.first_name || app.first_name, last_name: app.profile.last_name || app.last_name, phone: app.profile.phone || app.phone || '' })
      if (changedDossier && app.ocr_runs?.length) setRun(app.ocr_runs[0])
    }
  }, [app, dirty])
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  useEffect(() => {
    if (!campaignId) return
    const controller = new AbortController()
    api.get(`${workflowBase}/slots`, { params: { campaign_id: campaignId }, signal: controller.signal }).then(r => setSlots(r.data.data)).catch(() => {})
    return () => controller.abort()
  }, [campaignId])
  useEffect(() => {
    if (!run || !['queued', 'processing'].includes(run.status)) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => api.get<OcrRun>(`${workflowBase}/ocr/${run.id}`, { signal: controller.signal }).then(r => setRun(r.data)).catch(e => { if (!controller.signal.aborted) setError(errorMessage(e)) }), 1800)
    return () => { clearTimeout(timer); controller.abort() }
  }, [run])
  const update = useCallback((next: AdmissionDossier) => { cache.setQueryData(['admission-dossier', 'mine'], next) }, [cache])
  const draft = useAdmissionDraftAutosave(app, form, dirty, setDirty, !!busy || !!reviewDossier, update)
  const saveNow = draft.save
  const reloadDraft = async () => {
    const result = await query.refetch()
    if (result.data) { setForm({ ...result.data.profile, first_name: result.data.profile.first_name || result.data.first_name, last_name: result.data.profile.last_name || result.data.last_name, phone: result.data.profile.phone || result.data.phone || '' }); setDirty(false); draft.reset() }
  }
  const perform = async (label: string, action: () => Promise<void>) => {
    setBusy(label); setError('')
    try { await action() } catch (e) { setError(errorMessage(e)) } finally { if (mounted.current) setBusy(null) }
  }
  const upload = (type: DocumentType, file?: File) => {
    if (!file || !app) return
    void perform(type, async () => {
      if (file.size > 10 * 1024 * 1024) throw new Error('Le fichier dépasse 10 Mo.')
      const data = new FormData()
      data.append('application_id', String(app.id)); data.append('version', String(app.version)); data.append('type', type); data.append('file', file)
      const r = await api.post<{ candidate: AdmissionDossier; document: { id: number } }>(`${workflowBase}/documents`, data)
      update(r.data.candidate); toast.success('Document enregistré.')
      if (consent && type !== 'photo') {
        try {
          const extraction = await api.post<OcrRun>(`${workflowBase}/ocr`, { application_id: app.id, document_id: r.data.document.id, mode, consent, consent_version: 'admissions-v1' })
          setRun({ ...extraction.data, document_id: r.data.document.id, fields: extraction.data.fields ?? {}, warnings: extraction.data.warnings ?? [] })
        } catch (e) { setError(`Le document est enregistré. Extraction : ${errorMessage(e)}`) }
      }
    })
  }
  if (query.isLoading) return <div className="p-10" role="status"><Loader2 className="animate-spin" /> Chargement du dossier…</div>
  if (!app) return <div className={panelClass}><h1 className="text-xl font-bold">{copy.title}</h1><p className="mt-3">{errorMessage(query.error)}</p><p className="mt-2 text-sm text-slate-500">Si vous êtes déjà étudiant, votre dossier académique reste accessible dans votre espace étudiant. Pour une nouvelle candidature, contactez le service admissions.</p><button className={`${buttonClass} mt-4`} onClick={() => void query.refetch()}>Réessayer</button></div>
  const invitationExpired = app.eligibility === 'invitation_expired' || (!!app.invitation_expires_at && new Date(app.invitation_expires_at).getTime() < Date.now())
  const editable = ['draft', 'needs_correction'].includes(app.dossier_status) && !invitationExpired
  const requiredDocuments = app.required_documents ?? documentTypes
  const complete = requiredDocuments.filter(t => app.documents[t]).length
  return <main lang={ar ? 'ar' : 'fr'} dir={ar ? 'rtl' : 'ltr'} data-testid="candidate-admission-workspace" className="mx-auto max-w-6xl space-y-5 p-4 text-slate-800 dark:text-slate-100 sm:p-6">
    {imagePreparation && <PrepareDocumentImage file={imagePreparation.file} photo={imagePreparation.type === 'photo'} ar={ar} onCancel={() => setImagePreparation(null)} onPrepared={file => { const type = imagePreparation.type; setImagePreparation(null); upload(type, file) }}/ >}
    {reviewDossier && <AdmissionFinalReview dossier={reviewDossier} ar={ar} busy={!!busy} error={error} onClose={() => { setReviewDossier(null); setError('') }} onEdit={key => { setReviewDossier(null); window.setTimeout(() => { const target = document.getElementById(`admission-${key}`); target?.scrollIntoView({ block: 'center', behavior: 'smooth' }); target?.focus() }, 0) }} onConfirm={() => void perform('submit', async () => { const r = await api.post(`${workflowBase}/submit`, { application_id: reviewDossier.id, version: reviewDossier.version }); update(r.data.candidate); setReviewDossier(null); toast.success(ar ? 'تم إرسال الملف.' : 'Dossier soumis.') })}/>}
    <header className={`${panelClass} border-t-4 border-t-blue-900`}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-blue-700">{app.campaign.name}</p><h1 className="mt-2 text-2xl font-bold">{copy.title}</h1><p className="mt-2 text-sm text-slate-500">{app.reference_number} · CNE {app.cne} · Échéance {dayText(app.campaign.close_date)}</p></div><span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-900">{stateLabels[app.dossier_status]}</span></div>
      <div className="mt-4 flex gap-2" aria-label="Langue du dossier">{[['fr', 'Français'], ['ar', 'العربية']].map(([language, label]) => <button key={language} type="button" aria-pressed={i18n.language.startsWith(language)} className="min-h-11 rounded-lg border px-4 text-sm" onClick={() => { localStorage.setItem('encg_lang', language); void i18n.changeLanguage(language) }}>{label}</button>)}</div><p className="mt-3 text-xs text-slate-500">{copy.autosave}</p>
      <ol className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4" aria-label="Étapes du dossier">{(ar ? ['1 · إرفاق الوثائق', '2 · مراجعة المعلومات واستكمالها', '3 · الحصول على الوصل', '4 · تقديم الأصول'] : ['1 · Déposer les pièces', '2 · Vérifier et compléter', '3 · Obtenir ma fiche', '4 · Présenter les originaux']).map(x => <li key={x} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">{x}</li>)}</ol>
      <p className="mt-4 text-sm">{stateLabels[app.eligibility]} · {complete}/{requiredDocuments.length} pièces ajoutées. L’extraction facilite la saisie ; le service admissions vérifie votre dossier.</p>
    </header>
    {app.invitation_expires_at && <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{invitationExpired ? 'Votre invitation a expiré. Contactez le service admissions pour examiner les possibilités de renouvellement.' : `Confirmez et soumettez votre dossier avant le ${dateText(app.invitation_expires_at)}.`}</p>}
    {draft.error && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p>{copy.saveFailed} {draft.error}</p><button className="me-4 mt-2 min-h-11 underline" onClick={() => draft.conflict ? void reloadDraft() : draft.retry()}>{draft.conflict ? copy.reload : copy.retry}</button></div>}
    {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900"><AlertCircle className="shrink-0"/><div>{error}<button className="ms-3 underline" onClick={() => void reloadDraft()}>Actualiser</button></div></div>}
    {app.reviews.filter(r => r.reason).length > 0 && <section className={`${panelClass} border-amber-300`}><h2 className="font-bold">Demandes et observations de l’administration</h2>{app.reviews.filter(r => r.reason).slice(0, 5).map(r => <p key={r.id} className="mt-2 text-sm">{r.reason} <span className="text-slate-500">· {dateText(r.created_at)}</span></p>)}</section>}
    <AdmissionConsistencyAlerts applicationId={app.id} showOriginals/>
    {prefillNotice && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">{prefillNotice}</p>}
    {app.submitted_at && !['draft', 'rejected'].includes(app.dossier_status) && <section className={`${panelClass} border-emerald-300`}><h2 className="font-bold">Votre préinscription a été déposée</h2><p className="mt-2 text-sm">Téléchargez votre fiche avec photo, informations déclarées et QR du dossier. Présentez-la avec les originaux au guichet pour la comparaison physique et numérique.</p><a className={`${buttonClass} mt-4 inline-flex items-center`} href={`${api.defaults.baseURL}${workflowBase}/receipt?application_id=${app.id}`} target="_blank" rel="noreferrer">Télécharger ma fiche de préinscription</a></section>}
    <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
      <section className={`${panelClass} order-2`}><h2 className="text-lg font-bold">{copy.profile}</h2><p className="mb-5 mt-1 text-sm text-slate-500">Les champs proposés par OCR restent à confirmer. Les identifiants officiels se corrigent auprès de l’administration.</p>
        <form id="candidate-profile" onSubmit={e => { e.preventDefault(); void perform('save', async () => { await saveNow(); toast.success('Brouillon enregistré') }) }}>
          <fieldset disabled={!editable || !!busy} className="grid gap-4 sm:grid-cols-2">{fields.map(([key, label, type]) => <label key={key} className="block text-sm font-medium" htmlFor={`admission-${key}`}>{ar ? admissionFieldsAr[key] || label : label}<input id={`admission-${key}`} aria-invalid={!!draft.fieldErrors[key]} aria-describedby={draft.fieldErrors[key] ? `error-${key}` : undefined} type={type} lang={key.endsWith('_ar') ? 'ar' : 'fr'} dir={key.endsWith('_ar') ? 'rtl' : undefined} min={key === 'bac_average' ? 0 : undefined} max={key === 'bac_average' ? 20 : undefined} step={key === 'bac_average' ? '0.01' : undefined} className={`${inputClass} mt-1`} value={String(form[key] ?? '')} onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setDirty(true) }} />{draft.fieldErrors[key] && <span id={`error-${key}`} className="mt-1 block text-xs text-red-700 dark:text-red-300">{ar ? 'راجع هذا الحقل: ' : ''}{draft.fieldErrors[key]}</span>}</label>)}
          <label className="block text-sm font-medium" htmlFor="admission-gender">{copy.gender}<select id="admission-gender" className={`${inputClass} mt-1`} value={String(form.gender ?? '')} onChange={e => { setForm(f => ({ ...f, gender: e.target.value })); setDirty(true) }}><option value="">{copy.choose}</option><option value="female">{copy.female}</option><option value="male">{copy.male}</option></select></label></fieldset>
        </form>
        <details className="mt-5 border-t pt-4"><summary className="cursor-pointer text-sm font-semibold">Informations de santé et accessibilité · facultatif</summary><p className="my-2 text-xs text-slate-500">Renseignez uniquement les informations utiles à l’accompagnement administratif. Elles ne sont pas transmises à l’OCR.</p>{[['allergy_type', 'Allergies à signaler'], ['disability_details', 'Besoins d’accessibilité'], ['medication_used', 'Traitement à signaler']].map(([key, label]) => <label className="mt-3 block text-sm" key={key}>{label}<textarea className={`${inputClass} mt-1`} disabled={!editable || !!busy} value={String(form[key] ?? '')} onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setDirty(true) }} />{draft.fieldErrors[key] && <span id={`error-${key}`} className="mt-1 block text-xs text-red-700 dark:text-red-300">{ar ? 'راجع هذا الحقل: ' : ''}{draft.fieldErrors[key]}</span>}</label>)}</details>
      </section>
      <section className={`${panelClass} order-1`}><h2 className="text-lg font-bold">{copy.documents}</h2><p className="mt-1 text-sm text-slate-500">PDF ou image lisible, 10 Mo maximum. CNIE : incluez les deux faces dans le même document. Photo : JPG, PNG ou WEBP.</p>
        {editable && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800"><label className="flex gap-3"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0"/><span>Préremplir les champs vides automatiquement après chaque dépôt. Je vérifie les propositions avant enregistrement ; la saisie manuelle reste disponible.</span></label><label className="mt-3 block">Mode de traitement<select className={`${inputClass} mt-1`} value={mode} onChange={e => { setMode(e.target.value as 'local' | 'cloud'); setConsent(false) }}><option value="local">Local · document conservé sur le serveur</option>{app.cloud_available && <option value="cloud">IA cloud · texte documentaire envoyé au fournisseur configuré</option>}</select></label></div>}
        <div className="mt-4 space-y-3">{requiredDocuments.map(type => { const doc = app.documents[type]; return <article id={`admission-doc-${type}`} tabIndex={-1} key={type} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex justify-between gap-2"><h3 className="font-semibold">{docLabels[type]}</h3>{doc && <span className="text-xs">v{doc.version} · {doc.status === 'verified' ? 'Vérifié' : doc.status === 'rejected' ? 'À remplacer' : 'À examiner'}</span>}</div>
          {doc && <div className="mt-3 flex flex-wrap gap-3 text-sm"><a className="inline-flex min-h-11 items-center gap-2 text-blue-700 underline dark:text-blue-300" href={doc.signed_url} target="_blank" rel="noreferrer"><FileText size={16}/>Voir le document</a>{editable && type !== 'photo' && <button disabled={!!busy || !consent || ['queued', 'processing'].includes(run?.status ?? '')} className="min-h-11 text-blue-700 underline disabled:text-slate-400" onClick={() => void perform('ocr', async () => { const r = await api.post<OcrRun>(`${workflowBase}/ocr`, { application_id: app.id, document_id: doc.id, mode, consent, consent_version: 'admissions-v1' }); setRun({ ...r.data, document_id: doc.id, fields: {}, warnings: [] }) })}>Proposer les champs</button>}{editable && !(app.dossier_status === 'needs_correction' && doc.status === 'verified') && <button className="min-h-11 text-red-700 underline" disabled={!!busy} onClick={() => void perform('withdraw', async () => { await api.delete(`${workflowBase}/documents`, { data: { application_id: app.id, version: app.version, type } }); await query.refetch() })}>Retirer</button>}</div>}
          {editable && !(app.dossier_status === 'needs_correction' && doc?.status === 'verified') && <label className="mt-3 block text-xs text-slate-600">{doc ? 'Remplacer par une nouvelle version' : 'Ajouter le document'}<input aria-label={`${doc ? 'Remplacer' : 'Ajouter'} ${docLabels[type]}`} type="file" accept={type === 'photo' ? 'image/jpeg,image/png,image/webp' : '.pdf,image/jpeg,image/png,image/webp'} disabled={!!busy || draft.saving || ['queued', 'processing'].includes(run?.status ?? '')} capture={type === 'photo' ? 'user' : undefined} className="mt-2 block w-full text-sm file:me-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-3" onChange={e => { const file = e.target.files?.[0]; if (file?.type.startsWith('image/')) setImagePreparation({ type, file }); else upload(type, file); e.target.value = '' }} /></label>}{app.dossier_status === 'needs_correction' && doc?.status === 'verified' && <p className="mt-3 text-xs text-emerald-700">{copy.retained}</p>}{doc?.status === 'rejected' && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{app.reviews.find(r => r.document_id === doc.id && r.decision === 'rejected')?.reason || (ar ? 'استبدل هذه الوثيقة حسب طلب الإدارة.' : 'Remplacez cette pièce selon la demande de la scolarité.')}</p>}</article> })}</div>

      </section>
    </div>
    {run && Object.values(app.documents).some(doc => doc?.id === run.document_id) && <section className={panelClass} aria-live="polite"><h2 className="font-bold">Propositions d’extraction</h2>{['queued', 'processing'].includes(run.status) ? <p className="mt-3 flex items-center gap-2"><Loader2 className="animate-spin" size={18}/>Traitement en cours. Vous pouvez continuer à saisir les champs.<button className="ms-auto underline" onClick={() => void perform('cancel', async () => { await api.delete(`${workflowBase}/ocr/${run.id}`, { data: { application_id: app.id } }); setRun({ ...run, status: 'cancelled' }) })}>Annuler</button></p> : <>
      {editable && ['needs_review', 'succeeded'].includes(run.status) && Object.keys(ocrPrefill(run, {}, true)).length > 0 && <button className={`${buttonClass} mt-3`} onClick={() => { setForm(previous => ({ ...previous, ...ocrPrefill(run, previous, true) })); setDirty(true); setPrefillNotice('Propositions reportées. Vérifiez chaque information avant de soumettre votre dossier.') }}>Reporter les propositions après vérification</button>}
      {run.status === 'failed' && <p role="alert" className="mt-3 text-red-700">Extraction indisponible. Saisissez les informations manuellement ou relancez depuis le document.</p>}
      {run.warnings?.map(w => <p key={w} className="mt-2 text-sm text-amber-800 dark:text-amber-300">{w}</p>)}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(run.fields ?? {}).map(([key, field]) => <div key={key} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><div><p className="text-xs text-slate-500">{profileLabels[key] || key}</p><p className={field.conflict ? 'font-bold text-red-700' : 'font-medium'}>{String(field.value)}</p></div>{!['cin', 'cne'].includes(key) && editable && <button className="min-h-11 text-blue-700 underline" onClick={() => { const map: Record<string, string> = { first_name_fr: 'first_name', last_name_fr: 'last_name', bac_type: 'bac_series' }; setForm(f => ({ ...f, [map[key] || key]: field.value })); setDirty(true) }}>Utiliser</button>}</div>)}</div><p className="mt-3 text-xs text-slate-500">Source : version du document #{run.document_id}. Aucune précision chiffrée n’est garantie.</p>
    </>}</section>}
    <div className="grid gap-5 md:grid-cols-2"><section className={panelClass}><h2 className="font-bold">Rendez-vous au guichet</h2>{app.appointment && <p className="mt-3 text-sm">{dateText(app.appointment.starts_at)} · {app.appointment.desk}{app.appointment.checked_in_at && ' · Entrée enregistrée'}</p>}{editable && app.eligibility === 'main' && <label className="mt-4 block text-sm">Choisir une disponibilité<select className={`${inputClass} mt-1`} value="" disabled={!!busy} onChange={e => { const slot = e.target.value; if (slot) void perform('appointment', async () => { const r = await api.post(`${workflowBase}/appointments`, { application_id: app.id, version: app.version, slot_id: Number(slot) }); update(r.data.candidate) }) }}><option value="">{slots.length ? 'Sélectionner un créneau' : 'Aucun créneau publié pour le moment'}</option>{slots.filter(s => Number(s.reserved) < s.capacity).map(s => <option key={s.id} value={s.id}>{dateText(s.starts_at)} · {s.desk} · {s.capacity - Number(s.reserved)} place(s)</option>)}</select></label>}{app.appointment && <div className="mt-4 rounded-lg border bg-white p-4 text-slate-900"><QRCodeSVG value={app.appointment.entry_token} size={120} title="QR du rendez-vous"/><p className="mt-2 break-all text-xs">Jeton personnel : {app.appointment.entry_token}</p><p className="mt-2 text-xs text-slate-500">Présentez ce code au contrôle d’entrée.</p></div>}<p className="mt-3 text-xs text-slate-500">Présentez les originaux demandés. Le rendez-vous ne vaut pas validation définitive.</p></section>
    <section className={panelClass}><h2 className="font-bold">Historique du dossier</h2><p className="mt-2 text-xs text-slate-500">Dernier envoi : {app.notifications[0]?.status === 'sent' ? 'envoyé' : app.notifications[0]?.status === 'failed' ? 'échec, le service peut relancer' : app.notifications[0] ? 'en attente' : 'aucun'}</p><ol className="mt-3 space-y-3">{app.events.slice(0, 8).map((e, i) => <li key={`${e.type}-${i}`} className="flex gap-3 text-sm"><CheckCircle2 size={16} className="mt-1 shrink-0 text-blue-700"/><div>{eventLabels[e.type] || 'Dossier mis à jour'}<p className="text-xs text-slate-500">{dateText(e.created_at)}</p></div></li>)}</ol></section></div>
    <footer className={`${panelClass} sm:sticky sm:bottom-2 z-10 flex flex-wrap items-center justify-between gap-3 border-blue-200`}><p className="text-sm" role="status">{busy || draft.saving ? copy.saving : dirty ? copy.unsaved : copy.saved} · {complete}/{requiredDocuments.length} {copy.pieces}{draft.savedAt && <span className="mt-1 block text-xs text-slate-500">{copy.savedTime} : {dateText(draft.savedAt)}</span>}</p><div className="flex flex-wrap gap-2">{editable && <><button type="submit" form="candidate-profile" disabled={!!busy || draft.saving || draft.conflict || !dirty} className={buttonClass}><Save className="me-2 inline" size={16}/>{copy.save}</button><button disabled={!!busy || draft.saving || draft.conflict || app.eligibility !== 'main'} className={buttonClass} onClick={() => void perform('review', async () => { const current = dirty ? await saveNow() : app; setReviewDossier(current) })}><Upload className="me-2 inline" size={16}/>{copy.review}</button></>}{app.submitted_at && !['draft', 'rejected'].includes(app.dossier_status) && <a className={`${buttonClass} inline-flex items-center`} href={`${api.defaults.baseURL}${workflowBase}/receipt?application_id=${app.id}`} target="_blank" rel="noreferrer">Fiche de préinscription</a>}</div></footer>
  </main>
}
