import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, CheckCircle2, Clock, AlertTriangle, XCircle, FileText, Download,
  ChevronRight, RefreshCw, Sun, Moon, Shield, Globe, LogOut
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@shared/lib/api';
import AiScolarBotWidget from '@shared/components/AiScolarBotWidget';
import { useAuthStore } from '@stores/authStore';
import { useTheme } from '@shared/components/layout/useTheme';

// ─── Types ───────────────────────────────────────────────────────────────────
type Lang = 'fr' | 'ar';
type InscriptionStatus =
  | 'submitted'
  | 'dossier_incomplet'
  | 'dossier_complet'
  | 'valide'
  | 'inscrit'
  | 'reinscrit';

interface StatusResult {
  cne: string;
  nom: string;
  inscription_status: InscriptionStatus;
  student_number: string | null;
  filiere: string | null;
  submitted_at: string | null;
  validated_at: string | null;
  missing_documents: string[];
  academic_year: string;
}

// ─── Dictionnaire des traductions ────────────────────────────────────────────
const DICT = {
  fr: {
    title: "Suivi de mon Dossier d'Inscription",
    subtitle: "Entrez votre CNE pour consulter l'état de traitement de votre dossier.",
    placeholder: "Ex: M145092428",
    searchBtn: "Consulter",
    searching: "Recherche...",
    notFound: "Dossier introuvable",
    errorMsg: "Aucun dossier trouvé pour ce CNE.",
    status: "Statut actuel",
    progress: "Progression du Dossier",
    studentNumber: "N° Inscription",
    fullName: "Nom complet",
    filiere: "Filière",
    academicYear: "Année Académique",
    submittedAt: "Soumis le",
    validatedAt: "Validé le",
    missingDocs: "Documents manquants à fournir",
    toSubmit: "Veuillez vous présenter au guichet Scolarité avec les originaux.",
    attestationTitle: "Votre inscription est officielle !",
    attestationDesc: "Téléchargez votre attestation d'inscription officielle ENCG Fès.",
    download: "Télécharger l'Attestation PDF",
    emptyState: "Entrez votre CNE ci-dessus pour consulter votre dossier",
    emptySub: "Le CNE est disponible sur votre relevé de notes du Baccalauréat",
    footer: "ENCG Fès — Portail de Suivi d'Inscription | Année Académique 2026-2027",
    help: "Pour toute assistance : scolarite@encg-fes.ac.ma",
    backHome: "Retour à l'accueil",
    logout: "Déconnexion",
    login: "Se connecter"
  },
  ar: {
    title: "تتبع ملف التسجيل الخاص بي",
    subtitle: "أدخل رمز مسار (CNE) للاطلاع على حالة معالجة ملفك.",
    placeholder: "مثال: M145092428",
    searchBtn: "استعلام",
    searching: "جاري البحث...",
    notFound: "الملف غير موجود",
    errorMsg: "لم يتم العثور على ملف لهذا الرمز.",
    status: "الحالة الحالية",
    progress: "تقدم الملف",
    studentNumber: "رقم التسجيل",
    fullName: "الاسم الكامل",
    filiere: "الشعبة",
    academicYear: "السنة الأكاديمية",
    submittedAt: "تاريخ التقديم",
    validatedAt: "تاريخ المصادقة",
    missingDocs: "الوثائق الناقصة",
    toSubmit: "يرجى التوجه إلى مكتب التسجيل لتقديم النسخ الأصلية.",
    attestationTitle: "تسجيلك رسمي!",
    attestationDesc: "قم بتحميل شهادة التسجيل الرسمية من ENCG فاس.",
    download: "تحميل شهادة التسجيل (PDF)",
    emptyState: "أدخل رمز مسار (CNE) أعلاه للاطلاع على ملفك",
    emptySub: "رمز مسار موجود في بيان نقاط البكالوريا",
    footer: "ENCG فاس — بوابة تتبع التسجيل | السنة الأكاديمية 2026-2027",
    help: "للمساعدة: scolarite@encg-fes.ac.ma",
    backHome: "العودة للصفحة الرئيسية",
    logout: "تسجيل الخروج",
    login: "تسجيل الدخول"
  }
};

