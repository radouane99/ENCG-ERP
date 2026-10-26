import CandidateProfileFields from './CandidateProfileFields'
import AdmissionAdministrativeSummary from './AdmissionAdministrativeSummary'
import candidateArabic from '../model/candidateArabic.json'
import AdmissionConsistencyAlerts from './AdmissionConsistencyAlerts'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdmissionDraftAutosave } from '../hooks/useAdmissionDraftAutosave'
import AdmissionFinalReview from './AdmissionFinalReview'
import { admissionCopy } from '../model/admissionCopy'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle, CheckCircle2, FileText, Loader2, Save, Upload,
  Sparkles, BrainCircuit, Check, Clock, ArrowRight, GraduationCap,
  CreditCard, Camera, FileCheck2, ShieldCheck, Eye, Trash2
} from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { toast } from 'sonner'
import api from '@shared/lib/api'
import { QRCodeSVG } from 'qrcode.react'
import PrepareDocumentImage from './PrepareDocumentImage'
import { ocrPrefill } from '../model/ocrPrefill'
import { useAdmissionDossier, errorMessage } from '../api/workflow'
import { dateText, dayText, profileLabels, documentLabels, documentLabelsAr, documentTypes, statusLabels, statusLabelsAr, workflowBase, type AdmissionDossier, type DocumentType, type OcrRun } from '../model/workflow'

const inputClass = 'w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400'
const buttonClass = 'min-h-11 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:opacity-95 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-2'
const panelClass = 'rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900/90'

const getDocIcon = (type: string) => {
  switch (type) {
    case 'bac':
      return GraduationCap
    case 'cnie':
    case 'cin':
      return CreditCard
    case 'photo':
      return Camera
    case 'releve_notes':
    case 'releve_parcours':
      return FileCheck2
    default:
      return FileText
  }
}
const eventLabels: Record<string, string> = { draft_saved: 'Brouillon enregistré', document_uploaded: 'Document ajouté', document_withdrawn: 'Document retiré', submitted: 'Dossier soumis', activated: 'Accès activé', needs_correction: 'Correction demandée', approved: 'Inscription validée', rejected: 'Décision enregistrée', document_reviewed: 'Document examiné', appointment_reserved: 'Rendez-vous réservé', checked_in: 'Entrée enregistrée', ocr_consented: 'Extraction demandée', ministry_imported: 'Liste officielle importée', waiting_invited: 'Invitation depuis la liste d’attente' }

