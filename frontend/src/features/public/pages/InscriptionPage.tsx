import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Users, GraduationCap, CheckCircle2, Lock, Mail,
  MapPin, Calendar, Hash, Star, Building2, BookOpen,
  ChevronLeft, ArrowRight, Rocket, Phone, Shield, Sun, Moon, Globe, FileText, Search, ChevronDown, Check, Scissors, X
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useTheme } from '@shared/components/layout/ThemeProvider';
import api from '@shared/lib/api';
import { useAuthStore } from '@stores/authStore';
import { CndpPrivacyModal } from '@shared/components/ui/CndpPrivacyModal';
import AiScolarBotWidget from '@shared/components/AiScolarBotWidget';
import { toast } from 'sonner';

/* ── Types ── */
type StepId = 1 | 2 | 3 | 4 | 5;
type Lang = 'fr' | 'ar' | 'en';

const STEPS = [
  { id: 1 as StepId, label: 'Personnel',    sub: 'Infos personnelles & résidence', icon: User          },
  { id: 2 as StepId, label: 'Parents',      sub: 'Coordonnées des tuteurs légaux',   icon: Users         },
  { id: 3 as StepId, label: 'Académique',   sub: 'Baccalauréat & Orientation',    icon: GraduationCap },
  { id: 4 as StepId, label: 'Documents',    sub: 'Scans Bac, CNIE & Photo 35x45', icon: FileText        },
  { id: 5 as StepId, label: 'Confirmation', sub: 'Récapitulatif & Déclaration',    icon: CheckCircle2  },
];

const FILIERES = [
  'Marketing & Commerce International',
  'Finance & Comptabilité',
  'Audit & Contrôle de Gestion',
  'Ressources Humaines',
  'Logistique & Supply Chain',
  'Management du Tourisme',
];

/* ── Translations ── */
const dict = {
  fr: {
    font: 'font-sans',
    title: 'Dossier de Candidature',
    subtitle: "Remplissez les 3 étapes ci-dessous pour soumettre votre candidature à l'ENCG Fès.",
    alreadyRegistered: 'Déjà inscrit ?',
    step1: 'Compte & Identité', step1Sub: 'Vos informations de connexion et données personnelles',
    step2: 'Naissance & Parents', step2Sub: 'Informations de naissance et coordonnées des tuteurs',
    step3: 'Baccalauréat & Filière', step3Sub: "Votre parcours académique et choix d'orientation à l'ENCG",
    btnPrev: 'Précédent', btnNext: 'Continuer', btnSubmit: 'Soumettre', btnSending: 'Envoi...',
    cneLabel: 'CNE (Code Massar)',
    successTitle: 'Candidature Soumise !',
    successDesc: 'Votre dossier a été enregistré. Vous recevrez une confirmation par email sous 72h.',
  },
  en: {
    font: 'font-sans',
    title: 'Application Form',
    subtitle: 'Complete the 3 steps below to submit your application to ENCG Fes.',
    alreadyRegistered: 'Already registered?',
    step1: 'Account & Identity', step1Sub: 'Your login credentials and personal information',
    step2: 'Birth & Parents', step2Sub: 'Birth details and legal guardians information',
    step3: 'High School & Major', step3Sub: 'Your academic background and major choice at ENCG',
    btnPrev: 'Previous', btnNext: 'Continue', btnSubmit: 'Submit', btnSending: 'Sending...',
    cneLabel: 'CNE (Massar Code)',
    successTitle: 'Application Submitted!',
    successDesc: 'Your file has been saved. You will receive an email confirmation within 72 hours.',
  },
  ar: {
    font: "font-['Cairo']",
    title: 'ملف الترشيح',
    subtitle: 'أكمل الخطوات الثلاث أدناه لتقديم ترشيحك إلى المدرسة الوطنية للتجارة والتسيير بفاس.',
    alreadyRegistered: 'مسجل بالفعل؟',
    step1: 'الحساب والهوية', step1Sub: 'معلومات تسجيل الدخول والبيانات الشخصية',
    step2: 'الولادة وأولياء الأمور', step2Sub: 'معلومات الولادة وبيانات أولياء الأمور',
    step3: 'البكالوريا والمسلك', step3Sub: 'مسارك الأكاديمي واختيار التوجه في المدرسة',
    btnPrev: 'السابق', btnNext: 'متابعة', btnSubmit: 'إرسال', btnSending: 'جاري الإرسال...',
    cneLabel: 'رمز مسار (CNE)',
    successTitle: 'تم تقديم الترشيح!',
    successDesc: 'تم تسجيل ملفك. ستتلقى تأكيدًا عبر البريد الإلكتروني في غضون 72 ساعة.',
  }
};

