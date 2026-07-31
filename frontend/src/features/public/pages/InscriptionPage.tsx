import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Users, GraduationCap, CheckCircle2, Lock, Mail,
  MapPin, Calendar, Hash, Star, Building2, BookOpen,
  ChevronLeft, ChevronRight, ArrowRight, Rocket, Phone, Shield, Sun, Moon, Globe, FileText, Search, ChevronDown, Check, Scissors, X, Keyboard, Delete
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
  { id: 1 as StepId, labelFr: 'Personnel & Identité', labelAr: 'الهوية والحساب', subFr: 'Infos personnelles & Résidence', subAr: 'المعلومات الشخصية وعنوان السكن', icon: User },
  { id: 2 as StepId, labelFr: 'Parents & Urgence', labelAr: 'الوالدين والاتصال', subFr: 'Tuteurs légaux & Urgence', subAr: 'معلومات الوالدين وهاتف الطوارئ', icon: Users },
  { id: 3 as StepId, labelFr: 'Parcours Académique', labelAr: 'المسار والتخصص', subFr: 'Baccalauréat & Filière ENCG', subAr: 'شهادة البكالوريا وشعبة ENCG', icon: GraduationCap },
  { id: 4 as StepId, labelFr: 'Documents & Photos', labelAr: 'الوثائق والصورة', subFr: 'Bac, CNIE & Photo 35x45mm', subAr: 'البكالوريا، البطاقة والصورة الشخصية', icon: FileText },
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
function CustomSelect({
  icon: Icon,
  value,
  onChange,
  options,
  isRtl,
  name,
}: {
  icon: React.ElementType;
  value: string;
  onChange: (e: { target: { name: string; value: string } }) => void;
  options: { value: string; label: React.ReactNode }[];
  isRtl: boolean;
  name?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value)) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-white/20 rounded-2xl py-3.5 text-base sm:text-lg font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-[#0f2863] dark:focus:border-blue-400 focus:ring-4 focus:ring-[#0f2863]/20 transition-all cursor-pointer shadow-sm text-left group hover:border-[#0f2863]/60 dark:hover:border-blue-400/60",
          isOpen && "border-[#0f2863] dark:border-blue-400 ring-4 ring-[#0f2863]/20 shadow-md",
          isRtl ? "pr-12 pl-4 text-right font-serif text-xl" : "pl-12 pr-4"
        )}
      >
        <span className={cn("pointer-events-none absolute inset-y-0 flex items-center text-slate-400 dark:text-slate-500 group-focus-within:text-[#0f2863] dark:group-focus-within:text-blue-400 transition-colors", isRtl ? "right-4" : "left-4")}>
          <Icon className="w-5 h-5" />
        </span>

        <span className={cn("truncate flex-1 font-extrabold text-slate-900 dark:text-white", isRtl && "font-serif font-bold text-xl")}>
          {selectedOption?.label || value}
        </span>

        <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ms-2", isOpen && "rotate-180 text-[#0f2863] dark:text-blue-400")} />
      </button>

      {/* Floating Options Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-1.5 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/50",
            isRtl && "text-right font-serif"
          )}
          dir={isRtl ? "rtl" : "ltr"}
        >
          {options.map((opt, idx) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange({ target: { name: name || '', value: String(opt.value) } });
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer text-slate-800 dark:text-slate-200 hover:bg-[#0f2863]/10 dark:hover:bg-blue-500/20 hover:text-[#0f2863] dark:hover:text-blue-300",
                  isSelected && "bg-[#0f2863]/15 dark:bg-blue-500/25 text-[#0f2863] dark:text-blue-300 font-black shadow-2xs"
                )}
              >
                <span className={cn("truncate", isRtl && "font-serif text-base font-bold")}>
                  {opt.label}
                </span>
                {isSelected && <Check className="w-4 h-4 text-[#0f2863] dark:text-blue-400 shrink-0 ms-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({
  icon: Icon, label, required, className = '', as: As = 'input', isRtl = false, children, ...props
}: {
  icon: React.ElementType;
  label: string;
  required?: boolean;
  className?: string;
  as?: 'input' | 'select';
  isRtl?: boolean;
  children?: React.ReactNode;
} & (React.InputHTMLAttributes<HTMLInputElement> | React.SelectHTMLAttributes<HTMLSelectElement>)) {
  const cleanLabel = label.replace(/\s*\*\s*$/, '').trim();

  if (As === 'select') {
    const options = React.Children.toArray(children).map((child) => {
      if (React.isValidElement(child) && child.type === 'option') {
        return {
          value: (child.props as any).value ?? '',
          label: (child.props as any).children ?? '',
        };
      }
      return null;
    }).filter(Boolean) as { value: string; label: React.ReactNode }[];

    const selectProps = props as React.SelectHTMLAttributes<HTMLSelectElement>;

    return (
      <div className={cn('flex flex-col gap-2.5', className)}>
        <label className={cn('text-sm sm:text-base font-black tracking-wide uppercase text-slate-800 dark:text-slate-200 flex items-center', isRtl && "justify-start font-serif text-lg font-black")}>
          <span>{cleanLabel}</span>
          {required && <span className="text-[#E60028] font-black ms-1">*</span>}
        </label>
        <CustomSelect
          icon={Icon}
          value={String(selectProps.value ?? '')}
          name={selectProps.name}
          onChange={(e) => {
            if (selectProps.onChange) {
              selectProps.onChange(e as any);
            }
          }}
          options={options}
          isRtl={isRtl}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <label className={cn('text-sm sm:text-base font-black tracking-wide uppercase text-slate-800 dark:text-slate-200 flex items-center', isRtl && "justify-start font-serif text-lg font-black")}>
        <span>{cleanLabel}</span>
        {required && <span className="text-[#E60028] font-black ms-1">*</span>}
      </label>
      <div className="relative group">
        <span className={cn("pointer-events-none absolute inset-y-0 flex items-center text-slate-400 dark:text-slate-500 group-focus-within:text-[#0f2863] dark:group-focus-within:text-blue-400 transition-colors", isRtl ? "right-4" : "left-4")}>
          <Icon className="w-5 h-5" />
        </span>
        <input
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          className={cn(
            "w-full bg-white dark:bg-slate-900/90 border-2 border-slate-300 dark:border-white/20 rounded-2xl py-4 text-base sm:text-lg font-extrabold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#0f2863] dark:focus:border-blue-400 focus:ring-4 focus:ring-[#0f2863]/20 transition-all shadow-sm",
            isRtl ? "pr-12 pl-4 text-right font-serif text-xl font-bold" : "pl-12 pr-4"
          )}
        />
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, isRtl = false }: { title: string; icon: React.ElementType; children: React.ReactNode; isRtl?: boolean }) {
  return (
    <div className="rounded-3xl border-2 border-slate-200 dark:border-white/15 bg-white/90 dark:bg-white/[0.04] p-6 sm:p-8 space-y-6 shadow-md">
      <p className={cn("text-sm sm:text-base font-black uppercase tracking-wider text-[#0f2863] dark:text-blue-400 flex items-center gap-3 border-b-2 border-slate-200 dark:border-white/15 pb-3.5", isRtl && "font-serif text-xl font-black")}>
        <Icon className="w-5 h-5 text-[#0f2863] dark:text-blue-400 shrink-0" />
        <span>{title}</span>
      </p>
      {children}
    </div>
  );
}

function VirtualArabicKeyboardModal({
  target,
  formData,
  setFormData,
  onClose,
  lang = 'fr',
}: {
  target: { fieldName: string; fieldLabel: string };
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
  lang?: Lang;
}) {
  const { fieldName, fieldLabel } = target;
  const currentValue = formData[fieldName] || '';
  const isAr = lang === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#0c1e4e] via-[#162e74] to-[#081436] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/20 shadow-md">
              <Keyboard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="font-black text-sm text-white">
                {isAr ? 'لوحة المفاتيح العربية' : 'Clavier Arabe Virtuel'}
              </h4>
              <p className="text-[11px] text-blue-200">
                {isAr ? 'الكتابة المباشرة في حقل:' : 'Saisie directe dans le champ :'} <span className="text-amber-300 font-bold">{fieldLabel}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Display Input */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              {isAr ? 'المعاينة المباشرة' : 'Aperçu en direct'}
            </label>
            <button
              type="button"
              onClick={() => setFormData((prev: any) => ({ ...prev, [fieldName]: '' }))}
              className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Delete className="w-3.5 h-3.5" /> <span>{isAr ? 'مسح النص' : 'Effacer'}</span>
            </button>
          </div>
          <input
            type="text"
            dir="rtl"
            value={currentValue}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, [fieldName]: e.target.value }))}
            placeholder={isAr ? "انقر على الحروف أدناه..." : "Cliquez sur les touches ci-dessous..."}
            className="w-full p-4 bg-white dark:bg-slate-900 border-2 border-indigo-500/40 rounded-2xl text-2xl font-bold font-serif text-slate-900 dark:text-white text-right outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-inner"
          />
        </div>

        {/* Tactile Keypad */}
        <div className="p-4 space-y-2.5 bg-slate-100 dark:bg-slate-900 select-none">
          {/* Row 0: Numbers */}
          <div className="grid grid-cols-11 gap-1.5" dir="rtl">
            {['ذ', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٠'].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, [fieldName]: (prev[fieldName] || '') + k }))}
                className="py-2.5 bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-900 dark:text-slate-100 font-serif font-bold text-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                {k}
              </button>
            ))}
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-12 gap-1.5" dir="rtl">
            {['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, [fieldName]: (prev[fieldName] || '') + k }))}
                className="py-2.5 bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-900 dark:text-slate-100 font-serif font-bold text-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                {k}
              </button>
            ))}
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-11 gap-1.5" dir="rtl">
            {['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, [fieldName]: (prev[fieldName] || '') + k }))}
                className="py-2.5 bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-900 dark:text-slate-100 font-serif font-bold text-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                {k}
              </button>
            ))}
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-10 gap-1.5" dir="rtl">
            {['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ'].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, [fieldName]: (prev[fieldName] || '') + k }))}
                className="py-2.5 bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-900 dark:text-slate-100 font-serif font-bold text-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                {k}
              </button>
            ))}
          </div>

          {/* Bottom Bar Controls */}
          <div className="flex items-center gap-2 pt-2" dir="rtl">
            <button
              type="button"
              onClick={() => setFormData((prev: any) => ({ ...prev, [fieldName]: (prev[fieldName] || '') + ' ' }))}
              className="flex-1 py-3 bg-white dark:bg-slate-800 hover:bg-slate-200 text-slate-900 dark:text-slate-100 font-bold text-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer active:scale-98 transition-all"
            >
              {isAr ? 'مسافة ␣' : 'Espace ␣'}
            </button>
            <button
              type="button"
              onClick={() => setFormData((prev: any) => ({ ...prev, [fieldName]: (prev[fieldName] || '').slice(0, -1) }))}
              className="px-5 py-3 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-300 font-bold text-sm rounded-xl border border-amber-200 dark:border-amber-800 cursor-pointer flex items-center gap-1.5 active:scale-98 transition-all"
            >
              <Delete className="w-4 h-4" /> ⌫ {isAr ? 'مسح' : 'Effacer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-sm rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-98 transition-all"
            >
              <Check className="w-4 h-4" /> {isAr ? 'تم' : 'Valider'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function InscriptionPage({ editMode = false }: { editMode?: boolean }) {
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
  const [arabicKbdTarget, setArabicKbdTarget] = useState<{ fieldName: string; fieldLabel: string } | null>(null);

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
    
    // Step 2: Parents & Urgence
    father_last_name_fr: '',
    father_first_name_fr: '',
    father_last_name_ar: '',
    father_first_name_ar: '',
    father_cin: '',
    father_phone: '',
    father_job: 'Militaires et forces de sécurité',
    mother_last_name_fr: '',
    mother_first_name_fr: '',
    mother_last_name_ar: '',
    mother_first_name_ar: '',
    mother_cin: '',
    mother_phone: '',
    mother_job: 'Sans emploi (Mère au foyer)',
    parent_phone: '',

    // Personne à joindre en cas d'urgence
    emergency_contact_name: '',
    emergency_contact_phone: '',

    // Fiche Médicale / Santé
    allergy_type: '',
    has_medical_followup: false as boolean,
    medication_used: '',
    treating_doctor_info: '',
    
    // Step 3: Académique
    bac_name: 'Bac Sciences Mathématiques B - Option Français',
    bac_mention: 'Très Bien',
    bac_average: '',
    bac_year: '2026',
    high_school: '',
    academy: 'ACADEMIE Fès-Meknès',
    delegation: 'FES',
    cycle: 'Cycle des deux années préparatoires',
    filiere: 'Deux années préparatoires',

    // Step 4: Documents
    bac_pdf_name: '',
    cnie_pdf_name: '',
    releve_notes_pdf_name: '',
    photo_url: '',
    photo_zoom: 100,
    photo_output_size: '413 x 531 px',

    // Step 1 extra: Handicap
    has_disability: false as boolean,
    disability_type: '' as string,
    disability_details: '' as string,
  });

  const { user } = useAuthStore();

  // In editMode: load existing data from DB and pre-fill form
  useEffect(() => {
    if (!editMode) return;
    const cne = (user as any)?.cne || '';
    const cin = (user as any)?.cin || '';
    if (!cne && !cin) return;
    api.get('/public/track-dossier', { params: { cne, cin } })
      .then(res => {
        const cand = res.data?.candidate;
        if (!cand) return;
        setFormData(prev => ({
          ...prev,
          cne: cand.cne || cne,
          cin: cand.cin || cin,
          email: cand.email || '',
          phone: cand.phone || '',
          last_name_fr: cand.last_name || '',
          first_name_fr: cand.first_name || '',
          last_name_ar: cand.last_name_ar || '',
          first_name_ar: cand.first_name_ar || '',
          birth_date: cand.birth_date || '',
          birth_city_fr: cand.birth_city || '',
          birth_city_ar: cand.birth_city_ar || '',
          gender: cand.gender || 'female',
          family_status: cand.family_status || 'Célibataire',
          nationality: cand.nationality || 'Marocain(e)',
          address_fr: cand.address || '',
          region: cand.region || 'Fès-Meknès',
          province: cand.city || 'Fès',
          father_last_name_fr: cand.father_name || '',
          father_cin: cand.father_cin || '',
          father_phone: cand.father_phone || '',
          father_job: cand.father_profession || '',
          mother_last_name_fr: cand.mother_name || '',
          mother_cin: cand.mother_cin || '',
          mother_phone: cand.mother_phone || '',
          parent_phone: cand.parent_phone || '',
          emergency_contact_name: cand.emergency_contact_name || '',
          emergency_contact_phone: cand.emergency_contact_phone || '',
          allergy_type: cand.allergy_type || '',
          medication_used: cand.medication_used || '',
          treating_doctor_info: cand.treating_doctor_info || '',
          has_medical_followup: cand.has_medical_followup || false,
          has_disability: cand.has_disability || false,
          disability_details: cand.disability_details || '',
          filiere: cand.filiere || 'Deux années préparatoires',
          bac_average: cand.bac_average ? String(cand.bac_average) : '',
          bac_name: cand.bac_type || 'Bac Sciences Mathématiques B - Option Français',
        }));
      })
      .catch(() => {});
  }, [editMode, user]);

  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const [cneCheckStatus, setCneCheckStatus] = useState<{ cneAvailable: boolean; cinAvailable: boolean; message: string | null }>({
    cneAvailable: true,
    cinAvailable: true,
    message: null,
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlCne = searchParams.get('cne');
    const urlCin = searchParams.get('cin');
    if (urlCne || urlCin) {
      setFormData(prev => ({
        ...prev,
        cne: urlCne || prev.cne,
        cin: urlCin || prev.cin,
      }));
    }
  }, []);

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
  const isRtl = isRTL;
  const currentTheme = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;

  const goNext = () => setStep(s => Math.min(s + 1, 3) as StepId);
  const goPrev = () => setStep(s => Math.max(s - 1, 1) as StepId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (step === 1 && !editMode) {
      if (!cndpConsent) {
        setErrorMsg(lang === 'ar' ? 'يجب عليك الموافقة على معالجة البيانات الشخصية (القانون 09-08).' : 'Vous devez accepter le traitement de vos données personnelles conformément à la loi 09-08 (CNDP).');
        return;
      }
    }

    if (step < 3) { goNext(); return; }
    
    if (!editMode && formData.password !== formData.password_confirmation) {
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
      first_name_ar: formData.first_name_ar,
      last_name_ar: formData.last_name_ar,
      birth_city: formData.birth_city_fr,
      birth_city_ar: formData.birth_city_ar,
      address: formData.address_fr,
      father_name: `${formData.father_last_name_fr} ${formData.father_first_name_fr}`.trim(),
      mother_name: `${formData.mother_last_name_fr} ${formData.mother_first_name_fr}`.trim(),
      father_profession: formData.father_job,
      mother_profession: formData.mother_job,
      full_name: `${first_name} ${last_name}`.trim(),
    };

    try {
      if (editMode) {
        // EDIT MODE: update existing dossier
        await api.post('/public/update-candidate-dossier', payload);
        setSubmitting(false);
        toast.success('✅ Votre dossier a été mis à jour avec succès dans PostgreSQL !');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        // NEW INSCRIPTION
        const res = await api.post('/v1/auth/register', payload);
        if (res.data.data?.token) {
          useAuthStore.setState({
            token: res.data.data.token,
            user: res.data.data.user ?? null,
            isAuthenticated: !!res.data.data.user,
          });
        }
        setSubmitting(false);
        setDone(true);
        setTimeout(() => navigate('/login?registered=true'), 3000);
      }
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

  const pct = ((step - 1) / 2) * 100;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className={cn("min-h-screen transition-colors duration-500 selection:bg-[#0f2863]/40 text-slate-900 dark:text-white bg-slate-50 dark:bg-[#030711]", t.font)}>

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#0f2863]/[0.08] dark:bg-[#0f2863]/[0.12] blur-[130px]" />
        <div className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full bg-amber-400/[0.05] dark:bg-amber-400/[0.07] blur-[120px]" />
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

            <Link to="/login" className="hidden sm:flex text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors items-center gap-1.5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 hover:border-slate-300 dark:hover:border-white/25 shadow-xs">
              {t.alreadyRegistered} <ArrowRight className={cn("w-3.5 h-3.5", isRTL && "rotate-180")} />
            </Link>
          </div>
        </nav>

        {/* ── Main ── */}
        <main className="flex-1 flex flex-col items-center py-10 px-4 sm:px-6">

          <div className="text-center mb-10 max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              {isRTL ? (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0f2863] via-blue-600 to-[#09193d] font-serif">تسجيل الطالب — ENCG Fès</span>
              ) : (
                <>Inscription <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0f2863] via-blue-600 to-[#09193d]">Étudiante</span></>
              )}
            </h1>
            <p className={cn("text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed font-medium", isRTL && "font-serif text-lg")}>
              {isRTL 
                ? 'أكمل الاستمارة في 3 خطوات بسيطة لتقديم ملفك الرسمي لمؤسسة ENCG فاس.' 
                : 'Complétez le formulaire en 3 étapes simples pour soumettre votre dossier officiel à l\'ENCG Fès.'}
            </p>
          </div>

          {/* ── Step Indicator ── */}
          <div className="w-full max-w-3xl mb-10">
            <div className="relative flex items-start justify-between">
              <div className={cn("absolute top-6 h-[3px] bg-slate-200 dark:bg-white/10 rounded-full", isRTL ? "right-[calc(16%)] left-[calc(16%)]" : "left-[calc(16%)] right-[calc(16%)]")}>
                <div className={cn("h-full bg-gradient-to-r from-[#0f2863] via-blue-600 to-[#162e74] rounded-full transition-all duration-700 ease-out shadow-xs", isRTL ? "float-right" : "")} style={{ width: `${pct}%` }} />
              </div>

              {STEPS.map(({ id, labelFr, labelAr, subFr, subAr, icon: Icon }) => {
                const done_  = step > id;
                const active = step === id;
                const stepLabel = isRTL ? labelAr : labelFr;
                const stepSub = isRTL ? subAr : subFr;
                return (
                  <div key={id} className="flex flex-col items-center gap-2.5 w-1/3 z-10">
                    <div className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 text-base font-black cursor-pointer shadow-sm',
                      done_  ? 'bg-gradient-to-r from-[#0f2863] to-[#162e74] border-[#0f2863] text-white scale-110 shadow-lg shadow-[#0f2863]/30'
                             : active ? 'bg-white dark:bg-slate-900 border-[#0f2863] dark:border-blue-400 text-[#0f2863] dark:text-blue-400 scale-110 shadow-xl ring-4 ring-[#0f2863]/15'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/15 text-slate-400 dark:text-slate-600'
                    )}
                    onClick={() => { if (id < step) setStep(id); }}
                    >
                      {done_ ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={cn('text-xs sm:text-sm font-black tracking-wide transition-colors text-center', isRTL && "font-serif text-base", active || done_ ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500')}>
                      {stepLabel}
                    </span>
                    <span className={cn("hidden sm:block text-xs text-slate-500 dark:text-slate-400 text-center leading-tight px-1 font-medium", isRTL && "font-serif")}>{stepSub}</span>
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
          <div className="w-full max-w-4xl xl:max-w-5xl">
            <div className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] backdrop-blur-md shadow-2xl overflow-hidden transition-colors">

              <div className="h-1 bg-gradient-to-r from-[#E60028]/0 via-[#E60028] to-[#E60028]/0" />

              <form onSubmit={onSubmit} className="p-6 sm:p-10">

                {/* ═══════════ STEP 1 ═══════════ */}
                {step === 1 && (
                  <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#0f2863]/10 dark:bg-blue-500/15 border border-[#0f2863]/20 dark:border-blue-400/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-[#0f2863] dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className={cn("font-black text-slate-900 dark:text-white text-lg sm:text-xl tracking-tight", isRTL && "font-serif text-xl sm:text-2xl")}>
                            {isRTL ? 'معلومات الهوية والبيانات الشخصية' : 'Informations Personnelles & Identité'}
                          </h3>
                          <p className={cn("text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400", isRTL && "font-serif text-base")}>
                            {isRTL ? 'يرجى ملء معلومات الهوية، مكان الازدياد وعنوان السكن الرئيسي' : "Remplissez les informations d'identité, de naissance et de résidence"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-[#0f2863] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-4 py-1.5 rounded-full border-2 border-blue-200 dark:border-blue-800 shadow-xs">
                        {isRTL ? 'الخطوة 1 من 3' : 'Étape 1 sur 3'}
                      </span>
                    </div>

                    {/* Section 1: Identifiants Principaux */}
                    <SectionCard title={isRTL ? '1. معرفات الترشيح والحساب الرسمية' : '1. Identifiants de Candidature & Compte (Anti-Fraude Check)'} icon={Hash} isRtl={isRTL}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={Hash} label={isRTL ? 'رمز مسار (CNE) *' : 'CNE (Code Massar) *'} required type="text" name="cne" value={formData.cne} onChange={handleChange} placeholder={isRTL ? "مثال: N123456789" : "Ex: N123456789"} isRtl={isRTL} />
                        <Field icon={Hash} label={isRTL ? 'بطاقة التعريف الوطنية (CNIE) *' : "CNIE (Carte d'Identité) *"} required type="text" name="cin" value={formData.cin} onChange={handleChange} placeholder={isRTL ? "مثال: CD123456" : "Ex: CD123456"} isRtl={isRTL} />
                        <Field icon={Mail} label={isRTL ? 'البريد الإلكتروني *' : 'Adresse E-mail *'} required type="email" name="email" value={formData.email} onChange={handleChange} placeholder={isRTL ? "مثال: etudiant@gmail.com" : "Ex: etudiant@gmail.com"} isRtl={isRTL} />
                        <Field icon={Phone} label={isRTL ? 'الهاتف المحمول *' : 'Téléphone Portable *'} required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder={isRTL ? "مثال: 0612345678" : "Ex: 0612345678"} isRtl={isRTL} />
                      </div>

                      {cneCheckStatus.message && (
                        <div className={cn(
                          "p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 mt-3 animate-in fade-in transition-all shadow-xs border",
                          cneCheckStatus.message.includes('🟢')
                            ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200"
                            : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                        )}>
                          <Shield className={cn("w-4 h-4 shrink-0", cneCheckStatus.message.includes('🟢') ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600")} />
                          <span>{cneCheckStatus.message}</span>
                        </div>
                      )}

                    </SectionCard>

                    {/* Section 2: Nom & Prénom en FR & AR */}
                    <SectionCard title={isRTL ? '2. الهوية بالفرنسية وبالعربية' : '2. Identité en Français & en Arabe'} icon={User} isRtl={isRTL}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={User} label={isRTL ? 'النسب بالفرنسية *' : 'Nom (FR) *'} required type="text" name="last_name_fr" value={formData.last_name_fr} onChange={handleChange} placeholder={isRTL ? "مثال: BENNANI" : "Ex: BENNANI"} isRtl={isRTL} />
                        <Field icon={User} label={isRTL ? 'الاسم الشخصي بالفرنسية *' : 'Prénom (FR) *'} required type="text" name="first_name_fr" value={formData.first_name_fr} onChange={handleChange} placeholder={isRTL ? "مثال: Youssef" : "Ex: Youssef"} isRtl={isRTL} />
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className={cn("text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-700 dark:text-slate-300", isRTL && "font-serif text-base")}>
                              {isRTL ? 'النسب بالعربية *' : 'Nom en Arabe *'}
                            </label>
                            <button
                              type="button"
                              onClick={() => setArabicKbdTarget({ fieldName: 'last_name_ar', fieldLabel: isRTL ? 'النسب بالعربية' : 'Nom en Arabe' })}
                              className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs hover:scale-105"
                              title={isRTL ? "فتح لوحة المفاتيح العربية" : "Ouvrir le Clavier Arabe Virtuel"}
                            >
                              <Keyboard className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{isRTL ? 'لوحة المفاتيح ⌨️' : 'Clavier Arabe ⌨️'}</span>
                            </button>
                          </div>
                          <div className="relative">
                            <input type="text" dir="rtl" name="last_name_ar" value={formData.last_name_ar} onChange={handleChange} placeholder={isRTL ? "مثال: بناني" : "بناني"} className="w-full bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className={cn("text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-700 dark:text-slate-300", isRTL && "font-serif text-base")}>
                              {isRTL ? 'الاسم الشخصي بالعربية *' : 'Prénom en Arabe *'}
                            </label>
                            <button
                              type="button"
                              onClick={() => setArabicKbdTarget({ fieldName: 'first_name_ar', fieldLabel: isRTL ? 'الاسم الشخصي بالعربية' : 'Prénom en Arabe' })}
                              className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs hover:scale-105"
                              title={isRTL ? "فتح لوحة المفاتيح العربية" : "Ouvrir le Clavier Arabe Virtuel"}
                            >
                              <Keyboard className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{isRTL ? 'لوحة المفاتيح ⌨️' : 'Clavier Arabe ⌨️'}</span>
                            </button>
                          </div>
                          <div className="relative">
                            <input type="text" dir="rtl" name="first_name_ar" value={formData.first_name_ar} onChange={handleChange} placeholder={isRTL ? "مثال: يوسف" : "يوسف"} className="w-full bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs" />
                          </div>
                        </div>
                      </div>
                    </SectionCard>

                    {/* Section 3: Naissance & État Civil */}
                    <SectionCard title={isRTL ? '3. الولادة والحالة المدنية' : '3. Naissance & État Civil'} icon={Calendar} isRtl={isRTL}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={Calendar} label={isRTL ? 'تاريخ الازدياد *' : 'Date de naissance *'} required type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} isRtl={isRTL} />
                        
                        <Field icon={User} label={isRTL ? 'الجنس *' : 'Sexe *'} required as="select" name="gender" value={formData.gender} onChange={handleChange} isRtl={isRTL}>
                          <option value="female">{isRTL ? 'أنثى' : 'Féminin'}</option>
                          <option value="male">{isRTL ? 'ذكر' : 'Masculin'}</option>
                        </Field>

                        <Field icon={MapPin} label={isRTL ? 'مكان الازدياد بالفرنسية *' : 'Lieu de naissance (FR) *'} required type="text" name="birth_city_fr" value={formData.birth_city_fr} onChange={handleChange} placeholder="FES" isRtl={isRTL} />
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className={cn("text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-700 dark:text-slate-300", isRTL && "font-serif text-base")}>
                              {isRTL ? 'مكان الازدياد بالعربية *' : 'Lieu de naissance en Arabe *'}
                            </label>
                            <button
                              type="button"
                              onClick={() => setArabicKbdTarget({ fieldName: 'birth_city_ar', fieldLabel: isRTL ? 'مكان الازدياد بالعربية' : 'Lieu de naissance en Arabe' })}
                              className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs hover:scale-105"
                              title={isRTL ? "فتح لوحة المفاتيح العربية" : "Ouvrir le Clavier Arabe Virtuel"}
                            >
                              <Keyboard className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{isRTL ? 'لوحة المفاتيح ⌨️' : 'Clavier Arabe ⌨️'}</span>
                            </button>
                          </div>
                          <input type="text" dir="rtl" name="birth_city_ar" value={formData.birth_city_ar} onChange={handleChange} placeholder="فاس" className="w-full bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs" />
                        </div>

                        <Field icon={User} label={isRTL ? 'الحالة العائلية *' : 'Situation Familiale *'} required as="select" name="family_status" value={formData.family_status} onChange={handleChange} isRtl={isRTL}>
                          <option value="Célibataire">{isRTL ? 'عازب/ة' : 'Célibataire'}</option>
                          <option value="Marié(e)">{isRTL ? 'متزوج/ة' : 'Marié(e)'}</option>
                        </Field>

                        <Field icon={Globe} label={isRTL ? 'الجنسية *' : 'Nationalité *'} required as="select" name="nationality" value={formData.nationality} onChange={handleChange} isRtl={isRTL}>
                          <option value="Marocain(e)">{isRTL ? 'مغربية' : 'Marocaine'}</option>
                          <option value="Étranger">{isRTL ? 'أجنبي/ة' : 'Étranger'}</option>
                        </Field>
                      </div>
                    </SectionCard>

                    {/* Section 4: Localisation & Adresse de Résidence */}
                    <SectionCard title={isRTL ? '4. السكن والعنوان الرئيسي' : '4. Localisation & Domicile'} icon={MapPin} isRtl={isRTL}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={Globe} label={isRTL ? 'البلد *' : 'Pays *'} required as="select" name="country" value={formData.country} onChange={handleChange} isRtl={isRTL}>
                          <option value="Maroc">{isRTL ? 'المغرب' : 'Maroc'}</option>
                          <option value="Autre">{isRTL ? 'بلد آخر' : 'Autre pays'}</option>
                        </Field>

                        <Field icon={MapPin} label={isRTL ? 'الجهة *' : 'Région *'} required as="select" name="region" value={formData.region} onChange={handleChange} isRtl={isRTL}>
                          <option value="Fès-Meknès">{isRTL ? 'فاس - مكناس' : 'Fès-Meknès'}</option>
                          <option value="Rabat-Salé-Kénitra">{isRTL ? 'الرباط - سلا - القنيطرة' : 'Rabat-Salé-Kénitra'}</option>
                          <option value="Casablanca-Settat">{isRTL ? 'الدار البيضاء - سطات' : 'Casablanca-Settat'}</option>
                          <option value="Tangier-Tetouan-Al Hoceima">{isRTL ? 'طنجة - تطوان - الحسيمة' : 'Tanger-Tétouan-Al Hoceïma'}</option>
                          <option value="Oriental">{isRTL ? 'الشرق' : 'L\'Oriental'}</option>
                          <option value="Marrakesh-Safi">{isRTL ? 'مراكش - آسفي' : 'Marrakech-Safi'}</option>
                          <option value="Souss-Massa">{isRTL ? 'سوس - ماسة' : 'Souss-Massa'}</option>
                        </Field>

                        <Field icon={MapPin} label={isRTL ? 'العمالة / الإقليم *' : 'Province / Préfecture *'} required as="select" name="province" value={formData.province} onChange={handleChange} isRtl={isRTL}>
                          <option value="Fès">{isRTL ? 'فاس' : 'Fès'}</option>
                          <option value="Meknès">{isRTL ? 'مكناس' : 'Meknès'}</option>
                          <option value="Sefrou">{isRTL ? 'صفرو' : 'Sefrou'}</option>
                          <option value="Taza">{isRTL ? 'تازة' : 'Taza'}</option>
                          <option value="Autre">{isRTL ? 'إقليم آخر' : 'Autre province'}</option>
                        </Field>

                        <div className="sm:col-span-2 space-y-2">
                          <label className={cn("text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-700 dark:text-slate-300", isRTL && "font-serif text-base")}>
                            {isRTL ? 'عنوان السكن بالفرنسية *' : 'Adresse de Résidence (FR) *'}
                          </label>
                          <input type="text" name="address_fr" value={formData.address_fr} onChange={handleChange} placeholder={isRTL ? "22AV MLY RACHID RCE JAWHARA APPT8 BOURAMANA VN FES" : "Ex: 22 Av. Moulay Rachid, Res. Jawhara, Appt 8, Fès"} className="w-full bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 rounded-2xl px-4 py-3.5 text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs" />
                        </div>

                        <div className="sm:col-span-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className={cn("text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-700 dark:text-slate-300", isRTL && "font-serif text-base")}>
                              {isRTL ? 'عنوان السكن بالعربية *' : 'Adresse de Résidence en Arabe *'}
                            </label>
                            <button
                              type="button"
                              onClick={() => setArabicKbdTarget({ fieldName: 'address_ar', fieldLabel: isRTL ? 'عنوان السكن بالعربية' : 'Adresse en Arabe' })}
                              className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs hover:scale-105"
                              title={isRTL ? "فتح لوحة المفاتيح العربية" : "Ouvrir le Clavier Arabe Virtuel"}
                            >
                              <Keyboard className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{isRTL ? 'لوحة المفاتيح ⌨️' : 'Clavier Arabe ⌨️'}</span>
                            </button>
                          </div>
                          <input type="text" dir="rtl" name="address_ar" value={formData.address_ar} onChange={handleChange} placeholder="22 شارع مولاي رشيد إقامة جوهرة شقة 8 بورمانة فاس" className="w-full bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs" />
                        </div>

                        <Field icon={Lock} label={isRTL ? 'كلمة المرور *' : 'Mot de passe *'} required type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isRTL ? "8 أحرف على الأقل" : "Min. 8 caractères"} isRtl={isRTL} />
                        <Field icon={Lock} label={isRTL ? 'تأكيد كلمة المرور *' : 'Confirmer le mot de passe *'} required type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} placeholder={isRTL ? "أعد كتابة كلمة المرور" : "Répéter le mot de passe"} isRtl={isRTL} />
                      </div>
                    </SectionCard>

                    {/* Section 5: Situation en matière de Handicap */}
                    <SectionCard title={isRTL ? '5. وضعية الإعاقة (اختياري)' : '5. Situation de Handicap (Optionnel)'} icon={Shield} isRtl={isRTL}>
                      <div className="space-y-4">
                        {/* Toggle Has Disability */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                          <div>
                            <p className={cn("text-xs font-black text-blue-900 dark:text-blue-200", isRTL && "font-serif")}>
                              {isRTL ? '♿ هل لديك وضعية إعاقة؟' : '♿ Avez-vous une situation de handicap ?'}
                            </p>
                            <p className={cn("text-[10px] text-blue-700 dark:text-blue-400 font-medium", isRTL && "font-serif")}>
                              {isRTL ? 'تمكن هذه المعطيات المؤسسة من تقديم مواكبة وتسهيلات مخصصة (RAMED / MESRSFC).' : "Ces informations permettent à l'ENCG de vous offrir un accompagnement adapté (RAMED / MESRSFC)."}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={formData.has_disability}
                              onChange={(e) => setFormData({ ...formData, has_disability: e.target.checked, disability_type: '', disability_details: '' })}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {/* Conditional fields if has_disability === true */}
                        {formData.has_disability && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Field
                              icon={User}
                              label={isRTL ? 'نوع الإعاقة' : 'Type de handicap'}
                              as="select"
                              name="disability_type"
                              value={formData.disability_type}
                              onChange={handleChange}
                              isRtl={isRTL}
                            >
                              <option value="">-- {isRTL ? 'اختر النوع' : 'Sélectionner le type'} --</option>
                              <option value="moteur">{isRTL ? '♿ إعاقة حركية' : '♿ Handicap Moteur / Physique'}</option>
                              <option value="visuel">{isRTL ? '👁️ إعاقة بصرية' : '👁️ Handicap Visuel'}</option>
                              <option value="auditif">{isRTL ? '🦻 إعاقة سمعية' : '🦻 Handicap Auditif'}</option>
                              <option value="mental">{isRTL ? '🧠 إعاقة ذهنية' : '🧠 Handicap Mental'}</option>
                              <option value="psychique">{isRTL ? '💬 إعاقة نفسية' : '💬 Handicap Psychique'}</option>
                              <option value="chronique">{isRTL ? '🏥 مرض مزمن' : '🏥 Maladie Chronique'}</option>
                              <option value="autre">{isRTL ? 'أخرى' : 'Autre'}</option>
                            </Field>

                            <div className="space-y-1 sm:col-span-1">
                              <label className={cn("text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400", isRTL && "font-serif")}>
                                {isRTL ? 'تفاصيل وحاجيات خاصة' : 'Précisions / Besoins spécifiques'}
                              </label>
                              <textarea
                                name="disability_details"
                                value={formData.disability_details}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, disability_details: e.target.value })}
                                placeholder={isRTL ? "مثال: استخدام كرسي متحرك، الحاجة لقاعة في الطابق الأرضي..." : "Ex: Utilise un fauteuil roulant, besoin d'une salle accessible en rez-de-chaussée..."}
                                rows={3}
                                className={cn("w-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 resize-none", isRTL && "text-right font-serif")}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </SectionCard>

                    {/* Section 6: Santé & Fiche Médicale */}
                    <SectionCard title={isRTL ? '6. البيانات الطبية والصحية' : '6. Renseignements Médicaux & Santé'} icon={Shield} isRtl={isRTL}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                          icon={User}
                          label={isRTL ? 'نوع الحساسية' : "Type d'allergie"}
                          type="text"
                          name="allergy_type"
                          value={formData.allergy_type}
                          onChange={handleChange}
                          placeholder={isRTL ? "مثال: البينيسيلين، الربو، لا يوجد..." : "Ex: Pénicilline, Asthme, Aucune..."}
                          isRtl={isRTL}
                        />

                        <Field
                          icon={User}
                          label={isRTL ? 'حالة تتطلب تتبعاً طبياً مستمراً' : 'Cas nécessitant un suivi médical'}
                          as="select"
                          name="has_medical_followup"
                          value={formData.has_medical_followup ? 'oui' : 'non'}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, has_medical_followup: e.target.value === 'oui' })}
                          isRtl={isRTL}
                        >
                          <option value="non">{isRTL ? 'لا' : 'Non'}</option>
                          <option value="oui">{isRTL ? 'نعم' : 'Oui'}</option>
                        </Field>

                        <Field
                          icon={User}
                          label={isRTL ? 'دواء منتظم / علاج دائم' : 'Médicament régulier / Traitement'}
                          type="text"
                          name="medication_used"
                          value={formData.medication_used}
                          onChange={handleChange}
                          placeholder={isRTL ? "مثال: أنسولين، بخاخ ربو، لا يوجد..." : "Ex: Ventoline, Insuline, Aucun..."}
                          isRtl={isRTL}
                        />

                        <Field
                          icon={User}
                          label={isRTL ? 'الطبيب المعالج (الاسم والهاتف)' : 'Médecin traitant (Nom & Téléphone)'}
                          type="text"
                          name="treating_doctor_info"
                          value={formData.treating_doctor_info}
                          onChange={handleChange}
                          placeholder={isRTL ? "مثال: د. بناني - 0535600000" : "Ex: Dr. Bennani - 0535600000"}
                          isRtl={isRTL}
                        />
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
                        <div className="w-10 h-10 rounded-2xl bg-[#0f2863]/10 dark:bg-blue-500/15 border border-[#0f2863]/20 dark:border-blue-400/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-[#0f2863] dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className={cn("font-black text-slate-900 dark:text-white text-lg sm:text-xl tracking-tight", isRTL && "font-serif text-xl sm:text-2xl")}>
                            {isRTL ? 'معلومات الوالدين والأولياء الشرعيين' : 'Informations des Parents & Tuteurs Légaux'}
                          </h3>
                          <p className={cn("text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400", isRTL && "font-serif text-base")}>
                            {isRTL ? 'أدخل معلومات الحالة المدنية، وثائق الهوية والمهن الخاصة بالأب والأم' : "Renseignez l'état civil, les pièces d'identité et professions du père et de la mère"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-[#0f2863] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-4 py-1.5 rounded-full border-2 border-blue-200 dark:border-blue-800 shadow-xs">
                        {isRTL ? 'الخطوة 2 من 3' : 'Étape 2 sur 3'}
                      </span>
                    </div>

                    {/* Section Père */}
                    <SectionCard title={isRTL ? 'معلومات الأب' : 'Informations du Père'} icon={User} isRtl={isRTL}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={User} label={isRTL ? 'نسب الأب بالفرنسية *' : 'Nom du père (FR) *'} required type="text" name="father_last_name_fr" value={formData.father_last_name_fr} onChange={handleChange} placeholder={isRTL ? "مثال: BENNANI" : "Ex: BENNANI"} isRtl={isRTL} />
                        <Field icon={User} label={isRTL ? 'الاسم الشخصي للأب بالفرنسية *' : 'Prénom du père (FR) *'} required type="text" name="father_first_name_fr" value={formData.father_first_name_fr} onChange={handleChange} placeholder={isRTL ? "مثال: Mohammed" : "Ex: Mohammed"} isRtl={isRTL} />

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className={cn("text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-700 dark:text-slate-300", isRTL && "font-serif text-base")}>
                              {isRTL ? 'نسب الأب بالعربية *' : 'Nom du père en Arabe *'}
                            </label>
                            <button
                              type="button"
                              onClick={() => setArabicKbdTarget({ fieldName: 'father_last_name_ar', fieldLabel: isRTL ? 'نسب الأب بالعربية' : 'Nom du père en Arabe' })}
                              className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs hover:scale-105"
                              title={isRTL ? "فتح لوحة المفاتيح العربية" : "Ouvrir le Clavier Arabe Virtuel"}
                            >
                              <Keyboard className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{isRTL ? 'لوحة المفاتيح ⌨️' : 'Clavier Arabe ⌨️'}</span>
                            </button>
                          </div>
                          <input type="text" dir="rtl" name="father_last_name_ar" value={formData.father_last_name_ar} onChange={handleChange} placeholder={isRTL ? "مثال: بناني" : "بناني"} className="w-full bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className={cn("text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-700 dark:text-slate-300", isRTL && "font-serif text-base")}>
                              {isRTL ? 'الاسم الشخصي للأب بالعربية *' : 'Prénom du père en Arabe *'}
                            </label>
                            <button
                              type="button"
                              onClick={() => setArabicKbdTarget({ fieldName: 'father_first_name_ar', fieldLabel: isRTL ? 'الاسم الشخصي للأب بالعربية' : 'Prénom du père en Arabe' })}
                              className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs hover:scale-105"
                              title={isRTL ? "فتح لوحة المفاتيح العربية" : "Ouvrir le Clavier Arabe Virtuel"}
                            >
                              <Keyboard className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{isRTL ? 'لوحة المفاتيح ⌨️' : 'Clavier Arabe ⌨️'}</span>
                            </button>
                          </div>
                          <input type="text" dir="rtl" name="father_first_name_ar" value={formData.father_first_name_ar} onChange={handleChange} placeholder={isRTL ? "مثال: محمد" : "محمد"} className="w-full bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs" />
                        </div>

                        <Field icon={Hash} label={isRTL ? 'البطاقة الوطنية للأب (CNIE) *' : 'CNIE du père *'} required type="text" name="father_cin" value={formData.father_cin} onChange={handleChange} placeholder={isRTL ? "مثال: E123456" : "Ex: E123456"} isRtl={isRTL} />
                        <Field icon={Phone} label={isRTL ? 'هاتف الأب *' : 'Téléphone du père *'} required type="tel" name="father_phone" value={formData.father_phone} onChange={handleChange} placeholder={isRTL ? "مثال: 0661234567" : "Ex: 0661234567"} isRtl={isRTL} />

                        <Field icon={Building2} label={isRTL ? 'مهنة الأب *' : 'Profession du père *'} required as="select" name="father_job" value={formData.father_job} onChange={handleChange} isRtl={isRTL}>
                          <option value="Militaires et forces de sécurité">{isRTL ? 'القوات المسلحة والأمن' : 'Militaires et forces de sécurité'}</option>
                          <option value="Cadres supérieurs / Professions intellectuelles">{isRTL ? 'أطر عليا / مهن حرة' : 'Cadres supérieurs / Professions intellectuelles'}</option>
                          <option value="Fonctionnaires et enseignants">{isRTL ? 'موظفون ومدرسون' : 'Fonctionnaires et enseignants'}</option>
                          <option value="Artisans et ouvriers qualifiés">{isRTL ? 'حرفيون وعمال مؤهلون' : 'Artisans et ouvriers qualifiés'}</option>
                          <option value="Commerçants et indépendants">{isRTL ? 'تجار ومستقلون' : 'Commerçants et indépendants'}</option>
                          <option value="Employés du secteur privé">{isRTL ? 'مستخدمون بالقطاع الخاص' : 'Employés du secteur privé'}</option>
                          <option value="Retraité">{isRTL ? 'متقاعد' : 'Retraité'}</option>
                          <option value="Sans emploi">{isRTL ? 'بدون عمل' : 'Sans emploi'}</option>
                        </Field>
                      </div>
                    </SectionCard>

                    {/* Section Mère */}
                    <SectionCard title={isRTL ? 'معلومات الأم' : 'Informations de la Mère'} icon={User} isRtl={isRTL}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={User} label={isRTL ? 'نسب الأم بالفرنسية *' : 'Nom de la mère (FR) *'} required type="text" name="mother_last_name_fr" value={formData.mother_last_name_fr} onChange={handleChange} placeholder={isRTL ? "مثال: SATOURI" : "Ex: SATOURI"} isRtl={isRTL} />
                        <Field icon={User} label={isRTL ? 'الاسم الشخصي للأم بالفرنسية *' : 'Prénom de la mère (FR) *'} required type="text" name="mother_first_name_fr" value={formData.mother_first_name_fr} onChange={handleChange} placeholder={isRTL ? "مثال: Boutaina" : "Ex: Boutaina"} isRtl={isRTL} />

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className={cn("text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-700 dark:text-slate-300", isRTL && "font-serif text-base")}>
                              {isRTL ? 'نسب الأم بالعربية *' : 'Nom de la mère en Arabe *'}
                            </label>
                            <button
                              type="button"
                              onClick={() => setArabicKbdTarget({ fieldName: 'mother_last_name_ar', fieldLabel: isRTL ? 'نسب الأم بالعربية' : 'Nom de la mère en Arabe' })}
                              className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs hover:scale-105"
                              title={isRTL ? "فتح لوحة المفاتيح العربية" : "Ouvrir le Clavier Arabe Virtuel"}
                            >
                              <Keyboard className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{isRTL ? 'لوحة المفاتيح ⌨️' : 'Clavier Arabe ⌨️'}</span>
                            </button>
                          </div>
                          <input type="text" dir="rtl" name="mother_last_name_ar" value={formData.mother_last_name_ar} onChange={handleChange} placeholder={isRTL ? "مثال: الساطوري" : "الساطوري"} className="w-full bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className={cn("text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-700 dark:text-slate-300", isRTL && "font-serif text-base")}>
                              {isRTL ? 'الاسم الشخصي للأم بالعربية *' : 'Prénom de la mère en Arabe *'}
                            </label>
                            <button
                              type="button"
                              onClick={() => setArabicKbdTarget({ fieldName: 'mother_first_name_ar', fieldLabel: isRTL ? 'الاسم الشخصي للأم بالعربية' : 'Prénom de la mère en Arabe' })}
                              className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs hover:scale-105"
                              title={isRTL ? "فتح لوحة المفاتيح العربية" : "Ouvrir le Clavier Arabe Virtuel"}
                            >
                              <Keyboard className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{isRTL ? 'لوحة المفاتيح ⌨️' : 'Clavier Arabe ⌨️'}</span>
                            </button>
                          </div>
                          <input type="text" dir="rtl" name="mother_first_name_ar" value={formData.mother_first_name_ar} onChange={handleChange} placeholder={isRTL ? "مثال: بثينة" : "بثينة"} className="w-full bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs" />
                        </div>

                        <Field icon={Hash} label={isRTL ? 'البطاقة الوطنية للأم (CNIE) *' : 'CNIE de la mère *'} required type="text" name="mother_cin" value={formData.mother_cin} onChange={handleChange} placeholder={isRTL ? "C567108" : "Ex: C567108"} isRtl={isRTL} />
                        <Field icon={Phone} label={isRTL ? 'هاتف الأم' : 'Téléphone de la mère'} type="tel" name="mother_phone" value={formData.mother_phone} onChange={handleChange} placeholder={isRTL ? "0667890123" : "Ex: 0667890123"} isRtl={isRTL} />

                        <Field icon={Building2} label={isRTL ? 'مهنة الأم *' : 'Profession de la mère *'} required as="select" name="mother_job" value={formData.mother_job} onChange={handleChange} isRtl={isRTL}>
                          <option value="Sans emploi (Mère au foyer)">{isRTL ? 'ربة بيت / بدون عمل' : 'Mère au foyer / Sans emploi'}</option>
                          <option value="Cadres supérieurs / Professions intellectuelles">{isRTL ? 'أطر عليا / مهن حرة' : 'Cadres supérieurs / Professions intellectuelles'}</option>
                          <option value="Fonctionnaires et enseignants">{isRTL ? 'موظفات ومدرسات' : 'Fonctionnaires et enseignantes'}</option>
                          <option value="Commerçantes et indépendantes">{isRTL ? 'تجار ومستقلات' : 'Commerçantes et indépendantes'}</option>
                          <option value="Employées du secteur privé">{isRTL ? 'مستخدمات بالقطاع الخاص' : 'Employées du secteur privé'}</option>
                          <option value="Retraitée">{isRTL ? 'متقاعدة' : 'Retraitée'}</option>
                        </Field>
                      </div>
                    </SectionCard>

                    {/* Section Tuteur & Contact Urgence */}
                    <SectionCard title={isRTL ? 'جهة الاتصال عند الطوارئ والولي' : 'Contact d\'Urgence & Tuteur'} icon={Phone} isRtl={isRTL}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={Phone} label={isRTL ? 'الهاتف الرئيسي لأولياء الأمور *' : 'Téléphone principal des parents *'} required type="tel" name="parent_phone" value={formData.parent_phone} onChange={handleChange} placeholder={isRTL ? "0657310300" : "Ex: 0657310300"} isRtl={isRTL} />
                        <Field icon={User} label={isRTL ? 'الاسم الكامل لشخص الاتصال للطوارئ' : 'Personne d\'urgence (Nom & Prénom)'} type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} placeholder={isRTL ? "العطاري إسماعيل (عم / ولي)" : "Ex: El Attahri Ismaïl (Oncle / Tuteur)"} isRtl={isRTL} />
                        <Field icon={Phone} label={isRTL ? 'هاتف شخص الاتصال للطوارئ' : 'Téléphone personne d\'urgence'} type="tel" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} placeholder={isRTL ? "0657310300" : "Ex: 0657310300"} isRtl={isRTL} />
                      </div>
                    </SectionCard>
                  </div>
                )}

                {/* ═══════════ STEP 3 ═══════════ */}
                {step === 3 && (
                  <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#0f2863]/10 dark:bg-blue-500/15 border border-[#0f2863]/20 dark:border-blue-400/20 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-[#0f2863] dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className={cn("font-black text-slate-900 dark:text-white text-lg sm:text-xl tracking-tight", isRTL && "font-serif text-xl sm:text-2xl")}>
                            {isRTL ? 'المعلومات الأكاديمية والتوجيه' : 'Informations Académiques & Orientations'}
                          </h3>
                          <p className={cn("text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400", isRTL && "font-serif text-base")}>
                            {isRTL ? 'مسلك البكالوريا، المعدل العام، الثانوية والمسلك المطلوب للمؤسسة' : 'Cursus du baccalauréat, moyenne, lycée et filière demandée'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-[#0f2863] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-4 py-1.5 rounded-full border-2 border-blue-200 dark:border-blue-800 shadow-xs">
                        {isRTL ? 'الخطوة 3 من 3' : 'Étape 3 sur 3'}
                      </span>
                    </div>

                    <SectionCard title={isRTL ? 'معلومات شهادة البكالوريا والمؤسسة' : 'Informations du Baccalauréat & Établissement'} icon={BookOpen} isRtl={isRTL}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={BookOpen} label={isRTL ? 'شعبة البكالوريا *' : 'Série du Baccalauréat *'} required as="select" name="bac_name" value={formData.bac_name} onChange={handleChange} isRtl={isRTL}>
                          <option value="Bac Sciences Mathématiques B - Option Français">{isRTL ? 'علوم رياضية "ب" - خيار فرنسية' : 'Bac Sciences Mathématiques B - Option Français'}</option>
                          <option value="Bac Sciences Mathématiques A - Option Français">{isRTL ? 'علوم رياضية "أ" - خيار فرنسية' : 'Bac Sciences Mathématiques A - Option Français'}</option>
                          <option value="Bac Physique-Chimie (PC)">{isRTL ? 'علوم فيزيائية' : 'Bac Physique-Chimie (PC)'}</option>
                          <option value="Bac Sciences de la Vie et de la Terre (SVT)">{isRTL ? 'علوم الحياة والأرض' : 'Bac Sciences de la Vie et de la Terre (SVT)'}</option>
                          <option value="Bac Sciences Économiques">{isRTL ? 'علوم اقتصادية' : 'Bac Sciences Économiques'}</option>
                          <option value="Bac Techniques de Gestion et Comptabilité (TGC)">{isRTL ? 'علوم التدبير المحاسباتي' : 'Bac Techniques de Gestion et Comptabilité (TGC)'}</option>
                        </Field>

                        <Field icon={Star} label={isRTL ? 'الميزة في البكالوريا *' : 'Mention au Bac *'} required as="select" name="bac_mention" value={formData.bac_mention} onChange={handleChange} isRtl={isRTL}>
                          <option value="Très Bien">{isRTL ? 'حسن جداً (≥ 16.00)' : 'Très Bien (≥ 16.00)'}</option>
                          <option value="Bien">{isRTL ? 'حسن (14.00 - 15.99)' : 'Bien (14.00 - 15.99)'}</option>
                          <option value="Assez Bien">{isRTL ? 'مستحسن (12.00 - 13.99)' : 'Assez Bien (12.00 - 13.99)'}</option>
                          <option value="Passable">{isRTL ? 'مقبول (10.00 - 11.99)' : 'Passable (10.00 - 11.99)'}</option>
                        </Field>

                        <Field icon={Star} label={isRTL ? 'المعدل العام للبكالوريا *' : 'Moyenne générale du Bac *'} required type="number" step="0.01" name="bac_average" value={formData.bac_average} onChange={handleChange} placeholder={isRTL ? "مثال: 16.00" : "Ex: 16.00"} isRtl={isRTL} />

                        <Field icon={Calendar} label={isRTL ? 'سنة الحصول على البكالوريا *' : "Année d'obtention du Bac *"} required as="select" name="bac_year" value={formData.bac_year} onChange={handleChange} isRtl={isRTL}>
                          <option value="2026">2026</option>
                          <option value="2025">2025</option>
                          <option value="2024">2024</option>
                        </Field>

                        <Field icon={Building2} label={isRTL ? 'اسم الثانوية / المؤسسة *' : 'Lycée / Établissement *'} required type="text" name="high_school" value={formData.high_school} onChange={handleChange} placeholder={isRTL ? "مثال: ثانوية مولاي إدريس" : "Ex: Lycée Moulay Idriss"} className="sm:col-span-2" isRtl={isRTL} />

                        <Field icon={Building2} label={isRTL ? 'الأكاديمية الجهوية *' : 'Académie Régionale *'} required as="select" name="academy" value={formData.academy} onChange={handleChange} isRtl={isRTL}>
                          <option value="ACADEMIE Fès-Meknès">{isRTL ? 'أكاديمية فاس - مكناس' : 'ACADÉMIE Fès-Meknès'}</option>
                          <option value="ACADEMIE Rabat-Salé-Kénitra">{isRTL ? 'أكاديمية الرباط - سلا - القنيطرة' : 'ACADÉMIE Rabat-Salé-Kénitra'}</option>
                          <option value="ACADEMIE Casablanca-Settat">{isRTL ? 'أكاديمية الدار البيضاء - سطات' : 'ACADÉMIE Casablanca-Settat'}</option>
                          <option value="ACADEMIE Tanger-Tétouan-Al Hoceïma">{isRTL ? 'أكاديمية طنجة - تطوان - الحسيمة' : 'ACADÉMIE Tanger-Tétouan-Al Hoceïma'}</option>
                        </Field>

                        <Field icon={MapPin} label={isRTL ? 'المديرية الإقليمية *' : 'Délégation *'} required as="select" name="delegation" value={formData.delegation} onChange={handleChange} isRtl={isRTL}>
                          <option value="FES">{isRTL ? 'فاس' : 'Fès'}</option>
                          <option value="MEKNES">{isRTL ? 'مكناس' : 'Meknès'}</option>
                          <option value="SEFROU">{isRTL ? 'صفرو' : 'Sefrou'}</option>
                        </Field>

                        <Field icon={GraduationCap} label={isRTL ? 'السلك الدراسي *' : 'Cycle *'} required as="select" name="cycle" value={formData.cycle} onChange={handleChange} isRtl={isRTL}>
                          <option value="Cycle des deux années préparatoires">{isRTL ? 'سلك السنتين التحضيريتين' : 'Cycle des deux années préparatoires (TC)'}</option>
                          <option value="Cycle Spécialisé (Master / Licence)">{isRTL ? 'سلك التخصص' : 'Cycle Spécialisé (Master / Licence)'}</option>
                        </Field>

                        <Field icon={BookOpen} label={isRTL ? 'التخصص المطلوب *' : 'Filière Affectée *'} required as="select" name="filiere" value={formData.filiere} onChange={handleChange} isRtl={isRTL}>
                          <option value="Deux années préparatoires">{isRTL ? 'السنتان التحضيريتان' : 'Deux années préparatoires (TC)'}</option>
                          <option value="Marketing et Action Commerciale">{isRTL ? 'التسويق والعمل التجاري' : 'Marketing et Action Commerciale'}</option>
                          <option value="Finance et Comptabilité">{isRTL ? 'المالية والمحاسبة' : 'Finance et Comptabilité'}</option>
                          <option value="Audit et Contrôle de Gestion">{isRTL ? 'الافتخاص ومراقبة التسيير' : 'Audit et Contrôle de Gestion'}</option>
                          <option value="Management des Ressources Humaines">{isRTL ? 'إدارة الموارد البشرية' : 'Management des Ressources Humaines'}</option>
                        </Field>
                      </div>
                    </SectionCard>
                  </div>
                )}

                {/* ── Navigation ── */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={goPrev}
                    className={cn(
                      'flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl font-bold text-base border transition-all cursor-pointer shadow-xs',
                      step === 1
                        ? 'opacity-0 pointer-events-none'
                        : 'border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white',
                      isRTL && 'font-serif text-lg'
                    )}
                  >
                    {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    <span className="inline">{t.btnPrev}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {([1, 2, 3] as StepId[]).map(i => (
                      <span key={i} className={cn(
                        'rounded-full transition-all duration-300',
                        step === i ? 'w-8 h-2.5 bg-[#0f2863] dark:bg-blue-400 shadow-xs' : step > i ? 'w-2.5 h-2.5 bg-[#0f2863]/40 dark:bg-blue-400/40' : 'w-2.5 h-2.5 bg-slate-300 dark:bg-white/20'
                      )} />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={cn(
                      "flex items-center gap-2.5 bg-gradient-to-r from-[#0f2863] via-[#162e74] to-[#09193d] hover:opacity-95 text-white px-7 sm:px-9 py-3.5 rounded-2xl font-black text-base sm:text-lg tracking-wide transition-all shadow-xl shadow-[#0f2863]/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer",
                      isRTL && "font-serif"
                    )}
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        {t.btnSending}
                      </>
                    ) : step === 3 ? (
                      <><Rocket className="w-5 h-5 text-amber-400" /> {t.btnSubmit}</>
                    ) : (
                      <>{t.btnNext} <ArrowRight className={cn("w-5 h-5", isRTL && "rotate-180")} /></>
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

      {/* ── Virtual Arabic Keyboard Modal ── */}
      {arabicKbdTarget && (
        <VirtualArabicKeyboardModal
          target={arabicKbdTarget}
          formData={formData}
          setFormData={setFormData}
          onClose={() => setArabicKbdTarget(null)}
          lang={lang}
        />
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