export default function CandidateAdmissionWorkspace() {
  const { i18n } = useTranslation()
  const ar = i18n.language.startsWith('ar'); const copy = admissionCopy[ar ? 'ar' : 'fr']
  const docLabels = ar ? documentLabelsAr : documentLabels; const stateLabels = ar ? statusLabelsAr : statusLabels
  const tr = (value: string) => ar ? (candidateArabic as Record<string, string>)[value] || value : value
  const [reviewDossier, setReviewDossier] = useState<AdmissionDossier | null>(null)
  const query = useAdmissionDossier()
  const cache = useQueryClient()
  const app = query.data
  const [form, setForm] = useState<Record<string, string | number | boolean | null>>({})
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [consent, setConsent] = useState(true)
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
    const proposed = ocrPrefill(run, form, false)
    if (Object.keys(proposed).length) {
      setForm(previous => ({ ...previous, ...proposed }));
      setDirty(true);
      setPrefillNotice(ar ? `تم استخراج ${Object.keys(proposed).length} معلومة بالذكاء الاصطناعي وملؤها في الملف.` : `${Object.keys(proposed).length} champ(s) prérempli(s). Vérifiez les informations proposées.`);
      toast.success(ar ? `تم استخراج ${Object.keys(proposed).length} معلومة تلقائياً بالذكاء الاصطناعي!` : `${Object.keys(proposed).length} information(s) extraite(s) automatiquement par IA !`);
    }
  }, [run, app, form, cache, ar])
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    if (app && (initialId.current !== app.id || !dirty)) {
      const changedDossier = initialId.current !== app.id;
      initialId.current = app.id;
      let initialForm: Record<string, string | number | boolean | null> = {
        country: 'Maroc',
        nationality: 'Marocaine',
        nationality_ar: 'مغربية',
        ...app.profile,
        first_name: app.profile.first_name || app.first_name,
        last_name: app.profile.last_name || app.last_name,
        phone: app.profile.phone || app.phone || '',
        cin: app.profile.cin || app.cin || '',
        cne: app.profile.cne || app.cne || ''
      };

      if (app.ocr_runs && app.ocr_runs.length) {
        for (const ocr of [...app.ocr_runs].reverse()) {
          if (['needs_review', 'succeeded'].includes(ocr.status)) {
            const extracted = ocrPrefill(ocr, initialForm, false);
            initialForm = { ...initialForm, ...extracted };
          }
        }
      }

      setForm(initialForm);
      if (changedDossier && app.ocr_runs?.length) setRun(app.ocr_runs[0]);
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
      if (type !== 'photo') {
        try {
          toast.info(ar ? 'جاري استخراج البيانات بالذكاء الاصطناعي...' : 'Extraction IA des informations en cours...')
          const extraction = await api.post<OcrRun>(`${workflowBase}/ocr`, { application_id: app.id, document_id: r.data.document.id, mode, consent: true, consent_version: 'admissions-v1' })
          setRun({ ...extraction.data, document_id: r.data.document.id, fields: extraction.data.fields ?? {}, warnings: extraction.data.warnings ?? [] })
        } catch (e) { setError(`Le document est enregistré. Extraction : ${errorMessage(e)}`) }
      }
    })
  }
  if (query.isLoading) return <div className="p-10" role="status"><Loader2 className="animate-spin" /> Chargement du dossier…</div>
  if (!app) return <div className={panelClass}><h1 className="erp-page-title">{copy.title}</h1><p className="mt-3">{errorMessage(query.error)}</p><p className="mt-2 text-sm text-muted-foreground">Si vous êtes déjà étudiant, votre dossier académique reste accessible dans votre espace étudiant. Pour une nouvelle candidature, contactez le service admissions.</p><button className={`${buttonClass} mt-4`} onClick={() => void query.refetch()}>Réessayer</button></div>
  const invitationExpired = app.eligibility === 'invitation_expired' || (!!app.invitation_expires_at && new Date(app.invitation_expires_at).getTime() < Date.now())
  const editable = ['draft', 'needs_correction'].includes(app.dossier_status) && !invitationExpired
  const requiredDocuments: readonly DocumentType[] = app.required_documents ?? documentTypes
  const optionalDocuments: DocumentType[] = ['attestation_admission', 'attestation_admissibilite', ...(form.has_prior_higher_education || app.campaign.entry_route === 'cnaem' ? ['releve_parcours', 'diplome_bac2', 'diplome', 'licence'] as DocumentType[] : [])]
  const visibleDocuments = [...new Set<DocumentType>([...requiredDocuments, ...optionalDocuments, ...Object.keys(app.documents) as DocumentType[]])]
  const complete = requiredDocuments.filter(t => app.documents[t]).length
  return <main lang={ar ? 'ar' : 'fr'} dir={ar ? 'rtl' : 'ltr'} data-testid="candidate-admission-workspace" className="mx-auto max-w-6xl space-y-6 p-4 text-foreground dark:text-foreground sm:p-6 pb-52 lg:pb-28">
    {imagePreparation && <PrepareDocumentImage file={imagePreparation.file} photo={imagePreparation.type === 'photo'} ar={ar} onCancel={() => setImagePreparation(null)} onPrepared={file => { const type = imagePreparation.type; setImagePreparation(null); upload(type, file) }}/ >}
    {reviewDossier && <AdmissionFinalReview dossier={reviewDossier} ar={ar} busy={!!busy} error={error} onClose={() => { setReviewDossier(null); setError('') }} onEdit={key => { setReviewDossier(null); window.setTimeout(() => { const target = document.getElementById(`admission-${key}`); target?.scrollIntoView({ block: 'center', behavior: 'smooth' }); target?.focus() }, 0) }} onConfirm={() => void perform('submit', async () => { const r = await api.post(`${workflowBase}/submit`, { application_id: reviewDossier.id, version: reviewDossier.version }); update(r.data.candidate); setReviewDossier(null); toast.success(ar ? 'تم إرسال الملف.' : 'Dossier soumis.') })}/>}
    <header className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
      <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', transform: 'translateY(-50%)' }} />
      <div className="absolute bottom-0 right-10 w-64 h-64 rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }} />

      <div className="relative z-10 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 text-indigo-300 border border-white/15">
                🏛️ {app.campaign.name}
              </span>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5",
                app.dossier_status === 'draft' ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                app.dossier_status === 'approved' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                "bg-blue-500/20 text-blue-300 border-blue-500/30"
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {stateLabels[app.dossier_status]}
              </span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {copy.title}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 font-medium">
              <span className="font-mono text-indigo-200">{app.reference_number}</span> · CNE <span className="font-mono text-indigo-200">{app.cne}</span> · Échéance {dayText(app.campaign.close_date)}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 p-1 rounded-2xl border border-white/10 backdrop-blur-sm">
            {[['fr', 'Français'], ['ar', 'العربية']].map(([language, label]) => (
              <button
                key={language}
                type="button"
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  i18n.language.startsWith(language) ? "bg-white text-slate-900 shadow-sm" : "text-slate-300 hover:text-white"
                )}
                onClick={() => { localStorage.setItem('encg_lang', language); void i18n.changeLanguage(language) }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 4-Step Visual Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {([
            { num: 1, titleFr: 'Déposer les pièces', titleAr: 'إرفاق الوثائق', active: complete < requiredDocuments.length, done: complete === requiredDocuments.length },
            { num: 2, titleFr: 'Vérifier et compléter', titleAr: 'مراجعة المعلومات', active: complete === requiredDocuments.length && !app.submitted_at, done: !!app.submitted_at },
            { num: 3, titleFr: 'Obtenir ma fiche', titleAr: 'الحصول على الوصل', active: !!app.submitted_at && !['approved', 'rejected'].includes(app.dossier_status), done: app.dossier_status === 'approved' },
            { num: 4, titleFr: 'Présenter les originaux', titleAr: 'تقديم الأصول', active: app.dossier_status === 'approved', done: false }
          ]).map(step => (
            <div
              key={step.num}
              className={cn(
                "p-3 rounded-2xl border transition-all flex items-center gap-3",
                step.done
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                  : step.active
                  ? "bg-white/15 border-indigo-400/50 text-white shadow-sm ring-1 ring-indigo-400/30"
                  : "bg-white/5 border-white/10 text-slate-400"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0",
                step.done ? "bg-emerald-500 text-white" : step.active ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-400"
              )}>
                {step.done ? <Check size={14} /> : step.num}
              </div>
              <span className="text-xs font-bold leading-tight">
                {ar ? step.titleAr : step.titleFr}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>{stateLabels[app.eligibility]}</span>
            <span className="font-bold text-indigo-200">{complete} / {requiredDocuments.length} pièces déposées</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${(complete / Math.max(requiredDocuments.length, 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </header>
    {app.invitation_expires_at && <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{invitationExpired ? 'Votre invitation a expiré. Contactez le service admissions pour examiner les possibilités de renouvellement.' : `Confirmez et soumettez votre dossier avant le ${dateText(app.invitation_expires_at)}.`}</p>}
    {draft.error && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p>{copy.saveFailed} {draft.error}</p><button className="me-4 mt-2 min-h-11 underline" onClick={() => draft.conflict ? void reloadDraft() : draft.retry()}>{draft.conflict ? copy.reload : copy.retry}</button></div>}
    {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900"><AlertCircle className="shrink-0"/><div>{error}<button className="ms-3 underline" onClick={() => void reloadDraft()}>{tr("Actualiser")}</button></div></div>}
    {app.reviews.filter(r => r.reason).length > 0 && (
      <section className="rounded-2xl border border-amber-300 bg-amber-50/80 p-5 shadow-xs dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex items-center gap-2.5 font-bold text-amber-950 dark:text-amber-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <span>{tr("Demandes et observations de l’administration")}</span>
        </div>
        <div className="mt-3 space-y-2">
          {app.reviews.filter(r => r.reason).slice(0, 5).map(r => (
            <div key={r.id} className="rounded-xl border border-amber-200/80 bg-white/70 p-3 text-sm text-amber-900 shadow-2xs dark:border-amber-800/40 dark:bg-slate-900/40 dark:text-amber-200">
              <p>{r.reason}</p>
              <p className="mt-1 text-xs text-amber-700/70 dark:text-amber-400/60">· {dateText(r.created_at)}</p>
            </div>
          ))}
        </div>
      </section>
    )}

    <AdmissionConsistencyAlerts applicationId={app.id} showOriginals ar={ar}/>
    {prefillNotice && (
      <div role="status" className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/90 p-4 text-sm font-medium text-indigo-950 shadow-xs dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
        <Sparkles className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
        <p>{prefillNotice}</p>
      </div>
    )}

    {app.submitted_at && !['draft', 'rejected'].includes(app.dossier_status) && (
      <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-6 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-950 dark:text-emerald-200">{tr("Votre préinscription a été déposée")}</h2>
              <p className="mt-1 text-sm text-emerald-800/90 dark:text-emerald-300/80 leading-relaxed">
                {tr("Téléchargez votre fiche avec photo, informations déclarées et QR du dossier. Présentez-la avec les originaux au guichet pour la comparaison physique et numérique.")}
              </p>
            </div>
          </div>
          <a
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95 cursor-pointer"
            href={`${api.defaults.baseURL}${workflowBase}/receipt?application_id=${app.id}`}
            target="_blank"
            rel="noreferrer"
          >
            <FileText size={16} />
            {tr("Télécharger ma fiche de préinscription")}
          </a>
        </div>
      </section>
    )}

    <div className="grid gap-6 lg:grid-cols-[1.1fr_1.3fr]">
      {/* ── DOCUMENTS & PIÈCES JUSTIFICATIVES ── */}
      <section className={`${panelClass} order-1 flex flex-col justify-between`}>
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                {copy.documents}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {tr("PDF ou image lisible, 10 Mo maximum. CNIE : incluez les deux faces.")}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
              {complete} / {requiredDocuments.length}
            </span>
          </div>

          {/* AI Assistance Toggle Panel */}
          {editable && (
            <div className="mt-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-white p-4 shadow-2xs dark:border-indigo-900/40 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-slate-900">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                  <BrainCircuit className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={e => setConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug">
                      {tr("Préremplir les champs vides automatiquement après chaque dépôt par OCR intelligent.")}
                    </span>
                  </label>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <span className="shrink-0 font-medium">{tr("Mode de traitement")}:</span>
                    <select
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      value={mode}
                      onChange={e => { setMode(e.target.value as 'local' | 'cloud'); setConsent(false) }}
                    >
                      <option value="local">{tr("Local · document conservé sur le serveur")}</option>
                      {app.cloud_available && <option value="cloud">{tr("IA cloud · reconnaissance avancée")}</option>}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document Dropzone Cards */}
          <div className="mt-4 space-y-3.5">
            {visibleDocuments.map(type => {
              const doc = app.documents[type]
              const DocIcon = getDocIcon(type)
              const isVerified = doc?.status === 'verified'
              const isRejected = doc?.status === 'rejected'

              return (
                <article
                  id={`admission-doc-${type}`}
                  tabIndex={-1}
                  key={type}
                  className={cn(
                    'group rounded-2xl border p-4 transition-all duration-200 shadow-2xs',
                    doc
                      ? isVerified
                        ? 'border-emerald-200/90 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/10'
                        : isRejected
                        ? 'border-red-200/90 bg-red-50/30 dark:border-red-900/50 dark:bg-red-950/10'
                        : 'border-slate-200/90 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900/80'
                      : 'border-dashed border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/10 dark:border-slate-700 dark:bg-slate-900/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
                        isVerified
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : isRejected
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                          : doc
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      )}>
                        <DocIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {docLabels[type]} {!requiredDocuments.includes(type) && <span className="text-xs font-normal text-muted-foreground"> · {ar ? 'اختياري' : 'Facultatif'}</span>}
                        </h3>
                        {doc && (
                          <span className="text-[11px] text-muted-foreground">
                            Version {doc.version}{doc.updated_at || doc.created_at ? ` · ${dateText(doc.updated_at || doc.created_at)}` : (doc.original_filename ? ` · ${doc.original_filename}` : '')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {doc ? (
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border',
                          isVerified
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : isRejected
                            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300'
                            : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        )}>
                          {isVerified ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>{tr("Vérifié")}</span>
                            </>
                          ) : isRejected ? (
                            tr("À remplacer")
                          ) : (
                            tr("En attente")
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {tr("Requis")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar for Uploaded Doc */}
                  {doc && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800/60 text-xs">
                      <a
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                        href={doc.signed_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Eye size={13} />
                        {tr("Voir le document")}
                      </a>
                      {editable && type !== 'photo' && (
                        <button
                          disabled={!!busy || draft.saving || !consent || ['queued', 'processing'].includes(run?.status ?? '')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition-colors disabled:opacity-50 cursor-pointer"
                          onClick={() => void perform('ocr', async () => {
                            const r = await api.post<OcrRun>(`${workflowBase}/ocr`, { application_id: app.id, document_id: doc.id, mode, consent, consent_version: 'admissions-v1' });
                            setRun({ ...r.data, document_id: doc.id, fields: {}, warnings: [] })
                          })}
                        >
                          <Sparkles size={13} />
                          {tr("Proposer les champs")}
                        </button>
                      )}
                      {editable && !(app.dossier_status === 'needs_correction' && isVerified) && (
                        <button
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ms-auto cursor-pointer"
                          disabled={!!busy || draft.saving}
                          onClick={() => void perform('withdraw', async () => {
                            await api.delete(`${workflowBase}/documents`, { data: { application_id: app.id, version: app.version, type } });
                            await query.refetch()
                          })}
                        >
                          <Trash2 size={13} />
                          {tr("Retirer")}
                        </button>
                      )}
                    </div>
                  )}

                  {/* File Upload Trigger */}
                  {editable && !(app.dossier_status === 'needs_correction' && isVerified) && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                        {doc ? tr("Remplacer par une nouvelle version") : tr("Ajouter le document")}
                        <input
                          aria-label={`${doc ? 'Remplacer' : 'Ajouter'} ${docLabels[type]}`}
                          type="file"
                          accept={type === 'photo' ? 'image/jpeg,image/png,image/webp' : '.pdf,image/jpeg,image/png,image/webp'}
                          disabled={!!busy || draft.saving || ['queued', 'processing'].includes(run?.status ?? '')}
                          capture={type === 'photo' ? 'user' : undefined}
                          className="mt-1.5 block w-full text-xs text-slate-500 file:me-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3.5 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-200 cursor-pointer"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file?.type.startsWith('image/')) setImagePreparation({ type, file });
                            else upload(type, file);
                            e.target.value = ''
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {app.dossier_status === 'needs_correction' && isVerified && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5" />
                      {copy.retained}
                    </p>
                  )}
                  {isRejected && (
                    <p className="mt-2.5 rounded-xl bg-red-50 p-3 text-xs text-red-900 border border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900/40">
                      {app.reviews.find(r => r.document_id === doc.id && r.decision === 'rejected')?.reason || (ar ? 'استبدل هذه الوثيقة حسب طلب الإدارة.' : 'Remplacez cette pièce selon la demande de la scolarité.')}
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── INFORMATIONS PERSONNELLES (PROFIL) ── */}
      <section className={`${panelClass} order-2`}>
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            {copy.profile}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {tr("Les champs proposés par OCR restent à confirmer. Les identifiants officiels se corrigent auprès de l’administration.")}
          </p>
        </div>

        <form
          id="candidate-profile"
          className="mt-5"
          onSubmit={e => {
            e.preventDefault();
            void perform('save', async () => {
              await saveNow();
              toast.success('Brouillon enregistré')
            })
          }}
        >
          <CandidateProfileFields dossier={app} values={form} errors={draft.fieldErrors} disabled={!editable || !!busy} ar={ar} inputClass={inputClass} onChange={(key, value) => { setForm(f => ({ ...f, [key]: value })); setDirty(true) }} />
        </form>
        <AdmissionAdministrativeSummary dossier={app} ar={ar} />

        <details className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all dark:border-slate-800 dark:bg-slate-900/40">
          <summary className="cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
            {tr("Informations de santé et accessibilité · facultatif")}
          </summary>
          <p className="my-2 text-[11px] text-muted-foreground">
            {tr("Renseignez uniquement les informations utiles à l’accompagnement administratif. Elles ne sont pas transmises à l’OCR.")}
          </p>
          <div className="mt-3 space-y-3">
            {(['has_disability', 'has_medical_followup'] as const).map(key => <label key={key} className="flex items-start gap-3 text-sm"><input type="checkbox" disabled={!editable || !!busy} checked={!!form[key]} onChange={e => { setForm(f => ({ ...f, [key]: e.target.checked })); setDirty(true) }} />{key === 'has_disability' ? (ar ? 'أحتاج تهيئة خاصة للولوج' : 'Je souhaite un accompagnement d’accessibilité') : (ar ? 'لدي متابعة طبية' : 'Je bénéficie d’un suivi médical')}</label>)}
            {[
              ['allergy_type', 'Allergies à signaler'],
              ['disability_details', 'Besoins d’accessibilité'],
              ['medication_used', 'Traitement à signaler'],
              ['treating_doctor_info', 'Coordonnées du médecin traitant']
            ].map(([key, label]) => (
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300" key={key}>
                <span>{label}</span>
                <textarea
                  className={`${inputClass} mt-1 min-h-[70px] resize-y`}
                  disabled={!editable || !!busy}
                  value={String(form[key] ?? '')}
                  onChange={e => {
                    setForm(f => ({ ...f, [key]: e.target.value }));
                    setDirty(true)
                  }}
                />
                {draft.fieldErrors[key] && (
                  <span id={`error-${key}`} className="mt-1 block text-xs text-red-600 dark:text-red-400">
                    {ar ? 'راجع هذا الحقل: ' : ''}{draft.fieldErrors[key]}
                  </span>
                )}
              </label>
            ))}
          </div>
        </details>
      </section>
    </div>

    {/* ── PROPOSITIONS D'EXTRACTION OCR ── */}
    {run && Object.values(app.documents).some(doc => doc?.id === run.document_id) && (
      <section className={`${panelClass} border-indigo-200 bg-gradient-to-br from-indigo-50/20 to-white dark:border-indigo-900/60 dark:from-indigo-950/20`} aria-live="polite">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <h2 className="text-base font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            {tr("Propositions d’extraction OCR")}
          </h2>
          <span className="text-xs text-muted-foreground">Doc #{run.document_id}</span>
        </div>

        {['queued', 'processing'].includes(run.status) ? (
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <span>Traitement en cours. Vous pouvez continuer à saisir les champs.</span>
            <button
              className="ms-auto text-xs text-slate-500 underline hover:text-slate-800 cursor-pointer"
              onClick={() => void perform('cancel', async () => {
                await api.delete(`${workflowBase}/ocr/${run.id}`, { data: { application_id: app.id } });
                setRun({ ...run, status: 'cancelled' })
              })}
            >
              {tr("Annuler")}
            </button>
          </div>
        ) : (
          <>
            {editable && ['needs_review', 'succeeded'].includes(run.status) && Object.keys(ocrPrefill(run, {}, true)).length > 0 && (
              <button
                className={`${buttonClass} mt-4 shadow-indigo-600/20`}
                onClick={() => {
                  setForm(previous => ({ ...previous, ...ocrPrefill(run, previous, true) }));
                  setDirty(true);
                  setPrefillNotice('Propositions reportées. Vérifiez chaque information avant de soumettre votre dossier.')
                }}
              >
                <Sparkles size={16} />
                {tr("Reporter les propositions après vérification")}
              </button>
            )}
            {run.status === 'failed' && (
              <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
                {tr("Extraction indisponible. Saisissez les informations manuellement ou relancez depuis le document.")}
              </p>
            )}
            {run.warnings?.map(w => (
              <p key={w} className="mt-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
                {w}
              </p>
            ))}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(run.fields ?? {}).map(([key, field]) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 text-sm">
                  <div>
                    <p className="text-[11px] text-muted-foreground">{profileLabels[key] || key}</p>
                    <p className={field.conflict ? 'font-bold text-red-600' : 'font-semibold text-slate-900 dark:text-white'}>
                      {String(field.value)}
                    </p>
                  </div>
                  {!['cin', 'cne'].includes(key) && editable && (
                    <button
                      className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 cursor-pointer transition-colors"
                      onClick={() => {
                        const map: Record<string, string> = { first_name_fr: 'first_name', last_name_fr: 'last_name', bac_type: 'bac_series' };
                        setForm(f => ({ ...f, [map[key] || key]: field.value }));
                        setDirty(true)
                      }}
                    >
                      {tr("Utiliser")}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Source : version du document #{run.document_id}. Aucune précision chiffrée n’est garantie.
            </p>
          </>
        )}
      </section>
    )}

    {/* ── RENDEZ-VOUS & HISTORIQUE ── */}
    <div className="grid gap-6 md:grid-cols-2">
      <section className={panelClass}>
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          {tr("Rendez-vous au guichet")}
        </h2>
        {app.appointment && (
          <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-950 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-200">
            <span className="font-bold">{dateText(app.appointment.starts_at)}</span> · Guichet {app.appointment.desk}
            {app.appointment.checked_in_at && ' · Entrée enregistrée'}
          </div>
        )}
        {editable && app.eligibility === 'main' && (
          <label className="mt-4 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {tr("Choisir une disponibilité")}
            <select
              className={`${inputClass} mt-1`}
              value=""
              disabled={!!busy || draft.saving}
              onChange={e => {
                const slot = e.target.value;
                if (slot) void perform('appointment', async () => {
                  const r = await api.post(`${workflowBase}/appointments`, { application_id: app.id, version: app.version, slot_id: Number(slot) });
                  update(r.data.candidate)
                })
              }}
            >
              <option value="">{slots.length ? 'Sélectionner un créneau' : 'Aucun créneau publié pour le moment'}</option>
              {slots.filter(s => Number(s.reserved) < s.capacity).map(s => (
                <option key={s.id} value={s.id}>{dateText(s.starts_at)} · {s.desk} · {s.capacity - Number(s.reserved)} place(s)</option>
              ))}
            </select>
          </label>
        )}
        {app.appointment && (
          <div className="mt-4 rounded-2xl border bg-white p-4 text-center dark:bg-slate-900 shadow-2xs">
            <div className="inline-block p-2 rounded-xl bg-white border shadow-2xs">
              <QRCodeSVG value={app.appointment.entry_token} size={110} title="QR du rendez-vous" />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground break-all">Jeton : {app.appointment.entry_token}</p>
            <p className="mt-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">{tr("Présentez ce code au contrôle d’entrée.")}</p>
          </div>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">{tr("Présentez les originaux demandés. Le rendez-vous ne vaut pas validation définitive.")}</p>
      </section>

      <section className={panelClass}>
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-indigo-600" />
          {tr("Historique du dossier")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Dernier envoi : {app.notifications[0]?.status === 'sent' ? 'envoyé' : app.notifications[0]?.status === 'failed' ? 'échec' : app.notifications[0] ? 'en attente' : 'aucun'}
        </p>
        <ol className="mt-4 space-y-3">
          {app.events.slice(0, 6).map((e, i) => (
            <li key={`${e.type}-${i}`} className="flex items-start gap-3 text-xs">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                <CheckCircle2 size={13} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{eventLabels[e.type] || 'Dossier mis à jour'}</p>
                <p className="text-[11px] text-muted-foreground">{dateText(e.created_at)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>

    {/* ── FIXED BOTTOM ACTION DOCK ── */}
    <footer className="fixed bottom-16 lg:bottom-0 start-0 end-0 lg:start-[280px] z-40 border-t border-slate-200/90 bg-white/95 px-4 py-3 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full transition-all shrink-0",
            busy || draft.saving
              ? "bg-amber-400 animate-ping"
              : dirty
              ? "bg-amber-500 animate-pulse"
              : "bg-emerald-500 shadow-[0_0_10px_#10b981]"
          )} />
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{busy || draft.saving ? copy.saving : dirty ? copy.unsaved : copy.saved}</span>
              <span className="text-slate-400 font-normal">·</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{complete}/{requiredDocuments.length} {copy.pieces}</span>
            </div>
            {draft.savedAt && (
              <p className="text-[10px] text-muted-foreground">{copy.savedTime} : {dateText(draft.savedAt)}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {editable && (
            <>
              <button
                type="submit"
                form="candidate-profile"
                disabled={!!busy || draft.saving || draft.conflict || !dirty}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <Save size={15} />
                <span>{copy.save}</span>
              </button>
              <button
                disabled={!!busy || draft.saving || draft.conflict || app.eligibility !== 'main'}
                className={buttonClass}
                onClick={() => void perform('review', async () => {
                  const current = dirty ? await saveNow() : app;
                  setReviewDossier(current)
                })}
              >
                <Upload size={15} />
                <span>{copy.review}</span>
                <ArrowRight size={15} className="ms-0.5 rtl:rotate-180" />
              </button>
            </>
          )}
          {app.submitted_at && !['draft', 'rejected'].includes(app.dossier_status) && (
            <a
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 cursor-pointer"
              href={`${api.defaults.baseURL}${workflowBase}/receipt?application_id=${app.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <FileText size={15} />
              {tr("Fiche de préinscription")}
            </a>
          )}
        </div>
      </div>
    </footer>
  </main>
}