/* ── Sub-components ── */
function Field({
  icon: Icon, label, required, className = '', as: As = 'input', children, ...props
}: {
  icon: React.ElementType;
  label: string;
  required?: boolean;
  className?: string;
  as?: 'input' | 'select';
  children?: React.ReactNode;
} & (React.InputHTMLAttributes<HTMLInputElement> | React.SelectHTMLAttributes<HTMLSelectElement>)) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 flex gap-1 items-center">
        {label}{required && <span className="text-[#E60028]">*</span>}
      </label>
      <div className="relative group">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400 dark:text-slate-500 group-focus-within:text-[#E60028] dark:group-focus-within:text-[#E60028] transition-colors">
          <Icon className="w-[15px] h-[15px]" />
        </span>
        {As === 'select' ? (
          <select
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
            className="w-full appearance-none bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3
              text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#E60028]/50 focus:ring-2
              focus:ring-[#E60028]/15 transition-all cursor-pointer shadow-sm dark:shadow-none"
          >
            {children}
          </select>
        ) : (
          <input
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
            className="w-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3
              text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-[#E60028]/50
              focus:ring-2 focus:ring-[#E60028]/15 transition-all shadow-sm dark:shadow-none"
          />
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03] p-5 space-y-4">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#E60028] flex items-center gap-2">
        <Icon className="w-3 h-3" />{title}
      </p>
      {children}
    </div>
  );
}

/* ── Main Page ── */
export default function InscriptionPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  const [lang, setLang] = useState<Lang>('fr');
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    if (langOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [langOpen]);

  const LANG_OPTIONS: { code: Lang; label: string; flag: string }[] = [
    { code: 'fr', label: 'FR', flag: '🇫🇷' },
    { code: 'ar', label: 'AR', flag: '🇲🇦' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
  ];
  const currentLangObj = LANG_OPTIONS.find((l) => l.code === lang) || LANG_OPTIONS[0];
  const [step, setStep] = useState<StepId>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cndpConsent, setCndpConsent] = useState(false);
  const [showCndpModal, setShowCndpModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackCne, setTrackCne] = useState('');
  const [trackCin, setTrackCin] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<any | null>(null);

  const handleTrackDossier = async () => {
    if (!trackCne.trim() && !trackCin.trim()) return;
    setTrackingLoading(true);
    try {
      const res = await api.get('/public/track-dossier', { params: { cne: trackCne.trim(), cin: trackCin.trim() } });
      setTrackingResult(res.data?.candidate ?? null);
    } catch (err: any) {
      setTrackingResult({ error: err.response?.data?.message || 'Dossier non trouvé.' });
    } finally {
      setTrackingLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    cne: '',
    cin: '',
    last_name_fr: '',
    first_name_fr: '',
    last_name_ar: '',
    first_name_ar: '',
    birth_city_fr: '',
    birth_city_ar: '',
    birth_date: '',
    gender: 'female',
    family_status: 'Célibataire',
    nationality: 'Marocain(e)',
    country: 'Maroc',
    region: 'Fès-Meknès',
    province: 'Fès',
    address_fr: '',
    address_ar: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    
    // Step 2: Parents
    father_last_name_fr: '',
    father_first_name_fr: '',
    father_last_name_ar: '',
    father_first_name_ar: '',
    father_cin: '',
    father_job: 'Militaires et forces de sécurité',
    mother_last_name_fr: '',
    mother_first_name_fr: '',
    mother_last_name_ar: '',
    mother_first_name_ar: '',
    mother_cin: '',
    mother_job: 'Sans emploi',
    
    // Step 3: Académique
    bac_name: 'Bac Sciences Mathématiques B - Option Français',
    bac_mention: 'Très Bien',
    bac_average: '16.63',
    bac_year: '2026',
    high_school: 'Groupe scolaire LA RÉSIDENCE',
    academy: 'ACADEMIE Fès-Meknès — أكاديمية فاس - مكناس',
    delegation: 'FES',
    cycle: 'Cycle des deux années préparatoires',
    filiere: 'Deux années préparatoires',

    // Step 4: Documents
    bac_pdf_name: 'N140091375_BAC_MAAZOUZI.pdf',
    cnie_pdf_name: 'N140091375_CIN_MAAZOUZI.pdf',
    releve_notes_pdf_name: 'N140091375_RELEVE_NOTES.pdf',
    photo_url: '',
    photo_zoom: 100,
    photo_output_size: '413 x 531 px',
  });

  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const [cneCheckStatus, setCneCheckStatus] = useState<{ cneAvailable: boolean; cinAvailable: boolean; message: string | null }>({
    cneAvailable: true,
    cinAvailable: true,
    message: null,
  });

  useEffect(() => {
    if (!formData.cne && !formData.cin) return;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/v1/auth/check-cne-availability', {
          params: { cne: formData.cne, cin: formData.cin }
        });
        setCneCheckStatus({
          cneAvailable: res.data.cne_available,
          cinAvailable: res.data.cin_available,
          message: res.data.message,
        });
      } catch (err) {
        // Handle gracefully
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.cne, formData.cin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, filiere: e.target.value });
  };

  const t = dict[lang];
  const isRTL = lang === 'ar';
  const currentTheme = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;

  const goNext = () => setStep(s => Math.min(s + 1, 5) as StepId);
  const goPrev = () => setStep(s => Math.max(s - 1, 1) as StepId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (step === 1) {
      if (!cndpConsent) {
        setErrorMsg(lang === 'ar' ? 'يجب عليك الموافقة على معالجة البيانات الشخصية (القانون 09-08).' : 'Vous devez accepter le traitement de vos données personnelles conformément à la loi 09-08 (CNDP).');
        return;
      }
    }

    if (step < 5) { goNext(); return; }
    
    if (formData.password !== formData.password_confirmation) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!formData.filiere) {
      setErrorMsg('Veuillez sélectionner une filière.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const first_name = formData.first_name_fr || '';
    const last_name = formData.last_name_fr || '';

    const payload = {
      ...formData,
      first_name,
      last_name,
      full_name: `${first_name} ${last_name}`.trim(),
    };

    try {
      const res = await api.post('/v1/auth/register', payload);
      if (res.data.data?.token) {
        // Store token in auth store (Zustand) — never in localStorage directly
        useAuthStore.setState({
          token: res.data.data.token,
          user: res.data.data.user ?? null,
          isAuthenticated: !!res.data.data.user,
        });
      }
      setSubmitting(false);
      setDone(true);
      setTimeout(() => navigate('/login?registered=true'), 3000);
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err.response?.data?.message || 'Erreur lors de la soumission.');
    }
  };

  /* ── SUCCESS ── */
  if (done) {
    const envelopeQrToken = 'ENV-2026-' + (formData.cne ? formData.cne.substring(0, 6) : (Math.floor(Math.random() * 900000) + 100000));
    
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className={cn("min-h-screen flex flex-col items-center justify-center p-6 transition-colors", "bg-slate-50 dark:bg-[#030711]", t.font)}>
        <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-center">
          
          <div className="relative w-20 h-20 mx-auto">
            <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <span className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 shadow-xl">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Pré-Inscription Validée !</h2>
            <p className="text-xs text-slate-500 font-bold mt-1">
              Imprimez le reçu et l'étiquette QR Code à coller sur votre enveloppe physique de candidature.
            </p>
          </div>

          {/* Printable Envelope QR Code Label Card */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border-2 border-dashed border-indigo-300 dark:border-indigo-700 p-6 rounded-3xl space-y-4 text-left font-mono">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">ÉTIQUETTE À COLLER SUR L'ENVELOPPE</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {formData.last_name_fr ? `${formData.last_name_fr} ${formData.first_name_fr}` : 'CANDIDAT ADMIS TAFEM'}
                </span>
              </div>
              <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-black">
                ENCG FÈS 2026
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div>CNE : <span className="font-black text-indigo-600">{formData.cne || 'K13009281'}</span></div>
              <div>CIN : <span className="font-black text-slate-900 dark:text-white">{formData.cin || 'CD72910'}</span></div>
              <div>Filière : <span className="font-black text-slate-900 dark:text-white">{formData.filiere || 'Commerce & Gestion'}</span></div>
              <div>Statut : <span className="font-black text-amber-600">EN ATTENTE DOSSIER PHYSIQUE</span></div>
            </div>

            {/* Smart Rendez-vous Dépôt Box */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-300 block">📅 RENDEZ-VOUS DÉPÔT DOSSIER (LISSAGE DES FLUX)</span>
              <div className="flex justify-between items-center text-xs font-black text-slate-900 dark:text-white">
                <span>Mardi 28 Juillet 2026 (10:00 - 11:00)</span>
                <span className="text-indigo-600 font-mono">Guichet N° 2</span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">QR Code Enveloppe Identifiant</span>
                <span className="text-base font-black font-mono text-indigo-600">{envelopeQrToken}</span>
              </div>
              <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center font-mono font-black text-[10px]">
                [QR CODE]
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                const printWin = window.open('', '_blank')
                if (printWin) {
                  printWin.document.write(`
                    <html>
                      <head>
                        <title>Étiquette Enveloppe Dossier Physique — ENCG Fès</title>
                        <style>
                          body { font-family: Arial, sans-serif; padding: 40px; }
                          .label-card { border: 3px dashed #0f2863; padding: 30px; border-radius: 16px; width: 450px; margin: auto; text-align: center; }
                          .title { font-size: 16px; font-weight: bold; color: #0f2863; margin-bottom: 10px; }
                          .info { font-size: 13px; text-align: left; margin: 15px 0; }
                          .qr-mock { font-size: 20px; font-weight: bold; margin-top: 20px; padding: 15px; border: 2px solid #333; display: inline-block; }
                        </style>
                      </head>
                      <body>
                        <div class="label-card">
                          <div class="title">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
                          <div style="font-size:12px; font-weight:bold;">ÉTIQUETTE DOSSIER PHYSIQUE (À COLLER SUR L'ENVELOPPE)</div>
                          <div class="info">
                            <p><strong>Candidat :</strong> ${formData.last_name_fr} ${formData.first_name_fr}</p>
                            <p><strong>CNE :</strong> ${formData.cne}</p>
                            <p><strong>CIN :</strong> ${formData.cin}</p>
                            <p><strong>Contient :</strong> Bac Original, Relevés, CIN, 4 Photos</p>
                          </div>
                          <div class="qr-mock">
                            [QR CODE SCANNER]<br/>
                            <span style="font-size:12px;">${envelopeQrToken}</span>
                          </div>
                        </div>
                        <script>window.print();</script>
                      </body>
                    </html>
                  `)
                  printWin.document.close()
                }
              }}
              className="flex-1 py-3.5 bg-gradient-to-r from-[#0f2863] to-indigo-700 hover:opacity-90 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg cursor-pointer"
            >
              🖨️ Imprimer Reçu & Étiquette QR Code
            </button>

            <button
              onClick={() => navigate('/login?registered=true')}
              className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs uppercase tracking-wider cursor-pointer"
            >
              Se Connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pct = ((step - 1) / 4) * 100;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className={cn("min-h-screen transition-colors duration-500 selection:bg-[#E60028]/40 text-slate-900 dark:text-white bg-slate-50 dark:bg-[#030711]", t.font)}>

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#E60028]/[0.05] dark:bg-[#E60028]/[0.07] blur-[130px]" />
        <div className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full bg-blue-500/[0.03] dark:bg-[#E60028]/[0.05] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(var(--grid-color) 1px,transparent 1px),linear-gradient(90deg,var(--grid-color) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <style>{`:root { --grid-color: #000; } .dark { --grid-color: #fff; }`}</style>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ── Top Nav ── */}
        <nav className="flex items-center justify-between px-6 sm:px-12 py-6 border-b border-slate-200 dark:border-white/[0.06]">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg p-1 group-hover:scale-105 transition-transform border border-slate-100 dark:border-none">
              <img src="/logo-encg.png" alt="ENCG Fès" className="w-full h-full object-contain"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div>
              <p className="font-black text-sm text-slate-900 dark:text-white leading-tight">ENCG Fès</p>
              <p className="text-[9px] text-slate-500 leading-tight tracking-wider uppercase">École Nationale de Commerce</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-3">
            {/* Custom Glassmorphism Language Dropdown */}
            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((prev) => !prev)}
                className="flex items-center gap-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <span className="text-sm leading-none">{currentLangObj.flag}</span>
                <span>{currentLangObj.label}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", langOpen && "rotate-180")} />
              </button>

              {/* Floating Menu */}
              {langOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  {LANG_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setLang(opt.code);
                        setLangOpen(false);
                      }}
                      onClick={() => {
                        setLang(opt.code);
                        setLangOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        lang === opt.code 
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" 
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm leading-none">{opt.flag}</span>
                        <span>{opt.label}</span>
                      </span>
                      {lang === opt.code && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shadow-xs cursor-pointer"
              title="Changer de thème"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              onClick={() => setShowTrackingModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg font-black text-xs hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" /> {lang === 'ar' ? 'تتبع ملفي' : 'Suivre mon Dossier'}
            </button>

            <Link to="/login" className="hidden sm:flex text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors items-center gap-1.5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 hover:border-slate-300 dark:hover:border-white/25 shadow-sm">
              {t.alreadyRegistered} <ArrowRight className={cn("w-3.5 h-3.5", isRTL && "rotate-180")} />
            </Link>
          </div>
        </nav>

        {/* ── Main ── */}
        <main className="flex-1 flex flex-col items-center py-10 px-4 sm:px-6">

          <div className="text-center mb-8 max-w-xl">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              {lang === 'ar' ? (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E60028] via-red-400 to-[#E60028]">Inscription Étudiante</span>
              ) : (
                <>Inscription <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E60028] via-red-400 to-[#E60028]">Étudiante</span></>
              )}
            </h1>
            <p className="text-slate-600 dark:text-slate-500 text-sm leading-relaxed">
              Complétez le formulaire en 5 étapes pour soumettre votre dossier officiel à l'ENCG Fès.
            </p>
          </div>

          {/* ── Step Indicator ── */}
          <div className="w-full max-w-3xl mb-8">
            <div className="relative flex items-start justify-between">
              <div className={cn("absolute top-5 h-[2px] bg-slate-200 dark:bg-white/8 rounded-full", isRTL ? "right-[calc(10%)] left-[calc(10%)]" : "left-[calc(10%)] right-[calc(10%)]")}>
                <div className={cn("h-full bg-gradient-to-r from-[#E60028] to-red-500 rounded-full transition-all duration-700 ease-out", isRTL ? "float-right" : "")} style={{ width: `${pct}%` }} />
              </div>

              {STEPS.map(({ id, label, sub, icon: Icon }) => {
                const done_  = step > id;
                const active = step === id;
                return (
                  <div key={id} className="flex flex-col items-center gap-2 w-1/5 z-10">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 text-sm font-bold cursor-pointer',
                      done_  ? 'bg-[#E60028] border-[#E60028] text-white scale-110 shadow-lg shadow-[#E60028]/40'
                             : active ? 'bg-white dark:bg-[#030711] border-[#E60028] text-[#E60028] scale-110 shadow-lg shadow-[#E60028]/20'
                                      : 'bg-white dark:bg-[#030711] border-slate-200 dark:border-white/15 text-slate-400 dark:text-slate-600'
                    )}
                    onClick={() => { if (id < step) setStep(id); }}
                    >
                      {done_ ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={cn('text-xs font-bold tracking-wide transition-colors text-center', active || done_ ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600')}>
                      {label}
                    </span>
                    <span className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-500 text-center leading-tight px-1">{sub}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Error Message ── */}
          {errorMsg && (
            <div className="w-full max-w-2xl mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          {/* ── Form Card ── */}
          <div className="w-full max-w-2xl">
            <div className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] backdrop-blur-md shadow-2xl overflow-hidden transition-colors">

              <div className="h-1 bg-gradient-to-r from-[#E60028]/0 via-[#E60028] to-[#E60028]/0" />

              <form onSubmit={onSubmit} className="p-6 sm:p-10">

                {/* ═══════════ STEP 1 ═══════════ */}
                {step === 1 && (
                  <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#E60028]/10 dark:bg-[#E60028]/15 border border-[#E60028]/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-[#E60028]" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-white text-base">Informations Personnelles & Identité</h3>
                          <p className="text-xs text-slate-500">Remplissez les informations d'identité, de naissance et de résidence</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#E60028] bg-red-50 dark:bg-red-950/40 px-3 py-1 rounded-full border border-red-200 dark:border-red-900">
                        Étape 1 sur 3
                      </span>
                    </div>

                    {/* Section 1: Identifiants Principaux */}
                    <SectionCard title="1. Identifiants de Candidature & Compte (Anti-Fraude Check)" icon={Hash}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={Hash} label="CNE (Code Massar)" required type="text" name="cne" value={formData.cne} onChange={handleChange} placeholder="N140091375" />
                        <Field icon={Hash} label="CNIE (Carte d'Identité)" required type="text" name="cin" value={formData.cin} onChange={handleChange} placeholder="CD994937" />
                        <Field icon={Mail} label="Adresse E-mail" required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="aminamasefri@gmail.com" />
                        <Field icon={Phone} label="Téléphone Portable" required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="0657272322" />
                      </div>

                      {cneCheckStatus.message && (!cneCheckStatus.cneAvailable || !cneCheckStatus.cinAvailable) && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mt-3 animate-in fade-in">
                          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{cneCheckStatus.message}</span>
                        </div>
                      )}
                    </SectionCard>

                    {/* Section 2: Nom & Prénom en FR & AR */}
                    <SectionCard title="2. Identité en Français & en Arabe" icon={User}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={User} label="Nom en Français" required type="text" name="last_name_fr" value={formData.last_name_fr} onChange={handleChange} placeholder="Maazouzi Sefrioui" />
                        <Field icon={User} label="Prénom en Français" required type="text" name="first_name_fr" value={formData.first_name_fr} onChange={handleChange} placeholder="AMINA" />
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Nom en Arabe *</label>
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200">⌨️ العربية</span>
                          </div>
                          <input type="text" dir="rtl" name="last_name_ar" value={formData.last_name_ar} onChange={handleChange} placeholder="معزوزي صفريوي" className="w-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-serif outline-none focus:ring-2 focus:ring-[#E60028]/15" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Prénom en Arabe *</label>
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200">⌨️ العربية</span>
                          </div>
                          <input type="text" dir="rtl" name="first_name_ar" value={formData.first_name_ar} onChange={handleChange} placeholder="أمينة" className="w-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-serif outline-none focus:ring-2 focus:ring-[#E60028]/15" />
                        </div>
                      </div>
                    </SectionCard>

                    {/* Section 3: Naissance & État Civil */}
                    <SectionCard title="3. Naissance & État Civil" icon={Calendar}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={Calendar} label="Date de naissance" required type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} />
                        
                        <Field icon={User} label="Sexe" required as="select" name="gender" value={formData.gender} onChange={handleChange}>
                          <option value="female">Féminin (أنثى)</option>
                          <option value="male">Masculin (ذكر)</option>
                        </Field>

                        <Field icon={MapPin} label="Lieu de naissance (FR)" required type="text" name="birth_city_fr" value={formData.birth_city_fr} onChange={handleChange} placeholder="FES" />
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Lieu de naissance (AR)</label>
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200">⌨️ العربية</span>
                          </div>
                          <input type="text" dir="rtl" name="birth_city_ar" value={formData.birth_city_ar} onChange={handleChange} placeholder="فاس" className="w-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-serif outline-none focus:ring-2 focus:ring-[#E60028]/15" />
                        </div>

                        <Field icon={User} label="Situation Familiale" required as="select" name="family_status" value={formData.family_status} onChange={handleChange}>
                          <option value="Célibataire">Célibataire (عازب/ة)</option>
                          <option value="Marié(e)">Marié(e) (متزوج/ة)</option>
                        </Field>

                        <Field icon={Globe} label="Nationalité" required as="select" name="nationality" value={formData.nationality} onChange={handleChange}>
                          <option value="Marocain(e)">Marocain(e) (مغربية)</option>
                          <option value="Étranger">Étranger (أجنبي/ة)</option>
                        </Field>
                      </div>
                    </SectionCard>

                    {/* Section 4: Localisation & Adresse de Résidence */}
                    <SectionCard title="4. Localisation & Domicile" icon={MapPin}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={Globe} label="Pays" required as="select" name="country" value={formData.country} onChange={handleChange}>
                          <option value="Maroc">Maroc (المغرب)</option>
                          <option value="Autre">Autre Pays</option>
                        </Field>

                        <Field icon={MapPin} label="Région" required as="select" name="region" value={formData.region} onChange={handleChange}>
                          <option value="Fès-Meknès">Fès-Meknès</option>
                          <option value="Rabat-Salé-Kénitra">Rabat-Salé-Kénitra</option>
                          <option value="Casablanca-Settat">Casablanca-Settat</option>
                          <option value="Tangier-Tetouan-Al Hoceima">Tanger-Tétouan-Al Hoceïma</option>
                          <option value="Oriental">L'Oriental</option>
                          <option value="Marrakesh-Safi">Marrakech-Safi</option>
                          <option value="Souss-Massa">Souss-Massa</option>
                        </Field>

                        <Field icon={MapPin} label="Province / Préfecture" required as="select" name="province" value={formData.province} onChange={handleChange}>
                          <option value="Fès">Fès</option>
                          <option value="Meknès">Meknès</option>
                          <option value="Sefrou">Sefrou</option>
                          <option value="Taza">Taza</option>
                          <option value="Autre">Autre Province</option>
                        </Field>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Adresse de Résidence (FR) *</label>
                          <input type="text" name="address_fr" value={formData.address_fr} onChange={handleChange} placeholder="22AV MLY RACHID RCE JAWHARA APPT8 BOURAMANA VN FES" className="w-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#E60028]/15" />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Adresse de Résidence en Arabe *</label>
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200">⌨️ العربية</span>
                          </div>
                          <input type="text" dir="rtl" name="address_ar" value={formData.address_ar} onChange={handleChange} placeholder="22 شارع مولاي رشيد إقامة جوهرة شقة 8 بورمانة فاس" className="w-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-serif outline-none focus:ring-2 focus:ring-[#E60028]/15" />
                        </div>

                        <Field icon={Lock} label="Mot de passe" required type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 8 caractères" />
                        <Field icon={Lock} label="Confirmer mot de passe" required type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} placeholder="Répéter le mot de passe" />
                      </div>
                    </SectionCard>

                    <div className="flex items-start gap-3 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 mt-2">
                      <input
                        type="checkbox"
                        id="cndp_consent"
                        checked={cndpConsent}
                        onChange={(e) => setCndpConsent(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#E60028] focus:ring-[#E60028] accent-[#E60028] mt-0.5 cursor-pointer flex-shrink-0"
                      />
                      <label htmlFor="cndp_consent" className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer select-none">
                        {lang === 'ar' ? (
                          <>
                            أوافق على معالجة معطياتي الشخصية من طرف المؤسسة لأغراض إدارية وبيداغوجية، وذلك طبقاً لمقتضيات <strong>القانون رقم 09-08</strong>.
                            <button type="button" onClick={() => setShowCndpModal(true)} className="text-[#E60028] hover:underline font-bold ms-1">لمعرفة المزيد</button>
                          </>
                        ) : (
                          <>
                            J'accepte le traitement de mes données personnelles par l'ENCG Fès dans le cadre de la gestion administrative et pédagogique de ma scolarité, conformément à la <strong>loi n° 09-08</strong> de la CNDP.
                            <button type="button" onClick={() => setShowCndpModal(true)} className="text-[#E60028] hover:underline font-bold ms-1">En savoir plus</button>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* ═══════════ STEP 2 ═══════════ */}
                {step === 2 && (
                  <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#E60028]/10 dark:bg-[#E60028]/15 border border-[#E60028]/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-[#E60028]" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-white text-base">Informations des Parents & Tuteurs Légaux</h3>
                          <p className="text-xs text-slate-500">Renseignez l'état civil, les pièces d'identité et professions du père et de la mère</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#E60028] bg-red-50 dark:bg-red-950/40 px-3 py-1 rounded-full border border-red-200 dark:border-red-900">
                        Étape 2 sur 3
                      </span>
                    </div>

                    {/* Section Père */}
                    <SectionCard title="Informations du Père (معلومات الأب)" icon={User}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={User} label="Nom du père" required type="text" name="father_last_name_fr" value={formData.father_last_name_fr} onChange={handleChange} placeholder="Maazouzi Sefrioui" />
                        <Field icon={User} label="Prénom du père" required type="text" name="father_first_name_fr" value={formData.father_first_name_fr} onChange={handleChange} placeholder="Mohammed" />

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Nom du père en Arabe *</label>
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200">⌨️ العربية</span>
                          </div>
                          <input type="text" dir="rtl" name="father_last_name_ar" value={formData.father_last_name_ar} onChange={handleChange} placeholder="معزوزي صفريوي" className="w-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-serif outline-none focus:ring-2 focus:ring-[#E60028]/15" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Prénom du père en Arabe *</label>
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200">⌨️ العربية</span>
                          </div>
                          <input type="text" dir="rtl" name="father_first_name_ar" value={formData.father_first_name_ar} onChange={handleChange} placeholder="محمد" className="w-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-serif outline-none focus:ring-2 focus:ring-[#E60028]/15" />
                        </div>

                        <Field icon={Hash} label="CNIE du père" required type="text" name="father_cin" value={formData.father_cin} onChange={handleChange} placeholder="E579196" />

                        <Field icon={Building2} label="Profession du père" required as="select" name="father_job" value={formData.father_job} onChange={handleChange}>
                          <option value="Militaires et forces de sécurité">Militaires et forces de sécurité</option>
                          <option value="Cadres supérieurs / Professions intellectuelles">Cadres supérieurs / Professions intellectuelles</option>
                          <option value="Fonctionnaires et enseignants">Fonctionnaires et enseignants</option>
                          <option value="Artisans et ouvriers qualifiés">Artisans et ouvriers qualifiés</option>
                          <option value="Commerçants et indépendants">Commerçants et indépendants</option>
                          <option value="Employés du secteur privé">Employés du secteur privé</option>
                          <option value="Retraité">Retraité</option>
                          <option value="Sans emploi">Sans emploi</option>
                        </Field>
                      </div>
                    </SectionCard>

                    {/* Section Mère */}
                    <SectionCard title="Informations de la Mère (معلومات الأم)" icon={User}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={User} label="Nom de la mère" required type="text" name="mother_last_name_fr" value={formData.mother_last_name_fr} onChange={handleChange} placeholder="Satouri" />
                        <Field icon={User} label="Prénom de la mère" required type="text" name="mother_first_name_fr" value={formData.mother_first_name_fr} onChange={handleChange} placeholder="Boutaina" />

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Nom de la mère en Arabe *</label>
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200">⌨️ العربية</span>
                          </div>
                          <input type="text" dir="rtl" name="mother_last_name_ar" value={formData.mother_last_name_ar} onChange={handleChange} placeholder="الساطوري" className="w-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-serif outline-none focus:ring-2 focus:ring-[#E60028]/15" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Prénom de la mère en Arabe *</label>
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200">⌨️ العربية</span>
                          </div>
                          <input type="text" dir="rtl" name="mother_first_name_ar" value={formData.mother_first_name_ar} onChange={handleChange} placeholder="بثينة" className="w-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-serif outline-none focus:ring-2 focus:ring-[#E60028]/15" />
                        </div>

                        <Field icon={Hash} label="CNIE de la mère" required type="text" name="mother_cin" value={formData.mother_cin} onChange={handleChange} placeholder="C567108" />

                        <Field icon={Building2} label="Profession de la mère" required as="select" name="mother_job" value={formData.mother_job} onChange={handleChange}>
                          <option value="Sans emploi (Mère au foyer)">Sans emploi (Mère au foyer)</option>
                          <option value="Cadres supérieurs / Professions intellectuelles">Cadres supérieurs / Professions intellectuelles</option>
                          <option value="Fonctionnaires et enseignants">Fonctionnaires et enseignants</option>
                          <option value="Commerçantes et indépendantes">Commerçantes et indépendantes</option>
                          <option value="Employées du secteur privé">Employées du secteur privé</option>
                          <option value="Retraitée">Retraitée</option>
                        </Field>
                      </div>
                    </SectionCard>
                  </div>
                )}

                {/* ═══════════ STEP 3 ═══════════ */}
                {step === 3 && (
                  <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#E60028]/10 dark:bg-[#E60028]/15 border border-[#E60028]/20 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-[#E60028]" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-white text-base">Informations Académiques & Orientations</h3>
                          <p className="text-xs text-slate-500">Cursus du baccalauréat, moyenne, lycée et filière demandée</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#E60028] bg-red-50 dark:bg-red-950/40 px-3 py-1 rounded-full border border-red-200 dark:border-red-900">
                        Étape 3 sur 5
                      </span>
                    </div>

                    <SectionCard title="Informations du Baccalauréat & Établissement" icon={BookOpen}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={BookOpen} label="Série du Baccalauréat" required as="select" name="bac_name" value={formData.bac_name} onChange={handleChange}>
                          <option value="Bac Sciences Mathématiques B - Option Français">Bac Sciences Mathématiques B - Option Français</option>
                          <option value="Bac Sciences Mathématiques A - Option Français">Bac Sciences Mathématiques A - Option Français</option>
                          <option value="Bac Physique-Chimie (PC)">Bac Physique-Chimie (PC)</option>
                          <option value="Bac Sciences de la Vie et de la Terre (SVT)">Bac Sciences de la Vie et de la Terre (SVT)</option>
                          <option value="Bac Sciences Économiques">Bac Sciences Économiques</option>
                          <option value="Bac Techniques de Gestion et Comptabilité (TGC)">Bac Techniques de Gestion et Comptabilité (TGC)</option>
                        </Field>

                        <Field icon={Star} label="Mention au Bac" required as="select" name="bac_mention" value={formData.bac_mention} onChange={handleChange}>
                          <option value="Très Bien">Très Bien (≥ 16.00)</option>
                          <option value="Bien">Bien (14.00 - 15.99)</option>
                          <option value="Assez Bien">Assez Bien (12.00 - 13.99)</option>
                          <option value="Passable">Passable (10.00 - 11.99)</option>
                        </Field>

                        <Field icon={Star} label="Moyenne générale du Bac" required type="number" step="0.01" name="bac_average" value={formData.bac_average} onChange={handleChange} placeholder="16.63" />

                        <Field icon={Calendar} label="Année d'obtention du Bac" required as="select" name="bac_year" value={formData.bac_year} onChange={handleChange}>
                          <option value="2026">2026</option>
                          <option value="2025">2025</option>
                          <option value="2024">2024</option>
                        </Field>

                        <Field icon={Building2} label="Lycée / Établissement" required type="text" name="high_school" value={formData.high_school} onChange={handleChange} placeholder="Groupe scolaire LA RÉSIDENCE" className="sm:col-span-2" />

                        <Field icon={Building2} label="Académie Régionale" required as="select" name="academy" value={formData.academy} onChange={handleChange}>
                          <option value="ACADEMIE Fès-Meknès — أكاديمية فاس - مكناس">ACADEMIE Fès-Meknès — أكاديمية فاس - مكناس</option>
                          <option value="ACADEMIE Rabat-Salé-Kénitra">ACADEMIE Rabat-Salé-Kénitra</option>
                          <option value="ACADEMIE Casablanca-Settat">ACADEMIE Casablanca-Settat</option>
                          <option value="ACADEMIE Tanger-Tétouan-Al Hoceïma">ACADEMIE Tanger-Tétouan-Al Hoceïma</option>
                        </Field>

                        <Field icon={MapPin} label="Délégation" required as="select" name="delegation" value={formData.delegation} onChange={handleChange}>
                          <option value="FES">FÈS</option>
                          <option value="MEKNES">MEKNÈS</option>
                          <option value="SEFROU">SEFROU</option>
                        </Field>

                        <Field icon={GraduationCap} label="Cycle" required as="select" name="cycle" value={formData.cycle} onChange={handleChange}>
                          <option value="Cycle des deux années préparatoires">Cycle des deux années préparatoires (TC)</option>
                          <option value="Cycle Spécialisé (Master / Licence)">Cycle Spécialisé (Master / Licence)</option>
                        </Field>

                        <Field icon={BookOpen} label="Filière Affectée" required as="select" name="filiere" value={formData.filiere} onChange={handleChange}>
                          <option value="Deux années préparatoires">Deux années préparatoires</option>
                          <option value="Marketing et Action Commerciale">Marketing et Action Commerciale</option>
                          <option value="Finance et Comptabilité">Finance et Comptabilité</option>
                          <option value="Audit et Contrôle de Gestion">Audit et Contrôle de Gestion</option>
                          <option value="Management des Ressources Humaines">Management des Ressources Humaines</option>
                        </Field>
                      </div>
                    </SectionCard>
                  </div>
                )}

                {/* ═══════════ STEP 4: DOCUMENTS ═══════════ */}
                {step === 4 && (
                  <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-white text-base">Téléchargement des Pièces Justificatives</h3>
                          <p className="text-xs text-slate-500">Importez les versions numérisées PDF de votre Bac, CIN et photo d'identité 35x45</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
                        Étape 4 sur 5
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Document 1: Bac PDF */}
                      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                            🎓 Bac (Pdf, Max 10Mo)
                          </h4>
                          <span className="text-[10px] text-slate-400">PDF scanné recto-verso</span>
                        </div>
                        <p className="text-xs text-slate-500">Le document doit être scanné recto-verso et regroupé dans un seul fichier PDF.</p>
                        
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                          <div className="flex items-center gap-2 font-mono text-slate-700 dark:text-slate-300 truncate max-w-[300px]">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{formData.bac_pdf_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => toast.info('Aperçu du PDF du Bac')} className="px-3 py-1 bg-white dark:bg-slate-800 border rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer">
                              👁️ Voir
                            </button>
                            <label className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-1 cursor-pointer">
                              ✏️ Modifier
                              <input type="file" accept=".pdf" className="hidden" onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setFormData({ ...formData, bac_pdf_name: e.target.files[0].name });
                                  toast.success('Document Bac mis à jour !');
                                }
                              }} />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Document 2: CNIE PDF */}
                      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                            🪪 CNIE (Pdf, Max 10Mo)
                          </h4>
                          <span className="text-[10px] text-slate-400">PDF scanné recto-verso</span>
                        </div>
                        <p className="text-xs text-slate-500">Le document doit être scanné recto-verso et regroupé dans un seul fichier PDF.</p>
                        
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                          <div className="flex items-center gap-2 font-mono text-slate-700 dark:text-slate-300 truncate max-w-[300px]">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{formData.cnie_pdf_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => toast.info('Aperçu de la CNIE')} className="px-3 py-1 bg-white dark:bg-slate-800 border rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer">
                              👁️ Voir
                            </button>
                            <label className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-1 cursor-pointer">
                              ✏️ Modifier
                              <input type="file" accept=".pdf" className="hidden" onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setFormData({ ...formData, cnie_pdf_name: e.target.files[0].name });
                                  toast.success('Document CNIE mis à jour !');
                                }
                              }} />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Document 3: Relevé de Notes du Baccalauréat PDF */}
                      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                            📊 Relevé de Notes du Baccalauréat (Pdf, Max 10Mo)
                          </h4>
                          <span className="text-[10px] text-slate-400">Pour vérification de la moyenne du Bac par IA</span>
                        </div>
                        <p className="text-xs text-slate-500">Scannez le relevé de notes officiel indiquant la moyenne générale du Baccalauréat.</p>
                        
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                          <div className="flex items-center gap-2 font-mono text-slate-700 dark:text-slate-300 truncate max-w-[300px]">
                            <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>{formData.releve_notes_pdf_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => toast.info('Aperçu du Relevé de Notes')} className="px-3 py-1 bg-white dark:bg-slate-800 border rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer">
                              👁️ Voir
                            </button>
                            <label className="px-3 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold hover:bg-purple-100 flex items-center gap-1 cursor-pointer">
                              ✏️ Modifier
                              <input type="file" accept=".pdf" className="hidden" onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setFormData({ ...formData, releve_notes_pdf_name: e.target.files[0].name });
                                  toast.success('Relevé de notes mis à jour !');
                                }
                              }} />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Document 3: Photo d'identité (35 x 45 mm) */}
                      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                          📸 Photo d'identité
                        </h4>
                        <p className="text-xs text-slate-500">Format obligatoire : 35 × 45 mm (ratio 7:9), photo récente en couleur sur fond clair.</p>
                        
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-24 rounded-2xl bg-slate-100 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 overflow-hidden shrink-0 shadow-md flex items-center justify-center">
                            {formData.photo_url ? (
                              <img src={formData.photo_url} alt="Photo profil" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-slate-400 text-center p-2">Photo 35×45mm</span>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button type="button" onClick={() => toast.info('Aperçu plein écran de la photo')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                                👁️ Voir
                              </button>
                              
                              <button type="button" onClick={() => setShowPhotoModal(true)} className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                                ✂️ Ajuster (Crop & Zoom)
                              </button>

                              <label className="px-3.5 py-1.5 bg-[#0f2863] text-white hover:bg-[#1a387e] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs">
                                🖼️ Remplacer
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    const url = URL.createObjectURL(e.target.files[0]);
                                    setFormData({ ...formData, photo_url: url });
                                    setShowPhotoModal(true);
                                  }
                                }} />
                              </label>
                            </div>
                            <p className="text-[10px] text-emerald-600 font-bold">Photo existante — utilisez « Ajuster » pour appliquer le format 35 × 45 mm.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══════════ STEP 5: CONFIRMATION FINALE ═══════════ */}
                {step === 5 && (
                  <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
                    <div className="text-center space-y-2 py-4">
                      <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">Confirmation finale</h3>
                      <p className="text-xs text-slate-500">Merci de vérifier soigneusement vos informations avant de valider l'inscription.</p>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* Card 1: Personnelles */}
                      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                        <h4 className="font-black text-blue-600 dark:text-blue-400 text-sm flex items-center gap-2 border-b pb-2">
                          <User className="w-4 h-4" /> Informations personnelles
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                          <div><strong>Nom (Fr) :</strong> {formData.last_name_fr || 'Maazouzi Sefrioui'}</div>
                          <div><strong>Prénom (Fr) :</strong> {formData.first_name_fr || 'AMINA'}</div>
                          <div><strong>Nom (Ar) :</strong> <span className="font-serif font-bold">{formData.last_name_ar || 'معزوزي صفريوي'}</span></div>
                          <div><strong>Prénom (Ar) :</strong> <span className="font-serif font-bold">{formData.first_name_ar || 'أمينة'}</span></div>
                          <div><strong>Email :</strong> {formData.email || 'aminamasefri@gmail.com'}</div>
                          <div><strong>Téléphone :</strong> {formData.phone || '0657272322'}</div>
                          <div><strong>Lieu de naissance (Fr) :</strong> {formData.birth_city_fr || 'FES'}</div>
                          <div><strong>Lieu de naissance (Ar) :</strong> <span className="font-serif font-bold">{formData.birth_city_ar || 'فاس'}</span></div>
                          <div><strong>Sexe :</strong> {formData.gender === 'female' ? 'Féminin' : 'Masculin'}</div>
                          <div><strong>CNE / CNIE :</strong> {formData.cne || 'N140091375'} / {formData.cin || 'CD994937'}</div>
                        </div>
                      </div>

                      {/* Card 2: Parents */}
                      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                        <h4 className="font-black text-blue-600 dark:text-blue-400 text-sm flex items-center gap-2 border-b pb-2">
                          <Users className="w-4 h-4" /> Informations des parents
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                          <div><strong>Nom du père (Fr) :</strong> {formData.father_last_name_fr || 'Maazouzi Sefrioui'}</div>
                          <div><strong>Prénom du père (Fr) :</strong> {formData.father_first_name_fr || 'Mohammed'}</div>
                          <div><strong>Nom du père (Ar) :</strong> <span className="font-serif font-bold">{formData.father_last_name_ar || 'معزوزي صفريوي'}</span></div>
                          <div><strong>Prénom du père (Ar) :</strong> <span className="font-serif font-bold">{formData.father_first_name_ar || 'محمد'}</span></div>
                          <div><strong>CNIE du père :</strong> {formData.father_cin || 'E579196'}</div>
                          <div><strong>Profession du père :</strong> {formData.father_job}</div>
                          <div><strong>Nom de la mère (Fr) :</strong> {formData.mother_last_name_fr || 'Satouri'}</div>
                          <div><strong>Prénom de la mère (Fr) :</strong> {formData.mother_first_name_fr || 'Boutaina'}</div>
                          <div><strong>Nom de la mère (Ar) :</strong> <span className="font-serif font-bold">{formData.mother_last_name_ar || 'الساطوري'}</span></div>
                          <div><strong>Prénom de la mère (Ar) :</strong> <span className="font-serif font-bold">{formData.mother_first_name_ar || 'بثينة'}</span></div>
                          <div><strong>CNIE de la mère :</strong> {formData.mother_cin || 'C567108'}</div>
                          <div><strong>Profession de la mère :</strong> {formData.mother_job}</div>
                        </div>
                      </div>

                      {/* Card 3: Académiques */}
                      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                        <h4 className="font-black text-blue-600 dark:text-blue-400 text-sm flex items-center gap-2 border-b pb-2">
                          <GraduationCap className="w-4 h-4" /> Informations académiques
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                          <div className="col-span-2"><strong>Bac :</strong> {formData.bac_name}</div>
                          <div><strong>Mention :</strong> {formData.bac_mention}</div>
                          <div><strong>Moyenne générale :</strong> {formData.bac_average}</div>
                          <div><strong>Année :</strong> {formData.bac_year}</div>
                          <div><strong>Établissement :</strong> {formData.high_school}</div>
                          <div className="col-span-2"><strong>Académie :</strong> {formData.academy}</div>
                          <div><strong>Délégation :</strong> {formData.delegation}</div>
                          <div><strong>Cycle :</strong> {formData.cycle}</div>
                          <div className="col-span-2"><strong>Filière :</strong> {formData.filiere}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Navigation ── */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={goPrev}
                    className={cn(
                      'flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm border transition-all cursor-pointer',
                      step === 1
                        ? 'opacity-0 pointer-events-none'
                        : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t.btnPrev}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {([1, 2, 3, 4, 5] as StepId[]).map(i => (
                      <span key={i} className={cn(
                        'rounded-full transition-all duration-300',
                        step === i ? 'w-6 h-1.5 bg-[#E60028]' : step > i ? 'w-1.5 h-1.5 bg-[#E60028]/40' : 'w-1.5 h-1.5 bg-slate-200 dark:bg-white/15'
                      )} />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] hover:opacity-95
                      text-white px-5 sm:px-7 py-2.5 rounded-xl font-bold text-sm tracking-wide
                      transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        {t.btnSending}
                      </>
                    ) : step === 5 ? (
                      <><Rocket className="w-4 h-4 text-amber-400" /> Valider & Soumettre L'Inscription</>
                    ) : (
                      <>{t.btnNext} <ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} /></>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <p className="text-center text-xs text-slate-500 mt-6">
              © 2026 ENCG Fès — USMBA · Service Informatique ·{' '}
              <Link to="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Retour à l'accueil</Link>
            </p>
          </div>
        </main>

        {/* ── PHOTO CROPPER / ADJUSTER MODAL ── */}
        {showPhotoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-95">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="p-4 bg-[#0f2863] text-white flex items-center justify-between">
                <h4 className="text-sm font-black flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-amber-400" /> Ajuster la photo d'identité
                </h4>
                <button onClick={() => setShowPhotoModal(false)} className="p-1 hover:bg-white/10 rounded-full text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <p className="text-xs text-slate-500">Placez le visage dans le cadre, puis choisissez le zoom et la résolution.</p>
                
                {/* Photo Cropper Frame Grid */}
                <div className="relative w-64 h-80 mx-auto bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-indigo-500">
                  <img
                    src={formData.photo_url || '/placeholder-student.png'}
                    alt="Target Photo"
                    className="w-full h-full object-cover transition-transform"
                    style={{ transform: `scale(${1 + (formData.photo_zoom || 0) / 100})` }}
                  />
                  
                  {/* Framing Grid Overlay */}
                  <div className="absolute inset-0 border-2 border-white/40 pointer-events-none grid grid-cols-3 grid-rows-3">
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-white/20" />
                    <div className="border-r border-white/20" />
                    <div />
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Zoom du cadrage</span>
                      <span className="text-indigo-600 font-mono">{formData.photo_zoom}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.photo_zoom}
                      onChange={(e) => setFormData({ ...formData, photo_zoom: Number(e.target.value) })}
                      className="w-full accent-[#0f2863] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Dimensions de sortie :</span>
                    <span className="font-mono font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800">
                      {formData.photo_output_size}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center font-mono">
                    Format physique : 35 × 45 mm — ratio 7:9 verrouillé
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoModal(false);
                    toast.success('Photo cadrée au format 35x45mm !');
                  }}
                  className="px-6 py-2 bg-[#0f2863] hover:bg-[#1a387e] text-white rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer shadow-md"
                >
                  Valider la photo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Suivi du Dossier en Temps Réel ── */}
      {showTrackingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-amber-300">
                  <Search className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black">Suivi du Dossier en Temps Réel</h3>
                  <p className="text-xs text-blue-200">تتبع حالة ملفك الأكاديمي فـ الوقت الحقيقي</p>
                </div>
              </div>
              <button onClick={() => setShowTrackingModal(false)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-slate-400 block">Saisissez votre Code MASSAR / CNE ou CIN</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: K13009281 ou CIN CD72910..."
                    value={trackCne}
                    onChange={e => setTrackCne(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleTrackDossier}
                    disabled={trackingLoading}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                  >
                    {trackingLoading ? 'Recherche...' : 'Suivre'}
                  </button>
                </div>
              </div>

              {/* Tracking Result Timeline */}
              {trackingResult && (
                trackingResult.error ? (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-bold text-rose-700 dark:text-rose-300 text-center">
                    ❌ {trackingResult.error}
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">{trackingResult.name}</h4>
                      <span className="text-xs text-slate-500 font-bold font-mono">CNE : {trackingResult.cne} | Filière : {trackingResult.filiere}</span>
                    </div>

                    <div className="space-y-3 pl-2">
                      {trackingResult.timeline?.map((step: any) => (
                        <div key={step.step} className="flex items-start gap-3 text-xs">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5",
                            step.completed ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-800"
                          )}>
                            {step.completed ? '✓' : step.step}
                          </div>
                          <div className="flex-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <h5 className="font-black text-slate-900 dark:text-white">{step.title}</h5>
                            <span className="text-[10px] text-slate-500 block">{step.title_ar}</span>
                            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">{step.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      <CndpPrivacyModal isOpen={showCndpModal} onClose={() => setShowCndpModal(false)} lang={lang} />

      {/* AI ScolarBot Widget (AI Module #4) */}
      <AiScolarBotWidget />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-\\[fadeIn_0\\.3s_ease\\] { animation: fadeIn 0.3s ease both; }
      `}</style>
    </div>
  );
}
