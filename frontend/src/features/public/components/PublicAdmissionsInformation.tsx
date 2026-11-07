import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Megaphone, ListChecks, KeyRound, MessageCircle } from 'lucide-react'
import { usePublicPortal } from '../api/usePublicPortal'

const labels: Record<string, Record<string, string>> = {
  fr: {
    bac: "Baccalauréat",
    cnie: "CNIE",
    releve_notes: "Relevé de notes du baccalauréat",
    photo: "Photo d’identité",
    attestation_admission: "Attestation officielle d’admission CNAEM",
    releve_parcours: "Relevés du parcours antérieur",
  },
  en: {
    bac: "Baccalaureate certificate",
    cnie: "National identity card",
    releve_notes: "Baccalaureate transcript",
    photo: "ID photo",
    attestation_admission: "Official CNAEM admission certificate",
    releve_parcours: "Previous academic transcripts",
  },
  ar: {
    bac: "شهادة البكالوريا",
    cnie: "البطاقة الوطنية للتعريف",
    releve_notes: "بيان نقط البكالوريا",
    photo: "صورة شخصية",
    attestation_admission: "شهادة القبول الرسمية في CNAEM",
    releve_parcours: "بيانات نقط المسار الدراسي السابق",
  },
}
const steps = {
  fr: [
    "Consulter la campagne et les dates publiées par l’administration.",
    "Activer son dossier officiel ou préparer son compte pendant la période ouverte.",
    "Déposer les pièces demandées, vérifier les informations extraites et compléter le formulaire.",
    "Soumettre le dossier, conserver le récépissé et suivre la revue dans son espace personnel.",
    "Se présenter au rendez-vous avec le dossier physique pour le contrôle administratif.",
  ],
  en: [
    "Check the campaign and dates published by the administration.",
    "Activate your official application or create your account during the enrollment period.",
    "Upload the required documents, verify the extracted information and complete the form.",
    "Submit your application, keep your receipt and follow its review in your account.",
    "Bring your paper file to the appointment for verification.",
  ],
  ar: [
    "اطّلع على الحملة والمواعيد التي تنشرها الإدارة.",
    "فعّل ملفك الرسمي أو أنشئ حسابك خلال فترة التسجيل.",
    "أودع الوثائق المطلوبة وتحقق من البيانات المستخرجة وأكمل الاستمارة.",
    "أرسل ملفك واحتفظ بالوصل وتابع مراجعته في فضائك الشخصي.",
    "احضر إلى الموعد مصحوباً بملفك الورقي للتحقق منه.",
  ],
}

const guideCopy = {
  fr: {
    moroccoTime: "heure du Maroc",
    loading: "Chargement des informations…",
    error: "Informations momentanément indisponibles.",
    retry: "Réessayer",
    route: "Voie d’admission",
    tafem: "Formation initiale gratuite · entrée en première année (S1).",
    cnaem: "Formation initiale gratuite · entrée en troisième ou quatrième année (S5 / S7), selon l’admission officielle.",
    journey: "Votre parcours en 5 étapes",
    instructions: "Consignes de l’établissement",
    account: "Accès au compte",
    existing: "Vous disposez déjà d’un compte ? Retrouvez votre accès sans créer un second dossier.",
    password: "Récupérer mon mot de passe",
    help: "Besoin d’aide sur votre dossier ?",
    helpDetail: "Décrivez le problème et choisissez son type dans le formulaire de contact. N’envoyez pas votre mot de passe ni de copie de pièce d’identité.",
    contact: "Contacter le service concerné",
  },
  en: {
    moroccoTime: "Morocco time",
    loading: "Loading information…",
    error: "Information is temporarily unavailable.",
    retry: "Try again",
    route: "Admission route",
    tafem: "Tuition-free initial program · entry in the first year (S1).",
    cnaem: "Tuition-free initial program · entry in the third or fourth year (S5 / S7), depending on the official admission decision.",
    journey: "Your application in five steps",
    instructions: "Institution instructions",
    account: "Account access",
    existing: "Already have an account? Recover your access to continue with your existing application.",
    password: "Recover my password",
    help: "Need help with your application?",
    helpDetail: "Describe the issue and select its category in the contact form. Keep your password and identity documents private.",
    contact: "Contact the relevant department",
  },
  ar: {
    moroccoTime: "بتوقيت المغرب",
    loading: "جارٍ تحميل المعلومات…",
    error: "المعلومات غير متاحة مؤقتاً.",
    retry: "أعد المحاولة",
    route: "مسار القبول",
    tafem: "تكوين أساسي مجاني · الولوج إلى السنة الأولى (S1).",
    cnaem: "تكوين أساسي مجاني · الولوج إلى السنة الثالثة أو الرابعة (S5 / S7) حسب قرار القبول الرسمي.",
    journey: "مسار التسجيل في خمس خطوات",
    instructions: "تعليمات المؤسسة",
    account: "الوصول إلى الحساب",
    existing: "هل لديك حساب؟ استعد الوصول إليه لمتابعة ملفك الحالي.",
    password: "استعادة كلمة المرور",
    help: "هل تحتاج إلى مساعدة بشأن ملفك؟",
    helpDetail: "صف المشكلة واختر نوعها في استمارة التواصل. احتفظ بكلمة المرور ووثائق الهوية لنفسك.",
    contact: "التواصل مع القسم المعني",
  },
}

