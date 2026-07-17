import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Users, GraduationCap, CheckCircle2, Lock, Mail,
  MapPin, Calendar, Hash, Star, Building2, BookOpen,
  ChevronLeft, ArrowRight, Rocket, Phone, Shield, Sun, Moon, Globe
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useTheme } from '@shared/components/layout/ThemeProvider';
import api from '@shared/lib/api';
import { useAuthStore } from '@stores/authStore';
import { CndpPrivacyModal } from '@shared/components/ui/CndpPrivacyModal';

/* ── Types ── */
type StepId = 1 | 2 | 3;
type Lang = 'fr' | 'ar' | 'en';

const STEPS = [
  { id: 1 as StepId, label: 'Identité',       sub: 'Compte & infos personnelles', icon: User          },
  { id: 2 as StepId, label: 'Parents',        sub: 'Naissance & tuteurs légaux',   icon: Users         },
  { id: 3 as StepId, label: 'Bac & Filière',  sub: 'Cursus académique & choix',    icon: GraduationCap },
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
  const [step, setStep] = useState<StepId>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cndpConsent, setCndpConsent] = useState(false);
  const [showCndpModal, setShowCndpModal] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', password_confirmation: '',
    cne: '', cin: '', phone: '', birth_date: '', birth_city: '',
    father_name: '', father_cin: '', father_job: '',
    mother_name: '', mother_cin: '', mother_job: '',
    bac_type: '', bac_series: '', bac_average: '', bac_year: '', high_school_city: '', filiere: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, filiere: e.target.value });
  };

  const t = dict[lang];
  const isRTL = lang === 'ar';
  const currentTheme = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;

  const goNext = () => setStep(s => Math.min(s + 1, 3) as StepId);
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

    if (step < 3) { goNext(); return; }
    
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

    const names = formData.full_name.trim().split(' ');
    const first_name = names[0] || '';
    const last_name = names.slice(1).join(' ') || '';

    const payload = {
      ...formData,
      first_name,
      last_name,
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
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className={cn("min-h-screen flex flex-col items-center justify-center text-center p-8 transition-colors", "bg-slate-50 dark:bg-[#030711]", t.font)}>
        <div className="relative w-24 h-24 mb-8">
          <span className="absolute inset-0 rounded-full bg-[#E60028]/20 animate-ping" />
          <span className="absolute inset-2 rounded-full bg-[#E60028]/30 animate-pulse" />
          <span className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#E60028] to-red-700 shadow-2xl shadow-[#E60028]/40">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">{t.successTitle}</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-2 leading-relaxed text-sm">
          {t.successDesc}
        </p>
      </div>
    );
  }

  const pct = ((step - 1) / 2) * 100;

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
            <div className="flex items-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-1 shadow-sm">
              <div className="flex items-center px-2 border-r border-slate-200 dark:border-white/10">
                <Globe className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                <select 
                  value={lang} 
                  onChange={(e) => setLang(e.target.value as Lang)}
                  className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer appearance-none pr-2"
                >
                  <option value="fr">FR</option>
                  <option value="en">EN</option>
                  <option value="ar">AR</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ml-1"
              >
                {currentTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

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
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E60028] via-red-400 to-[#E60028]">{t.title}</span>
              ) : (
                <>Dossier de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E60028] via-red-400 to-[#E60028]">Candidature</span></>
              )}
            </h1>
            <p className="text-slate-600 dark:text-slate-500 text-sm leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          {/* ── Step Indicator ── */}
          <div className="w-full max-w-2xl mb-8">
            <div className="relative flex items-start justify-between">
              <div className={cn("absolute top-5 h-[2px] bg-slate-200 dark:bg-white/8 rounded-full", isRTL ? "right-[calc(16.67%)] left-[calc(16.67%)]" : "left-[calc(16.67%)] right-[calc(16.67%)]")}>
                <div className={cn("h-full bg-gradient-to-r from-[#E60028] to-red-500 rounded-full transition-all duration-700 ease-out", isRTL ? "float-right" : "")} style={{ width: `${pct}%` }} />
              </div>

              {STEPS.map(({ id, label, sub, icon: Icon }) => {
                const done_  = step > id;
                const active = step === id;
                return (
                  <div key={id} className="flex flex-col items-center gap-2 w-1/3 z-10">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 text-sm font-bold',
                      done_  ? 'bg-[#E60028] border-[#E60028] text-white scale-110 shadow-lg shadow-[#E60028]/40'
                             : active ? 'bg-white dark:bg-[#030711] border-[#E60028] text-[#E60028] scale-110 shadow-lg shadow-[#E60028]/20'
                                      : 'bg-white dark:bg-[#030711] border-slate-200 dark:border-white/15 text-slate-400 dark:text-slate-600'
                    )}>
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
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-[#E60028]/10 dark:bg-[#E60028]/15 border border-[#E60028]/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-[#E60028]" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white">{t.step1}</h3>
                        <p className="text-xs text-slate-500">{t.step1Sub}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field icon={User}  label="Nom Complet" required type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Ahmed El Fassi" className="sm:col-span-2" />
                      
                      <Field icon={Hash}  label={t.cneLabel} required type="text" name="cne" value={formData.cne} onChange={handleChange} placeholder="N123456789" />
                      <Field icon={Hash}  label="CIN / Passeport" required type="text" name="cin" value={formData.cin} onChange={handleChange} placeholder="AB123456" />
                      
                      <Field icon={Phone} label="Téléphone" required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+212 6XX XXX XXX" />
                      <Field icon={Mail}  label="Email" required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="candidat@email.com" />
                      
                      <Field icon={Lock}  label="Mot de passe" required type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 8 caractères" />
                      <Field icon={Lock}  label="Confirmer" required type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} placeholder="Répéter le mot de passe" />
                    </div>

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
                  <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-[#E60028]/10 dark:bg-[#E60028]/15 border border-[#E60028]/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-[#E60028]" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white">{t.step2}</h3>
                        <p className="text-xs text-slate-500">{t.step2Sub}</p>
                      </div>
                    </div>

                    <SectionCard title="Informations de naissance" icon={Calendar}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={Calendar} label="Date de naissance" required type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} />
                        <Field icon={MapPin}   label="Lieu de naissance" required type="text" name="birth_city" value={formData.birth_city} onChange={handleChange} placeholder="Fès" />
                      </div>
                    </SectionCard>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SectionCard title="👨 Père" icon={User}>
                        <Field icon={User}        label="Nom & Prénom" type="text" name="father_name" value={formData.father_name} onChange={handleChange} placeholder="Nom complet" />
                        <Field icon={Hash}        label="CIN"          type="text" name="father_cin" value={formData.father_cin} onChange={handleChange} placeholder="AB000000" />
                        <Field icon={Building2}   label="Profession"   type="text" name="father_job" value={formData.father_job} onChange={handleChange} placeholder="Ingénieur..." />
                      </SectionCard>
                      <SectionCard title="👩 Mère" icon={User}>
                        <Field icon={User}        label="Nom & Prénom" type="text" name="mother_name" value={formData.mother_name} onChange={handleChange} placeholder="Nom complet" />
                        <Field icon={Hash}        label="CIN"          type="text" name="mother_cin" value={formData.mother_cin} onChange={handleChange} placeholder="AB000000" />
                        <Field icon={Building2}   label="Profession"   type="text" name="mother_job" value={formData.mother_job} onChange={handleChange} placeholder="Enseignante..." />
                      </SectionCard>
                    </div>
                  </div>
                )}

                {/* ═══════════ STEP 3 ═══════════ */}
                {step === 3 && (
                  <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-[#E60028]/10 dark:bg-[#E60028]/15 border border-[#E60028]/20 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-[#E60028]" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white">{t.step3}</h3>
                        <p className="text-xs text-slate-500">{t.step3Sub}</p>
                      </div>
                    </div>

                    <SectionCard title="Baccalauréat" icon={BookOpen}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={Building2} label="Type d'établissement" required as="select" name="bac_type" value={formData.bac_type} onChange={handleChange}>
                          <option value="">Sélectionner…</option>
                          <option value="public">Public</option>
                          <option value="prive">Privé</option>
                          <option value="etranger">Mission Étrangère</option>
                        </Field>
                        <Field icon={BookOpen} label="Série / Spécialité" required as="select" name="bac_series" value={formData.bac_series} onChange={handleChange}>
                          <option value="">Sélectionner…</option>
                          <option value="sm">Sciences Maths A/B</option>
                          <option value="pc">Physique-Chimie (PC)</option>
                          <option value="svt">Sciences de la Vie (SVT)</option>
                          <option value="eco">Sciences Économiques</option>
                          <option value="gestion">Techniques de Gestion</option>
                          <option value="autre">Autre</option>
                        </Field>
                        <Field icon={Star}     label="Moyenne Bac"  required type="number" step="0.01" min="0" max="20" name="bac_average" value={formData.bac_average} onChange={handleChange} placeholder="15.50" />
                        <Field icon={Calendar} label="Année"        required type="number" name="bac_year" value={formData.bac_year} onChange={handleChange} placeholder="2025" />
                        <Field icon={MapPin}   label="Ville lycée"  required type="text" name="high_school_city" value={formData.high_school_city} onChange={handleChange} placeholder="Fès" className="sm:col-span-2" />
                      </div>
                    </SectionCard>

                    {/* Filière picker */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#E60028] mb-3 flex items-center gap-2">
                        <GraduationCap className="w-3 h-3" /> Filière demandée à l'ENCG Fès <span className="text-[#E60028]">*</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {FILIERES.map(f => (
                          <label key={f}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.02] p-3.5
                              hover:border-[#E60028]/40 hover:bg-[#E60028]/5 cursor-pointer transition-all
                              has-[:checked]:border-[#E60028]/60 has-[:checked]:bg-[#E60028]/10"
                          >
                            <input type="radio" name="filiere" value={f} onChange={handleRadioChange} checked={formData.filiere === f} className="sr-only peer" />
                            <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 peer-checked:border-[#E60028] dark:peer-checked:border-[#E60028] peer-checked:bg-[#E60028] transition-all flex-shrink-0" />
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-snug">{f}</span>
                          </label>
                        ))}
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
                      'flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm border transition-all',
                      step === 1
                        ? 'opacity-0 pointer-events-none'
                        : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t.btnPrev}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {([1, 2, 3] as StepId[]).map(i => (
                      <span key={i} className={cn(
                        'rounded-full transition-all duration-300',
                        step === i ? 'w-6 h-1.5 bg-[#E60028]' : step > i ? 'w-1.5 h-1.5 bg-[#E60028]/40' : 'w-1.5 h-1.5 bg-slate-200 dark:bg-white/15'
                      )} />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 bg-[#E60028] hover:bg-red-600
                      text-white px-5 sm:px-7 py-2.5 rounded-xl font-bold text-sm tracking-wide
                      transition-all shadow-lg shadow-[#E60028]/30 hover:shadow-[#E60028]/50
                      hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        {t.btnSending}
                      </>
                    ) : step === 3 ? (
                      <><Rocket className="w-4 h-4" /> {t.btnSubmit}</>
                    ) : (
                      <>{t.btnNext} <ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} /></>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <p className="text-center text-xs text-slate-500 mt-6">
              © 2026 ENCG Fès — USMBA · Tous droits réservés ·{' '}
              <Link to="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Retour à l'accueil</Link>
            </p>
          </div>
        </main>
      </div>

      <CndpPrivacyModal isOpen={showCndpModal} onClose={() => setShowCndpModal(false)} lang={lang} />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-\\[fadeIn_0\\.3s_ease\\] { animation: fadeIn 0.3s ease both; }
      `}</style>
    </div>
  );
}