const STATUS_CONFIG: Record<InscriptionStatus, {
  labelFr: string; labelAr: string; icon: React.ReactNode; color: string;
  bg: string; border: string; descFr: string; descAr: string; step: number;
}> = {
  submitted: {
    labelFr: 'Dossier Soumis', labelAr: 'تم تقديم الملف', icon: <Clock className="w-5 h-5" />,
    color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
    descFr: 'Votre dossier a été reçu et est en cours de traitement.',
    descAr: 'تم استلام ملفك وهو قيد المعالجة.',
    step: 1,
  },
  dossier_incomplet: {
    labelFr: 'Documents Manquants', labelAr: 'وثائق ناقصة', icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    descFr: 'Des documents sont manquants. Veuillez les soumettre au plus vite.',
    descAr: 'بعض الوثائق ناقصة. يرجى تقديمها في أقرب وقت.',
    step: 2,
  },
  dossier_complet: {
    labelFr: 'Dossier Complet', labelAr: 'ملف كامل', icon: <FileText className="w-5 h-5" />,
    color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800',
    descFr: 'Votre dossier est complet. Il est en attente de validation par la commission.',
    descAr: 'ملفك كامل. هو في انتظار المصادقة من طرف اللجنة.',
    step: 3,
  },
  valide: {
    labelFr: 'Dossier Validé ✅', labelAr: 'تمت المصادقة ✅', icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    descFr: 'Votre dossier a été approuvé par la commission d\'admission.',
    descAr: 'تمت الموافقة على ملفك من طرف لجنة القبول.',
    step: 4,
  },
  inscrit: {
    labelFr: 'Inscription Confirmée 🎓', labelAr: 'تسجيل مؤكد 🎓', icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    descFr: 'Félicitations ! Votre inscription est officielle.',
    descAr: 'مبروك! تسجيلك رسمي.',
    step: 5,
  },
  reinscrit: {
    labelFr: 'Réinscription Confirmée 🔁', labelAr: 'إعادة تسجيل مؤكدة 🔁', icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-50 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-800',
    descFr: 'Votre réinscription pour l\'année en cours est confirmée.',
    descAr: 'تم تأكيد إعادة تسجيلك للسنة الحالية.',
    step: 5,
  },
};

const DOC_LABELS: Record<string, string> = {
  photo: '📷 Photo d\'identité',
  bac_recto: '📜 Baccalauréat (Recto)',
  bac_verso: '📜 Baccalauréat (Verso)',
  cin_recto_verso: '🪪 Carte Nationale d\'Identité',
  releve_notes: '📊 Relevé de Notes Baccalauréat',
  extrait_naissance: '📜 Extrait de Naissance',
  engagement_reglement: '📝 Engagement Règlement Intérieur',
  fiche_medicale: '🩺 Fiche Médicale',
};