export default function PublicAdmissionsInformation({ lang = 'fr' }: { lang?: 'fr' | 'en' | 'ar' }) {
  const query = usePublicPortal()
  const copy = guideCopy[lang]
  const [route, setRoute] = useState<'tafem' | 'cnaem'>('tafem')
  const guide = query.data?.guides[route]
  const instructions = (lang === 'ar' && guide?.instructions_ar) || guide?.instructions
  const checklist = (lang === 'ar' && guide?.physical_checklist_ar) || guide?.physical_checklist || []
  const t = lang === 'ar' ? { guide: 'كيف أسجل؟', notices: 'إعلانات المؤسسة', follow: 'تتبع ملفي', calendar: 'رزنامة التسجيل', docs: 'الوثائق المطلوبة', originals: 'التحقق من الملف الورقي', pdf: 'تحميل البلاغ الرسمي' } : lang === 'en' ? { guide: 'How to enroll', notices: 'Official announcements', follow: 'Track my application', calendar: 'Enrollment calendar', docs: 'Required documents', originals: 'Physical dossier check', pdf: 'Download official notice' } : { guide: 'Comment s’inscrire ?', notices: 'Annonces officielles', follow: 'Suivre mon dossier', calendar: 'Calendrier des inscriptions', docs: 'Documents à préparer', originals: 'Contrôle du dossier physique', pdf: 'Télécharger le communiqué officiel' }
  return <section id="guide-inscription" className="relative z-10 mx-auto max-w-7xl scroll-mt-24 space-y-6 px-6 py-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <div className="flex flex-wrap gap-3"><Link to="/admissions/mon-dossier" className="portal-action portal-action-primary">{t.follow}</Link><a href="#inscriptions" className="portal-action portal-action-secondary">{t.calendar}</a></div>

    {query.isPending ? <p role="status">{copy.loading}</p> : query.isError ? <div role="alert" className="rounded-xl border border-border bg-card p-5">{copy.error} <button onClick={() => { void query.refetch() }} className="underline">{copy.retry}</button></div> : query.data && <>
      {query.data.announcements.length > 0 && <div className="portal-surface p-6 sm:p-8"><h2 className="portal-heading flex items-center gap-3"><span className="portal-icon"><Megaphone className="h-5 w-5" /></span>{t.notices}</h2><div className="mt-5 grid gap-4 md:grid-cols-2">{query.data.announcements.map(item => {
        const translated = lang === 'ar' && item.title_ar && item.body_ar
        return <article key={item.id} className="portal-notice"><h3 className="text-lg font-bold leading-snug tracking-tight">{translated ? item.title_ar : item.title}</h3><p className="mt-2 text-xs text-muted-foreground"><bdi>{item.starts_on} – {item.ends_on}</bdi> · {copy.moroccoTime}</p><p className="mt-3 whitespace-pre-line text-sm leading-6">{translated ? item.body_ar : item.body}</p>{item.attachment_id && <a href={`${(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')}/public/admissions/announcements/${item.attachment_id}/pdf`} className="portal-action portal-action-secondary mt-5"><FileText className="h-4 w-4" />{t.pdf}</a>}</article>
      })}</div></div>}
      <div className="portal-surface p-6 sm:p-8"><h2 className="portal-heading flex items-center gap-3"><span className="portal-icon"><ListChecks className="h-5 w-5" /></span>{t.guide}</h2><div className="portal-tabs mt-5" role="tablist" aria-label={copy.route}>{(['tafem', 'cnaem'] as const).map(value => <button type="button" role="tab" aria-selected={route === value} key={value} onClick={() => setRoute(value)} className="transition-colors">{value.toUpperCase()}</button>)}</div>
        <p className="mt-5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm leading-6 text-muted-foreground">{route === 'tafem' ? copy.tafem : copy.cnaem}</p>
        <div className="mt-7 grid items-start gap-8 lg:grid-cols-[1.1fr_1fr]"><div><p className="portal-eyebrow mb-5">{copy.journey}</p><ol className="space-y-1">{steps[lang].map((step, index) => <li className="portal-step text-sm leading-6" key={step}><span className="portal-step-number">{String(index + 1).padStart(2, '0')}</span><span className="pt-1.5">{step}</span></li>)}</ol>
        {instructions && <div className="mt-5 rounded-xl bg-muted/50 p-4"><h3 className="font-semibold">{copy.instructions}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6">{instructions}</p></div>}
        </div><aside className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6"><div className="grid gap-6"><div><h3 className="font-semibold">{t.docs}</h3><ul className="mt-3">{query.data.guides[route].documents.map(document => <li className="portal-document" key={document}>{labels[lang][document] || document}</li>)}</ul></div><div><h3 className="font-semibold">{t.originals}</h3><ul className="mt-3">{checklist.map(item => <li className="portal-document" key={item}>{item}</li>)}</ul></div></div></aside></div>
      </div>
    </>}
    <div className="grid gap-4 sm:grid-cols-2"><div className="portal-help !block"><span className="portal-icon mb-4"><KeyRound className="h-5 w-5" /></span><h3 className="font-semibold">{copy.account}</h3><p className="mt-2 text-sm text-muted-foreground">{copy.existing}</p><Link to="/forgot-password" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline">{copy.password}</Link></div><div className="portal-help !block"><span className="portal-icon mb-4"><MessageCircle className="h-5 w-5" /></span><h3 className="font-semibold">{copy.help}</h3><p className="mt-2 text-sm text-muted-foreground">{copy.helpDetail}</p><a href="#contact" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline">{copy.contact}</a></div></div>
  </section>
}
