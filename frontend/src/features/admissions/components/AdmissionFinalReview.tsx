import { useState } from 'react'
import {
  User,
  MapPin,
  GraduationCap,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Pencil,
  Lock,
  ShieldCheck,
  Scale,
  Building2,
  Eye,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { Modal } from '@shared/components/ui/Modal'
import { CndpPrivacyModal } from '@shared/components/ui/CndpPrivacyModal'
import { admissionCopy, admissionFieldsAr, requiredProfileFields } from '../model/admissionCopy'
import { sections, candidateProfileLabels, candidateProfileLabelsAr } from '../model/candidateProfileFields'
import {
  documentLabels,
  documentLabelsAr,
  documentTypes,
  profileLabels,
  type AdmissionDossier,
  type DocumentType,
} from '../model/workflow'

interface AdmissionFinalReviewProps {
  dossier: AdmissionDossier
  ar: boolean
  busy: boolean
  error?: string
  onClose: () => void
  onEdit: (key: string) => void
  onConfirm: () => void
}

export default function AdmissionFinalReview({
  dossier,
  ar,
  busy,
  error,
  onClose,
  onEdit,
  onConfirm,
}: AdmissionFinalReviewProps) {
  // Checkbox 1: Honor pledge / sincerity
  const [sincerityConfirmed, setSincerityConfirmed] = useState(false)
  // Checkbox 2: CNDP Law 09-08 consent
  const [cndpConfirmed, setCndpConfirmed] = useState(false)

  // Full CNDP modal state
  const [cndpModalOpen, setCndpModalOpen] = useState(false)

  const copy = admissionCopy[ar ? 'ar' : 'fr']
  const docs = ar ? documentLabelsAr : documentLabels

  const profile: Record<string, unknown> = {
    ...dossier.profile,
    first_name: dossier.profile.first_name || dossier.first_name,
    last_name: dossier.profile.last_name || dossier.last_name,
    cin: dossier.cin || dossier.profile.cin,
    cne: dossier.cne || dossier.profile.cne,
  }

  const missingFields = requiredProfileFields.filter(
    (key) => profile[key] === null || profile[key] === undefined || String(profile[key]).trim() === ''
  )
  const required = (dossier.required_documents ?? documentTypes) as readonly DocumentType[]
  const missingDocs = required.filter((type) => !dossier.documents[type] || dossier.documents[type]?.status === 'rejected')
  const photo = dossier.documents.photo

  // Grouped sections for clean display
  const identitySection = sections.find((s) => s.id === 'identity')
  const residenceSection = sections.find((s) => s.id === 'residence')
  const bacSection = sections.find((s) => s.id === 'bac')
  const fatherSection = sections.find((s) => s.id === 'father')
  const motherSection = sections.find((s) => s.id === 'mother')
  const emergencySection = sections.find((s) => s.id === 'emergency')
  const higherSection = sections.find((s) => s.id === 'higher')

  const groups = [
    {
      id: 'identity',
      title: ar ? 'الهوية ومعلومات الاتصال' : 'Identité & État Civil',
      icon: User,
      fields: identitySection?.fields ?? [],
    },
    {
      id: 'residence',
      title: ar ? 'السكن والمعلومات الجغرافية' : 'Résidence & Localisation',
      icon: MapPin,
      fields: residenceSection?.fields ?? [],
    },
    {
      id: 'bac',
      title: ar ? 'البكالوريا والمسار الأكاديمي' : 'Baccalauréat & Cursus',
      icon: GraduationCap,
      fields: bacSection?.fields ?? [],
    },
    {
      id: 'family',
      title: ar ? 'معلومات الوالدين والطوارئ' : 'Informations Familiales & Urgence',
      icon: Users,
      fields: [
        ...(fatherSection?.fields ?? []),
        ...(motherSection?.fields ?? []),
        ...(emergencySection?.fields ?? []),
      ],
    },
    ...(higherSection && (profile.has_prior_higher_education || profile.previous_university)
      ? [
          {
            id: 'higher',
            title: ar ? 'مسار التعليم العالي السابق' : 'Enseignement Supérieur Antérieur',
            icon: Building2,
            fields: higherSection.fields,
          },
        ]
      : []),
  ]

  const canSubmit =
    !busy &&
    sincerityConfirmed &&
    cndpConfirmed &&
    missingFields.length === 0 &&
    missingDocs.length === 0

  return (
    <>
      <Modal
        open
        title={copy.summary}
        onClose={() => !busy && onClose()}
        size="xl"
        preventBackdropClose={busy}
        preventEscapeClose={busy}
      >
        <div dir={ar ? 'rtl' : 'ltr'} lang={ar ? 'ar' : 'fr'} className="space-y-6 text-foreground max-h-[80vh] overflow-y-auto px-1">
          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            >
              <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Missing Required Items Alert */}
          {(missingFields.length > 0 || missingDocs.length > 0) && (
            <div
              role="alert"
              className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 shadow-xs"
            >
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                <AlertTriangle size={16} className="text-amber-600" />
                <span>{copy.incomplete}</span>
              </div>

              {missingFields.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="font-semibold text-amber-800 dark:text-amber-300">
                    {ar ? 'حقول إلزامية ناقصة :' : 'Champs obligatoires manquants :'}
                  </span>
                  {missingFields.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onEdit(key)}
                      className="rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer dark:bg-amber-900 dark:text-amber-200"
                    >
                      {ar ? admissionFieldsAr[key] || key : profileLabels[key] || key} ✏️
                    </button>
                  ))}
                </div>
              )}

              {missingDocs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="font-semibold text-amber-800 dark:text-amber-300">
                    {ar ? 'وثائق مطلوبة لم تُرفق بعد :' : 'Documents requis manquants :'}
                  </span>
                  {missingDocs.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onEdit(`doc-${type}`)}
                      className="rounded-lg bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-900 hover:bg-rose-200 transition-colors cursor-pointer dark:bg-rose-900 dark:text-rose-200"
                    >
                      {docs[type] || type} 📎
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 1. Candidate Official Badge Header */}
          <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur-xs">
                  <span>{dossier.campaign.name}</span>
                  <span>·</span>
                  <span>S{dossier.campaign.entry_semester ?? 1}</span>
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-white">
                  {dossier.last_name} {dossier.first_name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-blue-200 font-mono">
                  <span>
                    Réf : <strong>{dossier.reference_number}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    CNE / Massar : <strong>{dossier.cne}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    CNIE : <strong>{dossier.cin || '—'}</strong>
                  </span>
                </div>
              </div>

              {photo && (
                <div className="shrink-0 overflow-hidden rounded-xl border-2 border-white/20 bg-slate-800 shadow-md">
                  <img
                    src={photo.signed_url}
                    alt={ar ? 'الصورة الشخصية' : 'Photo officielle'}
                    className="h-24 w-20 object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2. Structured Information Groups */}
          <div className="space-y-5">
            {groups.map((group) => {
              const Icon = group.icon
              // Filter to fields that have non-empty values or are relevant
              const visibleFields = group.fields.filter(([key]) => {
                if (['allergy_type', 'disability_details', 'medication_used', 'has_disability', 'has_medical_followup', 'treating_doctor_info'].includes(key)) {
                  return false
                }
                return true
              })

              return (
                <div
                  key={group.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      <Icon size={16} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {group.title}
                    </h3>
                  </div>

                  <dl className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                    {visibleFields.map(([key, labelFr, labelAr]) => {
                      const rawValue = profile[key]
                      const label = ar
                        ? labelAr || candidateProfileLabelsAr[key] || admissionFieldsAr[key] || key
                        : labelFr || candidateProfileLabels[key] || profileLabels[key] || key

                      let displayValue = copy.missing
                      let isMissing = true

                      if (typeof rawValue === 'boolean') {
                        displayValue = rawValue ? (ar ? 'نعم' : 'Oui') : (ar ? 'لا' : 'Non')
                        isMissing = false
                      } else if (rawValue !== null && rawValue !== undefined && String(rawValue).trim() !== '') {
                        displayValue = String(rawValue)
                        isMissing = false
                      }

                      return (
                        <div
                          key={key}
                          className={`relative flex flex-col justify-between rounded-xl border p-3 transition-all ${
                            isMissing
                              ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/10'
                              : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
                          }`}
                        >
                          <div>
                            <dt className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              {label}
                            </dt>
                            <dd
                              className={`mt-1 font-medium break-words ${
                                isMissing ? 'text-amber-700 italic' : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              <bdi>{displayValue}</bdi>
                            </dd>
                          </div>

                          <div className="mt-2.5 flex justify-end border-t border-slate-100 pt-1.5 dark:border-slate-800/80">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => onEdit(key)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              <Pencil size={11} />
                              <span>{copy.edit}</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </dl>
                </div>
              )
            })}
          </div>

          {/* 3. Pièces Justificatives Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <FileText size={16} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {copy.pieces} ({required.length})
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {required.filter((t) => dossier.documents[t]).length} / {required.length} déposée(s)
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {required.map((type) => {
                const doc = dossier.documents[type]
                const isUploaded = !!doc && doc.status !== 'rejected'

                return (
                  <div
                    key={type}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-xs transition-all ${
                      isUploaded
                        ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/10'
                        : 'border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/10'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        {isUploaded ? (
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle size={14} className="text-rose-600 shrink-0" />
                        )}
                        <span>{docs[type] || type}</span>
                      </div>
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          isUploaded
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                        }`}
                      >
                        {isUploaded ? (ar ? 'مرفقة ✓' : 'Téléversée ✓') : copy.missing}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {doc?.signed_url && (
                        <a
                          href={doc.signed_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          <Eye size={12} className="text-blue-600" />
                          <span>{ar ? 'معاينة' : 'Voir'}</span>
                        </a>
                      )}

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onEdit(`doc-${type}`)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        <Pencil size={12} />
                        <span>{copy.edit}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 4. CNDP LOI 09-08 & ENGAGEMENT SUR L'HONNEUR (LEGAL ACCORDION) */}
          <section className="space-y-4 rounded-2xl border-2 border-blue-300 bg-blue-50/40 p-5 dark:border-blue-900 dark:bg-blue-950/20">
            {/* Header: Protection des données CNDP */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-200/80 pb-3 dark:border-blue-900/60">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-blue-950 dark:text-blue-200">
                    {ar
                      ? 'حماية المعطيات ذات الطابع الشخصي — القانون رقم 09-08'
                      : 'Protection des Données Personnelles · Loi n° 09-08'}
                  </h3>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 font-mono">
                    Déclaration CNDP N° A-I-ENCG-0908 · ENCG Fès (USMBA)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCndpModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-900 hover:bg-blue-200 transition-colors cursor-pointer dark:bg-blue-900/60 dark:text-blue-200"
              >
                <Scale size={13} />
                <span>{ar ? 'النص القانوني الكامل' : 'Consulter la charte CNDP'}</span>
              </button>
            </div>

            {/* Legal Notice Text */}
            <div className="space-y-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {ar ? (
                <p>
                  تلتزم المدرسة الوطنية للتجارة والتسيير بفاس بحماية معطياتكم الشخصية وفق مقتضيات القانون رقم 09-08 الصادر
                  بالظهير الشريف رقم 1-09-15. تُعالج هذه المعطيات حصرياً لغرض تدبير الترشيحات، التسجيل الإداري والبيداغوجي،
                  وتتبع مساركم الجامعي. يحق لكم الولوج لمعطياتكم وتصحيحها عبر مراسلة إدارة الشؤون الطلابية على :{' '}
                  <strong className="text-blue-900 dark:text-blue-200 font-mono">cndp-privacy@encg-fes.ma</strong>.
                </p>
              ) : (
                <p>
                  L’École Nationale de Commerce et de Gestion de Fès s’engage à protéger vos données personnelles conformément
                  aux dispositions de la <strong>loi marocaine n° 09-08</strong> (Dahir n° 1-09-15). Les informations recueillies
                  font l’objet d’un traitement automatisé destiné exclusivement à la gestion administrative des admissions, du
                  concours et du cursus académique (Autorisation CNDP N° A-I-ENCG-0908). Vous bénéficiez d’un droit d’accès, de
                  rectification et d’opposition auprès du Service de Scolarité ({' '}
                  <strong className="text-blue-900 dark:text-blue-200 font-mono">cndp-privacy@encg-fes.ma</strong>).
                </p>
              )}
            </div>

            {/* Sincerity & Penal Warning */}
            <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="flex items-center gap-2 font-extrabold text-amber-900 dark:text-amber-300">
                <AlertCircle size={15} className="shrink-0 text-amber-600" />
                <span>{ar ? 'التزام بالشرف ومسؤولية قانونية' : 'Engagement sur l’Honneur & Répression des Faux'}</span>
              </div>
              <p className="mt-1.5 leading-relaxed">
                {ar
                  ? 'أي تصريح كاذب، أو إدلاء بوثائق مزورة أو محرفة، يعرض صاحبه للبطلان الفوري للتسجيل وللمتابعات التأديبية والجنائية طبقاً لمقتضيات القانون الجنائي المغربي والنظام الداخلي لجامعة سيدي محمد بن عبد الله.'
                  : 'Toute omission volontaire, fausse déclaration ou falsification de document entraîne l’annulation de plein droit de l’admission, sans préjudice des poursuites disciplinaires et pénales prévues par le Code Pénal marocain et le règlement de l’ENCG Fès.'}
              </p>
            </div>

            {/* Checkboxes for final consent */}
            <div className="space-y-3 pt-2">
              {/* Checkbox 1: Sincerity */}
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={sincerityConfirmed}
                  disabled={busy}
                  onChange={(e) => setSincerityConfirmed(e.target.checked)}
                />
                <span>
                  {ar
                    ? 'أشهد بشرفي على صحة ودقة كافة المعلومات المصرح بها، وعلى مطابقة الوثائق الرقمية للوثائق الأصلية.'
                    : 'J’atteste sur l’honneur l’exactitude absolue de l’ensemble des informations renseignées et la conformité des pièces déposées.'}
                </span>
              </label>

              {/* Checkbox 2: CNDP Consent */}
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={cndpConfirmed}
                  disabled={busy}
                  onChange={(e) => setCndpConfirmed(e.target.checked)}
                />
                <span>
                  {ar
                    ? 'أوافق صراحة على معالجة معطياتي الشخصية من طرف ENCG Fès في إطار التدبير الأكاديمي طبقاً للقانون 09-08.'
                    : 'J’accepte le traitement de mes données personnelles par l’ENCG Fès conformément à la loi 09-08 (CNDP) et aux règlements de l’établissement.'}
                </span>
              </label>
            </div>
          </section>

          {/* 5. Modal Footer Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              disabled={busy}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              onClick={onClose}
            >
              {copy.cancel}
            </button>

            <button
              type="button"
              disabled={!canSubmit}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-extrabold text-white shadow-md transition-all cursor-pointer ${
                canSubmit
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                  : 'bg-slate-400 cursor-not-allowed opacity-60'
              }`}
              onClick={onConfirm}
            >
              <Lock size={14} />
              <span>{busy ? copy.saving : copy.submit}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* CNDP Full Legal Details Modal */}
      <CndpPrivacyModal
        isOpen={cndpModalOpen}
        onClose={() => setCndpModalOpen(false)}
        lang={ar ? 'ar' : 'fr'}
      />
    </>
  )
}