const STEPS = [
  { step: 1, labelFr: 'Soumission', labelAr: 'تقديم' },
  { step: 2, labelFr: 'Vérification', labelAr: 'تدقيق' },
  { step: 3, labelFr: 'Complet', labelAr: 'كامل' },
  { step: 4, labelFr: 'Validation', labelAr: 'مصادقة' },
  { step: 5, labelFr: 'Inscrit', labelAr: 'مسجل' },
];

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function SkeletonLine({ width = 'w-3/4' }: { width?: string }) {
  return <div className={`h-3 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse ${width}`} />;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MonInscriptionPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();

  // Langue system logic (تحديد اللغة افتراضياً)
  const [lang, setLang] = useState<Lang>('fr');

  const [cne, setCne] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StatusResult | null>(null);

  const t = DICT[lang];
  const isRTL = lang === 'ar';
  const isDark = theme === 'dark';

  const handleSearch = async () => {
    if (!cne.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.get('/public/inscription/status', { params: { cne: cne.trim() } });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || t.errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const currentConfig = result ? STATUS_CONFIG[result.inscription_status] : null;
  const currentStep = currentConfig?.step ?? 0;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className={cn("min-h-screen font-sans transition-colors duration-300", isDark ? "dark bg-slate-950" : "bg-slate-50")}>

      {/* ── Hero Header ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f2863] via-[#1a387e] to-[#09193d] text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%23ffffff opacity=0.04%3E%3Ccircle cx=30 cy=30 r=2/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-14 text-center">
          {/* Top Buttons (Langue, Theme, Logout) */}
          <div className="absolute top-4 inset-x-6 flex items-center justify-between">
            <button
              onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
            >
              <Globe className="w-4 h-4" /> {lang === 'fr' ? '🇲🇦 AR' : '🇫🇷 FR'}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-200" />}
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="p-2 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/30 rounded-full transition-all cursor-pointer text-rose-300"
                  title={t.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 text-amber-300 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-5 mt-10">
            🎓 ENCG Fès — USMBA
          </div>
          <h1 className={cn("text-3xl md:text-4xl font-black text-white leading-tight mb-3", isRTL && "font-serif")}>
            {t.title}
          </h1>
          <p className={cn("text-blue-200 text-sm max-w-xl mx-auto mb-8", isRTL && "font-serif")}>
            {t.subtitle}
          </p>

          {/* Search box */}
          <div className={cn("flex items-center gap-3 max-w-lg mx-auto", isRTL && "flex-row-reverse")}>
            <div className="relative flex-1">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", isRTL ? "right-4" : "left-4")} />
              <input
                type="text"
                value={cne}
                onChange={e => setCne(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={t.placeholder}
                className={cn(
                  "w-full py-3.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-400 shadow-lg",
                  isRTL ? "pr-11 pl-4 text-right" : "pl-11 pr-4"
                )}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-sm rounded-2xl shadow-lg hover:scale-105 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 shrink-0"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className={cn("w-4 h-4", isRTL && "rotate-180")} />}
              {loading ? t.searching : t.searchBtn}
            </button>
          </div>
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* Error */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-3xl p-6 flex items-start gap-4">
            <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-rose-700 dark:text-rose-300 text-sm">{t.notFound}</p>
              <p className="text-rose-600 dark:text-rose-400 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Skeleton (تبقا تجمّد الشاشة باش تكون مزيانة) */}
        {loading && !result && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <SkeletonLine width="w-1/4" />
                <SkeletonLine width="w-3/5" />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <SkeletonLine width="w-full" />
              <SkeletonLine width="w-full" />
              <SkeletonLine width="w-full" />
            </div>
          </div>
        )}

        {result && currentConfig && (
          <>
            {/* Status Card */}
            <div className={`rounded-3xl border p-6 shadow-md ${currentConfig.bg} ${currentConfig.border}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${currentConfig.bg} border ${currentConfig.border}`}>
                    <span className={currentConfig.color}>{currentConfig.icon}</span>
                  </div>
                  <div>
                    <p className={cn("text-xs font-black uppercase tracking-widest", currentConfig.color)}>{t.status}</p>
                    <h2 className={cn("text-xl font-black mt-0.5", currentConfig.color)}>
                      {isRTL ? currentConfig.labelAr : currentConfig.labelFr}
                    </h2>
                  </div>
                </div>
                {result.student_number && (
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.studentNumber}</p>
                    <p className="font-black text-slate-900 dark:text-white font-mono mt-0.5">{result.student_number}</p>
                  </div>
                )}
              </div>
              <p className={cn("text-sm mt-4 font-medium", currentConfig.color)}>
                {isRTL ? currentConfig.descAr : currentConfig.descFr}
              </p>
            </div>

            {/* Progress Tracker */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-5">{t.progress}</h3>
              <div className="flex items-center gap-0">
                {STEPS.map((s, idx) => (
                  <React.Fragment key={s.step}>
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${currentStep >= s.step
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : currentStep === s.step - 1
                          ? 'bg-amber-400 border-amber-400 text-white animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}>
                        {currentStep > s.step ? '✓' : s.step}
                      </div>
                      <p className={`text-[9px] font-bold mt-1.5 text-center leading-tight ${currentStep >= s.step ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}>
                        {isRTL ? s.labelAr : s.labelFr}
                      </p>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${currentStep > s.step ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
                        }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Student Info Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: t.fullName, value: result.nom },
                { label: 'CNE', value: result.cne },
                { label: t.filiere, value: result.filiere ?? '—' },
                { label: t.academicYear, value: result.academic_year },
                { label: t.submittedAt, value: result.submitted_at ?? '—' },
                { label: t.validatedAt, value: result.validated_at ?? '—' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Missing Documents */}
            {result.missing_documents.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-black text-amber-700 dark:text-amber-300 flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4" /> {t.missingDocs}
                </h3>
                <div className="space-y-2">
                  {result.missing_documents.map(docKey => (
                    <div key={docKey} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" />
                      {DOC_LABELS[docKey] ?? docKey}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-4 font-medium">
                  → {t.toSubmit}
                </p>
              </div>
            )}

            {/* Download Attestation if inscrit */}
            {(result.inscription_status === 'inscrit' || result.inscription_status === 'reinscrit') && (
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 text-white shadow-lg">
                <h3 className={cn("font-black text-lg mb-1", isRTL && "font-serif text-right")}>{t.attestationTitle}</h3>
                <p className={cn("text-emerald-100 text-sm mb-4", isRTL && "text-right font-serif")}>
                  {t.attestationDesc}
                </p>
                <a
                  href={`/api/admin/students/${encodeURIComponent(result.cne)}/attestation-pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "inline-flex items-center gap-2 bg-white text-emerald-700 px-5 py-2.5 rounded-xl font-black text-sm hover:bg-emerald-50 transition-all shadow cursor-pointer",
                    isRTL && "flex-row-reverse"
                  )}
                >
                  <Download className="w-4 h-4" /> {t.download}
                </a>
              </div>
            )}
          </>
        )}

        {/* Instructions when empty */}
        {!result && !error && !loading && (
          <div className="text-center py-16 text-slate-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-sm font-medium">{t.emptyState}</p>
            <p className="text-xs mt-2">{t.emptySub}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <p>{t.footer}</p>
        <p className="mt-1">{t.help}</p>
        <div className="mt-3 space-x-4">
          <button onClick={() => navigate('/')} className="text-[#0f2863] dark:text-blue-400 font-bold hover:underline cursor-pointer">
            {t.backHome}
          </button>
          {isAuthenticated && (
            <button onClick={() => { logout(); navigate('/'); }} className="text-rose-500 font-bold hover:underline cursor-pointer">
              {t.logout}
            </button>
          )}
        </div>
      </footer>

      {/* AI ScolarBot Widget (AI Module #4) */}
      <AiScolarBotWidget />
    </div>
  );
}