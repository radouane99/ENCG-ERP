import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud, Loader2, User, Users, GraduationCap, CheckCircle2, Lock, Mail,
  MapPin, Calendar, Hash, Star, Building2, BookOpen,
  ChevronLeft, ChevronRight, ArrowRight, Rocket, Phone, Shield, Sun, Moon, Globe, FileText, Search, ChevronDown, Check, Scissors, X, Keyboard, Delete, Image as ImageIcon, Eye, Sparkles, AlertCircle
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useTheme } from '@shared/components/layout/useTheme';
import api from '@shared/lib/api';
import { useAuthStore } from '@stores/authStore';
import { CndpPrivacyModal } from '@shared/components/ui/CndpPrivacyModal';
import AiScolarBotWidget from '@shared/components/AiScolarBotWidget';
import { toast } from 'sonner';

/* ── Types ── */
type StepId = 1 | 2 | 3 | 4 | 5;
type Lang = 'fr' | 'ar' | 'en';

const STEPS = [
  { id: 1 as StepId, labelFr: 'Documents & OCR IA', labelAr: 'الوثائق والذكاء الاصطناعي', subFr: 'Upload Bac & CNIE (Extraction IA)', subAr: 'رفع الباك والبطاقة واستخراج البيانات', icon: FileText },
  { id: 2 as StepId, labelFr: 'Identité & Compte', labelAr: 'الهوية والحساب', subFr: 'Pré-rempli par OCR IA', subAr: 'معلومات الهوية المحررة بالذكاء الاصطناعي', icon: User },
  { id: 3 as StepId, labelFr: 'Parents & Urgence', labelAr: 'الوالدين والاتصال', subFr: 'Tuteurs légaux & Fiche Médicale', subAr: 'معلومات الوالدين والملف الطبي', icon: Users },
  { id: 4 as StepId, labelFr: 'Parcours Académique', labelAr: 'المسار والتخصص', subFr: 'Baccalauréat & Filière ENCG', subAr: 'شهادة البكالوريا وشعبة ENCG', icon: GraduationCap },
  { id: 5 as StepId, labelFr: 'Récapitulatif', labelAr: 'ملخص الترشيح', subFr: 'Vérification & Confirmation', subAr: 'مراجعة وتأكيد البيانات', icon: CheckCircle2 },
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

/* ── OCR Field Normalization Helpers ── */

/**
 * Normalize an OCR-extracted academy string to match the exact select option value.
 * OCR may return e.g. "ORIENTAL", "ACADEMIE ORIENTALE", "Oriental", "Fes Meknes", etc.
 */
function normalizeAcademy(raw: string): string {
  const s = raw.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (s.includes('ORIENTAL') || s.includes('EST') || s.includes('OUJDA') || s.includes('NADOR') || s.includes('BERKANE') || s.includes('GUERCIF') || s.includes('JERADA') || s.includes('TAOURIRT') || s.includes('DRIOUCH') || s.includes('FIGUIG')) return "ACADEMIE L'Oriental";
  if (s.includes('FES') || s.includes('FEZ') || s.includes('MEKNES') || s.includes('MEKNAS') || s.includes('SEFROU') || s.includes('TAZA') || s.includes('TAOUNATE') || s.includes('IFRANE') || s.includes('BOULEMANE') || s.includes('HAJEB')) return 'ACADEMIE Fès-Meknès';
  if (s.includes('RABAT') || s.includes('SALE') || s.includes('KENITRA') || s.includes('KENITRA') || s.includes('SKHIRAT') || s.includes('TEMARA') || s.includes('TIFLET') || s.includes('SIDI KACEM') || s.includes('SIDI SLIMANE')) return 'ACADEMIE Rabat-Salé-Kénitra';
  if (s.includes('CASABLANCA') || s.includes('SETTAT') || s.includes('BERRECHID') || s.includes('MOHAMMEDIA') || s.includes('BENSLIMANE') || s.includes('KHOURIBGA') || s.includes('EL JADIDA')) return 'ACADEMIE Casablanca-Settat';
  if (s.includes('TANGER') || s.includes('TETOUAN') || s.includes('HOCEIMA') || s.includes('CHEFCHAOUEN') || s.includes('LARACHE') || s.includes('OUAZZANE') || s.includes('FAHS') || s.includes('MDIQ')) return 'ACADEMIE Tanger-Tétouan-Al Hoceïma';
  if (s.includes('MARRAKECH') || s.includes('SAFI') || s.includes('CHICHAOUA') || s.includes('ESSAOUIRA') || s.includes('YOUSSOUFIA') || s.includes('RHAMNA') || s.includes('KALAA')) return 'ACADEMIE Marrakech-Safi';
  if (s.includes('AGADIR') || s.includes('SOUSS') || s.includes('MASSA') || s.includes('TAROUDANT') || s.includes('TIZNIT') || s.includes('CHTOUKA') || s.includes('INEZGANE')) return 'ACADEMIE Souss-Massa';
  if (s.includes('BENI MELLAL') || s.includes('KHENIFRA') || s.includes('FQUIH') || s.includes('AZILAL') || s.includes('MIDELT')) return 'ACADEMIE Béni Mellal-Khénifra';
  if (s.includes('DRAA') || s.includes('TAFILALET') || s.includes('ERRACHIDIA') || s.includes('OUARZAZATE') || s.includes('ZAGORA') || s.includes('TINGHIR')) return 'ACADEMIE Drâa-Tafilalet';
  if (s.includes('GUELMIM') || s.includes('OUED NOUN') || s.includes('SIDI IFNI') || s.includes('TAN TAN') || s.includes('ASSA')) return 'ACADEMIE Guelmim-Oued Noun';
  if (s.includes('LAAYOUNE') || s.includes('SAKIA') || s.includes('TARFAYA') || s.includes('BOUJDOUR') || s.includes('SMARA')) return 'ACADEMIE Laâyoune-Sakia El Hamra';
  if (s.includes('DAKHLA') || s.includes('OUED ED-DAHAB') || s.includes('DAHAB') || s.includes('AOUSSERD')) return 'ACADEMIE Dakhla-Oued Ed-Dahab';

  return raw; // return as-is if no match (user can correct manually)
}

/**
 * Normalize an OCR-extracted prefecture/delegation string to match the exact select option value.
 */
function normalizeDelegation(raw: string): string {
  const s = raw.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  if (s === 'GUERCIF' || s.includes('GUERCIF')) return 'Guercif';
  if (s.includes('OUJDA') || s.includes('ANGAD')) return 'Oujda-Angad';
  if (s.includes('NADOR')) return 'Nador';
  if (s.includes('BERKANE')) return 'Berkane';
  if (s.includes('TAOURIRT')) return 'Taourirt';
  if (s.includes('DRIOUCH')) return 'Driouch';
  if (s.includes('JERADA')) return 'Jerada';
  if (s.includes('FIGUIG')) return 'Figuig';
  if (s === 'FES' || s === 'FEZ' || s.includes('FES') || s.includes('FEZ')) return 'Fès';
  if (s.includes('MEKNES') || s.includes('MEKNAS')) return 'Meknès';
  if (s.includes('SEFROU')) return 'Sefrou';
  if (s.includes('TAOUNATE')) return 'Taounate';
  if (s.includes('TAZA')) return 'Taza';
  if (s.includes('IFRANE')) return 'Ifrane';
  if (s.includes('HAJEB')) return 'El Hajeb';
  if (s.includes('BOULEMANE')) return 'Boulemane';
  if (s.includes('RABAT')) return 'Rabat';
  if (s.includes('SALE') || s.includes('SALA')) return 'Salé';
  if (s.includes('KENITRA') || s.includes('KENITRA')) return 'Kénitra';
  if (s.includes('CASABLANCA') || s.includes('DAR EL BEIDA')) return 'Casablanca';
  if (s.includes('SETTAT')) return 'Settat';
  if (s.includes('TANGER')) return 'Tanger';
  if (s.includes('TETOUAN')) return 'Tétouan';
  if (s.includes('MARRAKECH')) return 'Marrakech';
  if (s.includes('AGADIR')) return 'Agadir';

  return raw; // return as-is if no match
}

/**
 * Normalize an OCR-extracted mention string to the canonical French value.
 * Handles: "BIEN", "TB", "très bien", "AB", "PASSABLE", "Félicitations", etc.
 */
function normalizeMention(raw: string): string {
  const s = raw.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (s === 'TB' || s.includes('TRES BIEN') || s.includes('TRESB') || s === 'TRÈS BIEN') return 'Très Bien';
  if (s.includes('FELICIT') || s.includes('HONOUR') || s.includes('HONOR')) return 'Très Bien'; // Félicitations → Très Bien
  if (s === 'B' || s === 'BIEN' || s === 'BI EN') return 'Bien';
  if (s === 'AB' || s.includes('ASSEZ BIEN') || s.includes('ASSEZ B') || s === 'A BIEN') return 'Assez Bien';
  if (s.includes('PASSABLE') || s === 'P' || s === 'PASS') return 'Passable';
  return raw;
}

/**
 * Parse and sanitize an OCR-extracted bac average string.
 * Handles: "15.41", "1541", "154 1", "15,41", "15/20", "15.4", etc.
 * Returns a string like "15.41" or empty string if invalid.
 */
function normalizeAverage(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  let s = String(raw).replace(',', '.').replace('/', '.').replace(/\s+/g, '');
  // Strip non-numeric except dot
  s = s.replace(/[^0-9.]/g, '');
  const n = parseFloat(s);
  if (isNaN(n) || n < 0) return '';
  // OCR sometimes omits the decimal point: 1541 → 15.41, 1200 → 12.00
  if (n > 20 && n <= 2000) {
    const fixed = n / 100;
    if (fixed >= 0 && fixed <= 20) return fixed.toFixed(2);
  }
  // Clamp to [0, 20]
  const clamped = Math.min(20, Math.max(0, n));
  return clamped.toFixed(2);
}

/**
 * Derive the correct mention from a numeric bac average.
 * 10.00-11.99 → Passable, 12.00-13.99 → Assez Bien, 14.00-15.99 → Bien, ≥16.00 → Très Bien
 */
function mentionFromAverage(avg: string | number): string {
  const n = parseFloat(String(avg));
  if (isNaN(n)) return '';
  if (n >= 16) return 'Très Bien';
  if (n >= 14) return 'Bien';
  if (n >= 12) return 'Assez Bien';
  if (n >= 10) return 'Passable';
  return '';
}

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
          "w-full flex items-center justify-between rounded-2xl py-3.5 text-base sm:text-lg font-extrabold focus:outline-none transition-all cursor-pointer shadow-sm text-left group",
          (value !== undefined && value !== null && value !== '')
            ? "bg-slate-100 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-inner"
            : "bg-white dark:bg-slate-900/90 border-2 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:border-[#0f2863] dark:focus:border-blue-400 focus:ring-4 focus:ring-[#0f2863]/20",
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
  icon: Icon, label, required, className = '', as: As = 'input', isRtl = false, onUnlock, children, ...props
}: {
  icon: React.ElementType;
  label: string;
  required?: boolean;
  className?: string;
  as?: 'input' | 'select';
  isRtl?: boolean;
  onUnlock?: () => void;
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

  const isReadOnly = (props as any).readOnly;
  const inputValue = (props as any).value;
  const hasVal = inputValue !== undefined && inputValue !== null && inputValue !== '';

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <label className={cn('text-sm sm:text-base font-black tracking-wide uppercase text-slate-800 dark:text-slate-200 flex items-center', isRtl && "justify-start font-serif text-lg font-black")}>
        <span>{cleanLabel}</span>
        {required && <span className="text-rose-500 font-black ms-1">*</span>}
      </label>
      <div className="relative group">
        <span className={cn("pointer-events-none absolute inset-y-0 flex items-center text-slate-400 dark:text-slate-500 group-focus-within:text-[#0f2863] dark:group-focus-within:text-blue-400 transition-colors", isRtl ? "right-4" : "left-4")}>
          <Icon className="w-5 h-5" />
        </span>
        <input
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          className={cn(
            "w-full rounded-2xl py-4 text-base sm:text-lg font-extrabold placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all shadow-sm",
            isReadOnly || hasVal
              ? "bg-slate-100 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-inner"
              : "bg-white dark:bg-slate-900/90 border-2 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:border-[#0f2863] dark:focus:border-blue-400 focus:ring-4 focus:ring-[#0f2863]/20",
            isRtl ? "pr-12 pl-4 text-right font-serif text-xl font-bold" : "pl-12 pr-4",
            isReadOnly && !isRtl && "pr-36"
          )}
        />
        {isReadOnly && (
          <button
            type="button"
            onClick={onUnlock}
            title="Cliquer pour déverrouiller et modifier ce champ"
            className={cn("absolute inset-y-0 flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/30 px-2.5 py-0.5 rounded-lg border border-emerald-400/50 h-6 my-auto cursor-pointer transition-all shadow-xs hover:scale-105", isRtl ? "left-3" : "right-3")}
          >
            <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Extrait IA (Éditer ✏️)</span>
          </button>
        )}
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
  target: { fieldName: string; fieldLabel: string } | null;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
  lang?: Lang;
}) {
  if (!target) return null;
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

export default function InscriptionPage({ 
  editMode = false, 
  initialData = null, 
  onSaved = null,
  initialStep = 1
}: { 
  editMode?: boolean; 
  initialData?: any; 
  onSaved?: (() => void) | null;
  initialStep?: number;
}) {
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
  const [step, setStep] = useState<StepId>((initialStep as StepId) || 1);

  useEffect(() => {
    if (initialStep && initialStep >= 1 && initialStep <= 5) {
      setStep(initialStep as StepId);
    }
  }, [initialStep]);
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
    father_job: '',
    mother_last_name_fr: '',
    mother_first_name_fr: '',
    mother_last_name_ar: '',
    mother_first_name_ar: '',
    mother_cin: '',
    mother_phone: '',
    mother_job: '',
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
    bac_name: '',
    bac_mention: '',
    bac_average: '',
    bac_year: '',
    high_school: '',
    lycee: '',
    academy: '',
    delegation: '',
    bac_type: '',
    bac_serie: '',
    bac_series: '',
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

  const [ocrExtractedFields, setOcrExtractedFields] = useState<Record<string, boolean>>({});

  const toggleFieldLock = (fieldName: string) => {
    setOcrExtractedFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
    toast.info(`🔓 Champ déverrouillé pour modification.`);
  };

  const { user } = useAuthStore();

  // In editMode: load existing data from DB and pre-fill form
  useEffect(() => {
    if (!editMode) return;
    const cne = (user as any)?.cne || initialData?.cne || '';
    const cin = (user as any)?.cin || initialData?.cin || '';
    const email = (user as any)?.email || initialData?.email || '';

    const applyCandData = (cand: any) => {
      if (!cand) return;

      let father_last = cand.father_last_name_fr || cand.father_name || '';
      let father_first = cand.father_first_name_fr || '';
      if (!cand.father_first_name_fr && father_last.includes(' ')) {
        const parts = father_last.trim().split(/\s+/);
        father_last = parts[0];
        father_first = parts.slice(1).join(' ');
      }

      let mother_last = cand.mother_last_name_fr || cand.mother_name || '';
      let mother_first = cand.mother_first_name_fr || '';
      if (!cand.mother_first_name_fr && mother_last.includes(' ')) {
        const parts = mother_last.trim().split(/\s+/);
        mother_last = parts[0];
        mother_first = parts.slice(1).join(' ');
      }

      const docs = cand.documents || {};
      const bacDoc = docs.bac || docs.BAC;
      const cnieDoc = docs.cnie || docs.cin || docs.CIN || docs.CNIE || docs.cin_recto_verso;
      const releveDoc = docs.releve_notes || docs.releve || docs.RELEVE;

      const activeCne = cand.cne || cne;
      const activeCin = cand.cin || cin;

      setFormData(prev => {
        const finalCne = activeCne || prev.cne;
        const finalCin = activeCin || prev.cin;
        return {
          ...prev,
          cne: finalCne,
          cin: finalCin,
          email: cand.email || email || prev.email,
          phone: cand.phone || prev.phone,
          last_name_fr: cand.last_name || prev.last_name_fr,
          first_name_fr: cand.first_name || prev.first_name_fr,
          last_name_ar: cand.last_name_ar || prev.last_name_ar,
          first_name_ar: cand.first_name_ar || prev.first_name_ar,
          birth_date: cand.birth_date ? String(cand.birth_date).split('T')[0] : prev.birth_date,
          birth_city_fr: cand.birth_city || prev.birth_city_fr,
          birth_city_ar: cand.birth_city_ar || prev.birth_city_ar,
          gender: cand.gender || prev.gender,
          family_status: cand.family_status || prev.family_status,
          nationality: cand.nationality || prev.nationality,
          address_fr: cand.address || prev.address_fr,
          address_ar: cand.address_ar || prev.address_ar,
          region: cand.region || prev.region,
          province: cand.city || prev.province,
          father_last_name_fr: father_last || prev.father_last_name_fr,
          father_first_name_fr: father_first || prev.father_first_name_fr,
          father_last_name_ar: cand.father_name_ar || prev.father_last_name_ar,
          father_cin: cand.father_cin || prev.father_cin,
          father_phone: cand.father_phone || prev.father_phone,
          father_job: cand.father_profession || prev.father_job,
          mother_last_name_fr: mother_last || prev.mother_last_name_fr,
          mother_first_name_fr: mother_first || prev.mother_first_name_fr,
          mother_last_name_ar: cand.mother_name_ar || prev.mother_last_name_ar,
          mother_cin: cand.mother_cin || prev.mother_cin,
          mother_phone: cand.mother_phone || prev.mother_phone,
          mother_job: cand.mother_profession || prev.mother_job,
          parent_phone: cand.parent_phone || cand.father_phone || prev.parent_phone,
          emergency_contact_name: cand.emergency_contact_name || prev.emergency_contact_name,
          emergency_contact_phone: cand.emergency_contact_phone || prev.emergency_contact_phone,
          allergy_type: cand.allergy_type || prev.allergy_type,
          medication_used: cand.medication_used || prev.medication_used,
          treating_doctor_info: cand.treating_doctor_info || prev.treating_doctor_info,
          has_medical_followup: cand.has_medical_followup || prev.has_medical_followup,
          has_disability: cand.has_disability || prev.has_disability,
          disability_details: cand.disability_details || prev.disability_details,
          filiere: cand.filiere || prev.filiere,
          bac_average: cand.bac_average ? String(cand.bac_average) : prev.bac_average,
          bac_name: cand.bac_type || cand.bac_serie || prev.bac_name,
          bac_mention: cand.bac_mention || prev.bac_mention,
          bac_year: cand.bac_year || prev.bac_year,
          high_school: cand.high_school || cand.lycee || prev.high_school,
          academy: cand.academy || cand.region || prev.academy,
          delegation: cand.delegation || cand.province || cand.prefecture || prev.delegation,

          // Documents numérisés pré-existants
          bac_pdf_name: bacDoc?.original_filename || (bacDoc?.file_path ? `BAC_${finalCne}.pdf` : prev.bac_pdf_name),
          bac_file_url: bacDoc?.file_path || `/api/public/serve-document/bac/${encodeURIComponent(finalCne || finalCin)}`,
          bac_has_existing: Boolean(bacDoc?.file_path || cand.documents?.bac),

          cnie_pdf_name: cnieDoc?.original_filename || (cnieDoc?.file_path ? `CNIE_${finalCne}.pdf` : prev.cnie_pdf_name),
          cnie_file_url: cnieDoc?.file_path || `/api/public/serve-document/cnie/${encodeURIComponent(finalCne || finalCin)}`,
          cnie_has_existing: Boolean(cnieDoc?.file_path || cand.documents?.cnie),

          releve_notes_pdf_name: releveDoc?.original_filename || (releveDoc?.file_path ? `RELEVE_${finalCne}.pdf` : prev.releve_notes_pdf_name),
          releve_notes_file_url: releveDoc?.file_path || `/api/public/serve-document/releve_notes/${encodeURIComponent(finalCne || finalCin)}`,
          releve_notes_has_existing: Boolean(releveDoc?.file_path || cand.documents?.releve_notes),

          photo_url: cand.photo_url || (cand.photo_path ? `/storage/${cand.photo_path.replace(/^\/?storage\//, '')}` : prev.photo_url),
        };
      });
    };

    if (initialData) {
      applyCandData(initialData);
    }

    api.get('/public/track-dossier', { params: { cne, cin, email } })
      .then(res => {
        applyCandData(res.data?.candidate);
      })
      .catch(() => { });
  }, [editMode, user, initialData]);

  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>({});
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [pdfPreviewModal, setPdfPreviewModal] = useState<{ title: string; url: string; isImage?: boolean } | null>(null);
  const [showOcrConfirmationModal, setShowOcrConfirmationModal] = useState(false);
  const [extractedDataResult, setExtractedDataResult] = useState<any | null>(null);
  const [ocrExtracting, setOcrExtracting] = useState(false);

  const [selectedTargetDoc, setSelectedTargetDoc] = useState<'bac' | 'cnie' | 'releve_notes'>('bac');
  const [missingFieldsList, setMissingFieldsList] = useState<string[]>([]);
  const [showMissingModal, setShowMissingModal] = useState(false);

  const handleTriggerOcrForDoc = async (docType: 'bac' | 'cnie' | 'releve_notes') => {
    const file = uploadedFiles[docType];

    if (!file) {
      const docLabels = { bac: 'du Baccalauréat', cnie: 'de la CNIE', releve_notes: 'du Relevé de Notes' };
      toast.error(isRTL ? `يرجى تحميل ملف ${docLabels[docType]} أولاً.` : `Veuillez d'abord télécharger le fichier ${docLabels[docType]}.`);
      return;
    }

    setOcrExtracting(true);
    const toastId = toast.loading(`🤖 Groq Llama 3.2 Vision AI: Extraction des données de ${file.name}...`);

    try {
      const targetType = docType === 'cnie' ? 'cin' : (docType === 'releve_notes' ? 'releve' : 'bac');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', targetType);
      fd.append('doc_type', targetType);

      const res = await api.post('/public/ocr-extract-documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const ocr = res.data?.ocr_data || {};

      const extractedFirstName = ocr.first_name_fr || ocr.first_name || '';
      const extractedLastName = ocr.last_name_fr || ocr.last_name || '';
      const extractedCin = ocr.cin || ocr.cnie || '';
      const extractedCne = ocr.cne || ocr.code_massar || '';

      const resultData = {
        doc_type_label: docType === 'bac' ? 'Baccalauréat Original' : (docType === 'cnie' ? 'Carte Nationale (CNIE)' : 'Relevé de Notes du Bac'),
        file_name: file.name,
        cne: docType !== 'cnie' ? (extractedCne || formData.cne || 'Non applicable') : 'Non applicable',
        cin: extractedCin || formData.cin || 'Non applicable',
        last_name_fr: extractedLastName || formData.last_name_fr || '',
        first_name_fr: extractedFirstName || formData.first_name_fr || '',
        last_name_ar: ocr.last_name_ar || formData.last_name_ar || '',
        first_name_ar: ocr.first_name_ar || formData.first_name_ar || '',
        birth_date: docType === 'cnie' ? (ocr.birth_date || formData.birth_date || '') : 'Non applicable',
        birth_city_fr: docType === 'cnie' ? (ocr.birth_city_fr || formData.birth_city_fr || '') : 'Non applicable',
        birth_city_ar: docType === 'cnie' ? (ocr.birth_city_ar || formData.birth_city_ar || '') : 'Non applicable',
        address_fr: docType === 'cnie' ? (ocr.address_fr || formData.address_fr || '') : 'Non applicable',
        bac_average: docType === 'releve_notes' ? (ocr.bac_average || formData.bac_average || '') : 'Non applicable',
        bac_mention: docType !== 'cnie' ? (ocr.bac_mention || formData.bac_mention || '') : 'Non applicable',
        bac_type: docType !== 'cnie' ? (ocr.bac_type || formData.bac_name || '') : 'Non applicable',
        high_school: docType !== 'cnie' ? (ocr.high_school || formData.high_school || '') : 'Non applicable',
        academy: docType === 'bac' ? (ocr.academy || formData.academy || '') : 'Non applicable',
        doc_count: Object.keys(uploadedFiles).length
      };

      setFormData(prev => {
        const newData = { ...prev };

        if (docType === 'cnie') {
          if (extractedCin) newData.cin = extractedCin;
          if (extractedLastName) newData.last_name_fr = extractedLastName;
          if (extractedFirstName) newData.first_name_fr = extractedFirstName;
          if (ocr.last_name_ar && ocr.last_name_ar.length >= 2) newData.last_name_ar = ocr.last_name_ar;
          if (ocr.first_name_ar && ocr.first_name_ar.length >= 2) newData.first_name_ar = ocr.first_name_ar;
          if (ocr.birth_date) newData.birth_date = ocr.birth_date;
          if (ocr.gender) newData.gender = ocr.gender;
          if (ocr.birth_city_fr) newData.birth_city_fr = ocr.birth_city_fr;
          if (ocr.birth_city_ar) newData.birth_city_ar = ocr.birth_city_ar;

          // Parents (Moroccan CNIE Verso Naming Convention)
          if (ocr.father_name_fr) {
            newData.father_first_name_fr = ocr.father_name_fr.split(/\s+(?:ben|bin|bne)\s+/i)[0].trim();
            newData.father_last_name_fr = extractedLastName || prev.last_name_fr;
          }
          if (ocr.father_name_ar) {
            newData.father_first_name_ar = ocr.father_name_ar.split(/\s+بن\s+/)[0].trim();
            newData.father_last_name_ar = ocr.last_name_ar || prev.last_name_ar;
          }
          if (ocr.mother_name_fr) {
            newData.mother_first_name_fr = ocr.mother_name_fr.split(/\s+(?:bent|bint)\s+/i)[0].trim();
            newData.mother_last_name_fr = '';
          }
          if (ocr.mother_name_ar) {
            newData.mother_first_name_ar = ocr.mother_name_ar.split(/\s+بنت\s+/)[0].trim();
            newData.mother_last_name_ar = '';
          }

          // Address
          if (ocr.address_fr || ocr.address) newData.address_fr = ocr.address_fr || ocr.address;
          if (ocr.address_ar) newData.address_ar = ocr.address_ar;
        }

        if (docType === 'bac') {
          if (extractedCne) newData.cne = extractedCne;
          if (extractedCin && !newData.cin) newData.cin = extractedCin;
          if (extractedLastName && !newData.last_name_fr) newData.last_name_fr = extractedLastName;
          if (extractedFirstName && !newData.first_name_fr) newData.first_name_fr = extractedFirstName;
          if (ocr.last_name_ar && ocr.last_name_ar.length >= 2 && !newData.last_name_ar) newData.last_name_ar = ocr.last_name_ar;
          if (ocr.first_name_ar && ocr.first_name_ar.length >= 2 && !newData.first_name_ar) newData.first_name_ar = ocr.first_name_ar;
          // Mention: normalize + cross-validate with average
          if (ocr.bac_mention) newData.bac_mention = normalizeMention(ocr.bac_mention);
          if (ocr.bac_type) newData.bac_name = ocr.bac_type.startsWith('Bac ') ? ocr.bac_type : `Bac ${ocr.bac_type}`;
          if (ocr.high_school) newData.high_school = ocr.high_school;
          if (ocr.academy) newData.academy = normalizeAcademy(ocr.academy);
          if (ocr.prefecture || ocr.province || ocr.delegation) {
            const normDel = normalizeDelegation(ocr.prefecture || ocr.province || ocr.delegation);
            newData.delegation = normDel;
            newData.province = normDel;
          }
        }

        if (docType === 'releve_notes') {
          if (extractedCne && !newData.cne) newData.cne = extractedCne;
          if (extractedCin && !newData.cin) newData.cin = extractedCin;
          // Average: normalize OCR value
          if (ocr.bac_average) {
            const normAvg = normalizeAverage(ocr.bac_average);
            if (normAvg) {
              newData.bac_average = normAvg;
              // Cross-validate mention against the parsed average
              const derivedMention = mentionFromAverage(normAvg);
              const currentMention = normalizeMention(ocr.bac_mention || newData.bac_mention || '');
              // If OCR mention is absent or inconsistent with the average → override
              if (derivedMention && (!currentMention || currentMention !== derivedMention)) {
                newData.bac_mention = derivedMention;
              } else if (currentMention) {
                newData.bac_mention = currentMention;
              }
            }
          }
          if (ocr.bac_mention && !newData.bac_mention) newData.bac_mention = normalizeMention(ocr.bac_mention);
          if (ocr.bac_type && !newData.bac_name) newData.bac_name = ocr.bac_type.startsWith('Bac ') ? ocr.bac_type : `Bac ${ocr.bac_type}`;
          if (ocr.high_school && !newData.high_school) newData.high_school = ocr.high_school;
        }

        return newData;
      });

      setOcrExtractedFields(prev => {
        const newFields = { ...prev };

        if (extractedLastName) newFields.last_name_fr = true;
        if (extractedFirstName) newFields.first_name_fr = true;
        if (ocr.last_name_ar) newFields.last_name_ar = true;
        if (ocr.first_name_ar) newFields.first_name_ar = true;

        if (docType === 'cnie') {
          if (extractedCin) newFields.cin = true;
          if (ocr.birth_date) newFields.birth_date = true;
          if (ocr.birth_city_fr) newFields.birth_city_fr = true;
          if (ocr.birth_city_ar) newFields.birth_city_ar = true;
          if (ocr.father_name_fr) { newFields.father_first_name_fr = true; newFields.father_last_name_fr = true; }
          if (ocr.father_name_ar) newFields.father_first_name_ar = true;
          if (ocr.mother_name_fr) { newFields.mother_first_name_fr = true; newFields.mother_last_name_fr = true; }
          if (ocr.mother_name_ar) newFields.mother_first_name_ar = true;
          if (ocr.address_fr || ocr.address) newFields.address_fr = true;
          if (ocr.address_ar) newFields.address_ar = true;
        }

        if (docType === 'bac') {
          if (extractedCne) newFields.cne = true;
          if (extractedCin) newFields.cin = true;
          if (ocr.bac_type) newFields.bac_name = true;
          if (ocr.bac_mention) newFields.bac_mention = true;
          if (ocr.high_school) newFields.high_school = true;
          if (ocr.academy) newFields.academy = true;
          if (ocr.prefecture || ocr.province) newFields.province = true;
        }

        if (docType === 'releve_notes') {
          if (extractedCne) newFields.cne = true;
          if (extractedCin) newFields.cin = true;
          if (ocr.bac_average) newFields.bac_average = true;
          if (ocr.bac_mention) newFields.bac_mention = true;
          if (ocr.bac_type) newFields.bac_name = true;
          if (ocr.high_school) newFields.high_school = true;
        }

        return newFields;
      });

      setExtractedDataResult(resultData);
      if (res.data?.ai_debug_error) {
        toast.info(`⚠️ Note API IA : ${res.data.ai_debug_error}`, { duration: 8000 });
      } else {
        toast.success(`✨ Données de ${file.name} extraites avec succès !`, { id: toastId });
      }
      setShowOcrConfirmationModal(true);
    } catch (err: any) {
      toast.dismiss(toastId);
      const msg = err.response?.data?.error_details || err.response?.data?.message || err.message || 'Erreur d\'extraction OCR';
      toast.error(`❌ Erreur OCR IA : ${msg}`);
    } finally {
      setOcrExtracting(false);
    }
  };

  const handleOcrDocumentUpload = async (docType: string, file: File) => {
    setUploadedFiles(prev => ({ ...prev, [docType]: file }));
    setOcrExtracting(true);
    const toastId = toast.loading(`🤖 Gemini Vision AI : Extraction OCR de ${file.name}...`);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', docType);
      if (formData.cne) fd.append('cne', formData.cne);
      if (formData.cin) fd.append('cin', formData.cin);

      const res = await api.post('/public/ocr-extract-documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const ocr = res.data.ocr_data;
      if (ocr) {
        setFormData(prev => {
          const newData = { ...prev };
          const extFirstName = ocr.first_name_fr || ocr.first_name || '';
          const extLastName = ocr.last_name_fr || ocr.last_name || '';
          const extCin = ocr.cin || ocr.cnie || '';
          const extCne = ocr.cne || ocr.code_massar || '';

          if (docType === 'cnie') {
            if (extCin) newData.cin = extCin;
            if (extLastName) newData.last_name_fr = extLastName;
            if (extFirstName) newData.first_name_fr = extFirstName;
            if (ocr.last_name_ar && ocr.last_name_ar.length >= 2) newData.last_name_ar = ocr.last_name_ar;
            if (ocr.first_name_ar && ocr.first_name_ar.length >= 2) newData.first_name_ar = ocr.first_name_ar;
            if (ocr.birth_date) newData.birth_date = ocr.birth_date;
            if (ocr.gender) newData.gender = ocr.gender;
            if (ocr.birth_city_fr) newData.birth_city_fr = ocr.birth_city_fr;
            if (ocr.birth_city_ar) newData.birth_city_ar = ocr.birth_city_ar;

            // Parents (Moroccan CNIE Verso Naming Convention)
            if (ocr.father_name_fr) {
              newData.father_first_name_fr = ocr.father_name_fr.split(/\s+(?:ben|bin|bne)\s+/i)[0].trim();
              newData.father_last_name_fr = extLastName || prev.last_name_fr;
            }
            if (ocr.father_name_ar) {
              newData.father_first_name_ar = ocr.father_name_ar.split(/\s+بن\s+/)[0].trim();
              newData.father_last_name_ar = ocr.last_name_ar || prev.last_name_ar;
            }
            if (ocr.mother_name_fr) {
              newData.mother_first_name_fr = ocr.mother_name_fr.split(/\s+(?:bent|bint)\s+/i)[0].trim();
              newData.mother_last_name_fr = '';
            }
            if (ocr.mother_name_ar) {
              newData.mother_first_name_ar = ocr.mother_name_ar.split(/\s+بنت\s+/)[0].trim();
              newData.mother_last_name_ar = '';
            }

            // Address
            if (ocr.address_fr || ocr.address) newData.address_fr = ocr.address_fr || ocr.address;
            if (ocr.address_ar) newData.address_ar = ocr.address_ar;
          }

          if (docType === 'bac') {
            if (extCne) newData.cne = extCne;
            if (extCin && !newData.cin) newData.cin = extCin;
            if (extLastName && !newData.last_name_fr) newData.last_name_fr = extLastName;
            if (extFirstName && !newData.first_name_fr) newData.first_name_fr = extFirstName;
            if (ocr.last_name_ar && ocr.last_name_ar.length >= 2 && !newData.last_name_ar) newData.last_name_ar = ocr.last_name_ar;
            if (ocr.first_name_ar && ocr.first_name_ar.length >= 2 && !newData.first_name_ar) newData.first_name_ar = ocr.first_name_ar;
            // Mention: normalize + cross-validate with average if present
            if (ocr.bac_mention) newData.bac_mention = normalizeMention(ocr.bac_mention);
            if (ocr.bac_type) newData.bac_name = ocr.bac_type.startsWith('Bac ') ? ocr.bac_type : `Bac ${ocr.bac_type}`;
            if (ocr.high_school) newData.high_school = ocr.high_school;
            if (ocr.academy) newData.academy = normalizeAcademy(ocr.academy);
            if (ocr.prefecture || ocr.province || ocr.delegation) {
              const normDel = normalizeDelegation(ocr.prefecture || ocr.province || ocr.delegation);
              newData.delegation = normDel;
              newData.province = normDel;
            }
          }

          if (docType === 'releve_notes') {
            if (extCne && !newData.cne) newData.cne = extCne;
            if (extCin && !newData.cin) newData.cin = extCin;
            // Average: normalize + cross-validate mention
            if (ocr.bac_average) {
              const normAvg = normalizeAverage(ocr.bac_average);
              if (normAvg) {
                newData.bac_average = normAvg;
                const derivedMention = mentionFromAverage(normAvg);
                const currentMention = normalizeMention(ocr.bac_mention || newData.bac_mention || '');
                if (derivedMention && (!currentMention || currentMention !== derivedMention)) {
                  newData.bac_mention = derivedMention;
                } else if (currentMention) {
                  newData.bac_mention = currentMention;
                }
              }
            }
            if (ocr.bac_mention && !newData.bac_mention) newData.bac_mention = normalizeMention(ocr.bac_mention);
            if (ocr.bac_type && !newData.bac_name) newData.bac_name = ocr.bac_type.startsWith('Bac ') ? ocr.bac_type : `Bac ${ocr.bac_type}`;
            if (ocr.high_school && !newData.high_school) newData.high_school = ocr.high_school;
          }

          return newData;
        });


        setOcrExtractedFields(prev => {
          const newFields = { ...prev };
          const extFirstName = ocr.first_name_fr || ocr.first_name || '';
          const extLastName = ocr.last_name_fr || ocr.last_name || '';
          const extCin = ocr.cin || ocr.cnie || '';
          const extCne = ocr.cne || ocr.code_massar || '';

          if (extLastName) newFields.last_name_fr = true;
          if (extFirstName) newFields.first_name_fr = true;
          if (ocr.last_name_ar) newFields.last_name_ar = true;
          if (ocr.first_name_ar) newFields.first_name_ar = true;

          if (docType === 'cnie') {
            if (extCin) newFields.cin = true;
            if (ocr.birth_date) newFields.birth_date = true;
            if (ocr.birth_city_fr) newFields.birth_city_fr = true;
            if (ocr.birth_city_ar) newFields.birth_city_ar = true;
            if (ocr.father_name_fr) { newFields.father_first_name_fr = true; newFields.father_last_name_fr = true; }
            if (ocr.father_name_ar) newFields.father_first_name_ar = true;
            if (ocr.mother_name_fr) { newFields.mother_first_name_fr = true; newFields.mother_last_name_fr = true; }
            if (ocr.mother_name_ar) newFields.mother_first_name_ar = true;
            if (ocr.address_fr || ocr.address) newFields.address_fr = true;
            if (ocr.address_ar) newFields.address_ar = true;
          }

          if (docType === 'bac') {
            if (extCne) newFields.cne = true;
            if (extCin) newFields.cin = true;
            if (ocr.bac_type) newFields.bac_name = true;
            if (ocr.bac_mention) newFields.bac_mention = true;
            if (ocr.high_school) newFields.high_school = true;
            if (ocr.academy) newFields.academy = true;
            if (ocr.prefecture || ocr.province) newFields.province = true;
          }

          if (docType === 'releve_notes') {
            if (extCne) newFields.cne = true;
            if (extCin) newFields.cin = true;
            if (ocr.bac_average) newFields.bac_average = true;
            if (ocr.bac_mention) newFields.bac_mention = true;
            if (ocr.bac_type) newFields.bac_name = true;
            if (ocr.high_school) newFields.high_school = true;
          }

          return newFields;
        });

        toast.success(`✨ Gemini Vision AI : Extraction réussie du fichier ${file.name} !`, { id: toastId });

        // ── Sauvegarde automatique du document dans le storage ──
        // On re-lit le CNE depuis le résultat OCR ou depuis formData
        const cneToUse = ocr.cne || ocr.code_massar || formData.cne || (user as any)?.cne || '';
        const cinToUse = ocr.cin || ocr.cnie || formData.cin || (user as any)?.cin || '';
        if (cneToUse || cinToUse) {
          const saveId = toast.loading(`💾 Sauvegarde du document ${file.name} dans le dossier numérique...`);
          try {
            const saveData = new FormData();
            saveData.append('file', file);
            saveData.append('type', docType === 'cnie' ? 'cnie' : docType);
            saveData.append('cne', cneToUse);
            saveData.append('cin', cinToUse);
            await api.post('/public/upload-candidate-document', saveData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(`✅ Document "${file.name}" sauvegardé dans le dossier numérique !`, { id: saveId });
          } catch {
            toast.warning(`⚠️ Extraction réussie mais sauvegarde différée (sera relancée à la validation).`, { id: saveId });
          }
        }
      }
    } catch (err) {
      toast.dismiss(toastId);
    } finally {
      setOcrExtracting(false);
    }
  };


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

  const validateStep = (currentStep: number): boolean => {
    if (ocrExtracting) {
      toast.warning(isRTL ? '⏳ يرجى الانتظار حتى الانتهاء من استخراج البيانات بالذكاء الاصطناعي...' : '⏳ Extraction des données par l\'IA en cours... Veuillez patienter.');
      return false;
    }

    const missing: string[] = [];

    if (currentStep === 1) {
      if (!cndpConsent) {
        missing.push(isRTL ? 'الموافقة على شروط حماية المعطيات الشخصية (القانون 09-08) *' : 'Acceptation des conditions CNDP (Loi 09-08) *');
      }
    }

    if (currentStep === 2) {
      if (!formData.cne) missing.push(isRTL ? 'رمز مسار (CNE) *' : 'Code MASSAR (CNE) *');
      if (!formData.cin) missing.push(isRTL ? 'رقم البطاقة الوطنية (CNIE) *' : 'CNIE (Carte d\'Identité) *');
      if (!formData.email) missing.push(isRTL ? 'البريد الإلكتروني الشخصي *' : 'Adresse E-mail *');
      if (!formData.phone) missing.push(isRTL ? 'رقم الهاتف المحمول *' : 'Téléphone Portable *');
      if (!formData.last_name_fr) missing.push(isRTL ? 'النسب بالفرنسية *' : 'Nom en Français *');
      if (!formData.first_name_fr) missing.push(isRTL ? 'الاسم بالفرنسية *' : 'Prénom en Français *');
      if (!formData.last_name_ar) missing.push(isRTL ? 'النسب بالعربية *' : 'Nom en Arabe *');
      if (!formData.first_name_ar) missing.push(isRTL ? 'الاسم بالعربية *' : 'Prénom en Arabe *');
      if (!formData.birth_date) missing.push(isRTL ? 'تاريخ الازدياد *' : 'Date de Naissance *');
      if (!formData.birth_city_fr) missing.push(isRTL ? 'مكان الازدياد بالفرنسية *' : 'Lieu de Naissance (FR) *');
      if (!formData.birth_city_ar) missing.push(isRTL ? 'مكان الازدياد بالعربية *' : 'Lieu de Naissance en Arabe *');
      if (!formData.address_fr) missing.push(isRTL ? 'عنوان السكن بالفرنسية *' : 'Adresse de Résidence (FR) *');
      if (!formData.address_ar) missing.push(isRTL ? 'عنوان السكن بالعربية *' : 'Adresse de Résidence en Arabe *');
      if (!editMode && (!formData.password || formData.password.length < 8)) missing.push(isRTL ? 'كلمة المرور (8 أحرف على الأقل) *' : 'Mot de Passe (min. 8 caractères) *');
      if (!editMode && formData.password !== formData.password_confirmation) missing.push(isRTL ? 'تأكيد كلمة المرور غير متطابق *' : 'Confirmation du Mot de Passe *');
    }

    if (currentStep === 3) {
      if (!formData.father_last_name_fr) missing.push(isRTL ? 'نسب الأب بالفرنسية *' : 'Nom du Père (FR) *');
      if (!formData.father_first_name_fr) missing.push(isRTL ? 'الاسم الشخصي للأب بالفرنسية *' : 'Prénom du Père (FR) *');
      if (!formData.father_last_name_ar) missing.push(isRTL ? 'نسب الأب بالعربية *' : 'Nom du Père en Arabe *');
      if (!formData.father_first_name_ar) missing.push(isRTL ? 'الاسم الشخصي للأب بالعربية *' : 'Prénom du Père en Arabe *');
      if (!formData.father_cin) missing.push(isRTL ? 'البطاقة الوطنية للأب (CNIE) *' : 'CNIE du Père *');
      if (!formData.father_phone) missing.push(isRTL ? 'هاتف الأب *' : 'Téléphone du Père *');
      if (!formData.mother_first_name_fr) missing.push(isRTL ? 'الاسم الشخصي للأم بالفرنسية *' : 'Prénom de la Mère (FR) *');
      if (!formData.mother_first_name_ar) missing.push(isRTL ? 'الاسم الشخصي للأم بالعربية *' : 'Prénom de la Mère en Arabe *');
      if (!formData.mother_cin) missing.push(isRTL ? 'البطاقة الوطنية للأم (CNIE) *' : 'CNIE de la Mère *');
    }

    if (currentStep === 4) {
      if (!formData.bac_average) missing.push(isRTL ? 'معدل البكالوريا *' : 'Moyenne Générale du Bac *');
      if (!formData.high_school) missing.push(isRTL ? 'اسم الثانوية / المؤسسة *' : 'Lycée / Établissement *');
      if (!formData.filiere) missing.push(isRTL ? 'الشعبة المطلوبة *' : 'Filière Demandée *');
    }

    if (missing.length > 0) {
      setMissingFieldsList(missing);
      setShowMissingModal(true);
      return false;
    }

    setShowMissingModal(false);
    return true;
  };

  const goNext = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, 5) as StepId);
    }
  };
  const goPrev = () => setStep(s => Math.max(s - 1, 1) as StepId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (step < 5) { goNext(); return; }


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
      father_name: `${formData.father_last_name_fr || ''} ${formData.father_first_name_fr || ''}`.trim(),
      mother_name: `${formData.mother_last_name_fr || ''} ${formData.mother_first_name_fr || ''}`.trim(),
      father_profession: formData.father_job,
      mother_profession: formData.mother_job,
      high_school: formData.high_school || formData.lycee || '',
      lycee: formData.high_school || formData.lycee || '',
      academy: formData.academy || formData.region || '',
      region: formData.academy || formData.region || '',
      delegation: formData.delegation || formData.province || '',
      province: formData.delegation || formData.province || '',
      bac_type: formData.bac_name || formData.bac_type || '',
      bac_serie: formData.bac_name || formData.bac_type || '',
      bac_series: formData.bac_name || formData.bac_type || '',
      full_name: `${first_name} ${last_name}`.trim(),
    };

    try {
      if (editMode) {
        // EDIT MODE: update existing dossier
        await api.post('/public/update-candidate-dossier', payload);
        setSubmitting(false);
        toast.success('✅ Votre dossier a été mis à jour avec succès dans la base de données !');
        if (onSaved) {
          onSaved();
        } else {
          setTimeout(() => {
            window.location.href = '/dashboard';
            window.location.reload();
          }, 800);
        }
      } else {
        // NEW INSCRIPTION
        const res = await api.post('/v1/auth/register', payload);
        if (res.data.data?.user) {
          useAuthStore.setState({
            user: res.data.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        }
        // Persist full candidate dossier (Academy, Delegation, High School, Parents, Medical) to PostgreSQL
        try {
          await api.post('/public/update-candidate-dossier', payload);
        } catch (e) {
          console.warn("Dossier details save warning:", e);
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

  const saveDirectToDatabase = async () => {
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
      father_name: `${formData.father_last_name_fr || ''} ${formData.father_first_name_fr || ''}`.trim(),
      mother_name: `${formData.mother_last_name_fr || ''} ${formData.mother_first_name_fr || ''}`.trim(),
      father_profession: formData.father_job,
      mother_profession: formData.mother_job,
      high_school: formData.high_school || formData.lycee || '',
      lycee: formData.high_school || formData.lycee || '',
      academy: formData.academy || formData.region || '',
      region: formData.academy || formData.region || '',
      delegation: formData.delegation || formData.province || '',
      province: formData.delegation || formData.province || '',
      bac_type: formData.bac_name || formData.bac_type || '',
      bac_serie: formData.bac_name || formData.bac_type || '',
      bac_series: formData.bac_name || formData.bac_type || '',
      full_name: `${first_name} ${last_name}`.trim(),
    };

    try {
      const res = await api.post('/public/update-candidate-dossier', payload);
      setSubmitting(false);
      toast.success('✅ Données enregistrées en direct dans PostgreSQL !');
      if (onSaved) {
        onSaved();
      }
    } catch (err: any) {
      setSubmitting(false);
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde dans PostgreSQL.';
      setErrorMsg(msg);
      toast.error(`❌ ${msg}`);
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
    <div data-testid="tafem-inscription-page" dir={isRTL ? 'rtl' : 'ltr'} className={cn("min-h-screen transition-colors duration-500 selection:bg-[#0f2863]/40 text-slate-900 dark:text-white bg-slate-50 dark:bg-[#030711]", t.font)}>

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
        <nav className="flex flex-wrap sm:flex-nowrap items-center justify-between px-4 sm:px-12 py-3 sm:py-6 border-b border-slate-200 dark:border-white/[0.06] gap-2">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-xl flex items-center justify-center shadow-lg p-1 group-hover:scale-105 transition-transform border border-slate-100 dark:border-none">
              <img src="/logo-encg.png" alt="ENCG Fès" className="w-full h-full object-contain"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div>
              <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">ENCG Fès</p>
              <p className="text-[8px] sm:text-[9px] text-slate-500 leading-tight tracking-wider uppercase hidden sm:block">École Nationale de Commerce</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Custom Glassmorphism Language Dropdown */}
            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((prev) => !prev)}
                className="flex items-center gap-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <span className="text-sm leading-none">{currentLangObj.flag}</span>
                <span className="hidden sm:inline">{currentLangObj.label}</span>
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
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 dark:text-slate-400 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shadow-xs cursor-pointer"
              title="Changer de thème"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              onClick={() => setShowTrackingModal(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg font-black text-xs hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{lang === 'ar' ? 'تتبع ملفي' : 'Suivre mon Dossier'}</span><span className="sm:hidden">Suivi</span>
            </button>

            <Link to="/login" className="hidden sm:flex text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors items-center gap-1.5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 hover:border-slate-300 dark:hover:border-white/25 shadow-xs">
              {t.alreadyRegistered} <ArrowRight className={cn("w-3.5 h-3.5", isRTL && "rotate-180")} />
            </Link>
          </div>
        </nav>

        {/* ── Main ── */}
        <main className="flex-1 flex flex-col items-center py-4 sm:py-10 px-3 sm:px-6 pb-32 sm:pb-12">

          <div className="text-center mb-6 sm:mb-10 max-w-2xl">
            <h1 className="text-2xl sm:text-5xl font-black tracking-tight mb-2 sm:mb-4">
              {editMode ? (
                isRTL ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0f2863] via-blue-600 to-[#09193d] font-serif">تحديث ملف التسجيل — ENCG Fès</span>
                ) : (
                  <>Modification du <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0f2863] via-blue-600 to-[#09193d]">Dossier</span></>
                )
              ) : isRTL ? (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0f2863] via-blue-600 to-[#09193d] font-serif">تسجيل الطالب — ENCG Fès</span>
              ) : (
                <>Inscription <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0f2863] via-blue-600 to-[#09193d]">Étudiante</span></>
              )}
            </h1>
            <p className={cn("text-slate-600 dark:text-slate-400 text-xs sm:text-lg leading-relaxed font-medium", isRTL && "font-serif text-sm sm:text-lg")}>
              {editMode
                ? (isRTL ? 'جميع بياناتك السابقة محفوظة ومكتوبة أوتوماتيكياً. تصفح الخطوات الـ 5 وعدل ما ترغب فيه قبل الحفظ.' : 'Toutes vos données enregistrées ont été conservées et pré-remplies. Parcourez les 5 étapes, modifiez si besoin, puis enregistrez la mise à jour.')
                : (isRTL ? 'أكمل الاستمارة في 5 خطوات بسيطة لتقديم ملفك الرسمي لمؤسسة ENCG فاس.' : 'Complétez le formulaire en 5 étapes simples pour soumettre votre dossier officiel à l\'ENCG Fès.')}
            </p>
          </div>


          {/* ── Mobile Step Bar (< sm screens) ── */}
          <div className="sm:hidden w-full max-w-xl mb-6 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-white">
              <span className="flex items-center gap-2 truncate">
                <span className="w-6 h-6 rounded-full bg-[#0f2863] text-white flex items-center justify-center text-[10px] shrink-0">
                  {step}
                </span>
                <span className="truncate">{isRTL ? STEPS[step - 1].labelAr : STEPS[step - 1].labelFr}</span>
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[10px] shrink-0 font-bold">
                Étape {step} / 5
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#0f2863] via-blue-600 to-indigo-600 rounded-full transition-all duration-500" 
                style={{ width: `${(step / 5) * 100}%` }} 
              />
            </div>
          </div>


          {/* ── Desktop Step Indicator (>= sm screens) ── */}
          <div className="hidden sm:block w-full max-w-5xl mb-10">
            <div className="relative flex items-start justify-between">
              <div className={cn("absolute top-6 h-[3px] bg-slate-200 dark:bg-white/10 rounded-full", isRTL ? "right-[calc(16%)] left-[calc(16%)]" : "left-[calc(16%)] right-[calc(16%)]")}>
                <div className={cn("h-full bg-gradient-to-r from-[#0f2863] via-blue-600 to-[#162e74] rounded-full transition-all duration-700 ease-out shadow-xs", isRTL ? "float-right" : "")} style={{ width: `${pct}%` }} />
              </div>

              {STEPS.map(({ id, labelFr, labelAr, subFr, subAr, icon: Icon }) => {
                const done_ = step > id;
                const active = step === id;
                const stepLabel = isRTL ? labelAr : labelFr;
                const stepSub = isRTL ? subAr : subFr;
                return (
                  <div key={id} className="flex flex-col items-center gap-2.5 w-1/5 z-10">

                    <div className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 text-base font-black cursor-pointer shadow-sm',
                      done_ ? 'bg-gradient-to-r from-[#0f2863] to-[#162e74] border-[#0f2863] text-white scale-110 shadow-lg shadow-[#0f2863]/30'
                        : active ? 'bg-white dark:bg-slate-900 border-[#0f2863] dark:border-blue-400 text-[#0f2863] dark:text-blue-400 scale-110 shadow-xl ring-4 ring-[#0f2863]/15'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/15 text-slate-400 dark:text-slate-600'
                    )}
                      onClick={() => {
                        if (ocrExtracting) {
                          toast.warning("⏳ Extraction IA en cours, veuillez patienter...");
                          return;
                        }
                        if (id < step || editMode) {
                          setStep(id);
                        } else if (id > step) {
                          let canAdvance = true;
                          for (let s = step; s < id; s++) {
                            if (!validateStep(s)) {
                              canAdvance = false;
                              break;
                            }
                          }
                          if (canAdvance) {
                            setStep(id);
                          }
                        }
                      }}
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
            <div className="w-full max-w-4xl mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          {/* ── Form Card ── */}
          <div className="w-full max-w-6xl xl:max-w-7xl">
            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] backdrop-blur-md shadow-2xl overflow-hidden transition-colors">

              <div className="h-1 bg-gradient-to-r from-[#0f2863]/0 via-[#0f2863] to-[#0f2863]/0" />

              <form onSubmit={onSubmit} className="p-4 sm:p-10 space-y-6">

                {/* ═══════════ STEP 1: DOCUMENTS & AI OCR ═══════════ */}
                {step === 1 && (
                  <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#0f2863]/10 dark:bg-blue-500/15 border border-[#0f2863]/20 dark:border-blue-400/20 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[#0f2863] dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className={cn("font-black text-slate-900 dark:text-white text-lg sm:text-xl tracking-tight", isRTL && "font-serif text-xl sm:text-2xl")}>
                            {isRTL ? '1. رفع الوثائق والاستخراج التلقائي (Gemini Vision AI)' : '1. Numérisation des Documents & Pre-remplissage IA'}
                          </h3>
                          <p className={cn("text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400", isRTL && "font-serif text-base")}>
                            {isRTL ? 'ارفع البكالوريا والبطاقة الوطنية لاستخراج 70% من بياناتك تلقائياً بالذكاء الاصطناعي' : "Téléversez vos scannés (PDF/Image) pour pré-remplir 70% de vos données automatiquement avec l'IA"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-[#0f2863] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-4 py-1.5 rounded-full border-2 border-blue-200 dark:border-blue-800 shadow-xs">
                        {isRTL ? 'الخطوة 1 من 5' : 'Étape 1 sur 5'}
                      </span>
                    </div>

                    {/* Live Extraction Loading / Ready Status Banner */}
                    {ocrExtracting ? (
                      <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl flex items-center justify-between gap-4 text-amber-900 dark:text-amber-300 animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                            <svg className="animate-spin w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                          </div>
                          <div>
                            <h5 className="font-black text-sm text-amber-900 dark:text-amber-200">
                              {isRTL ? 'جاري تحليل الوثيقة واستخراج البيانات بالذكاء الاصطناعي... ⏳' : 'Extraction & Analyse IA du document en cours... ⏳'}
                            </h5>
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                              {isRTL ? 'يرجى الانتظار، سيتم تفعيل زر "متابعة" فور انتهاء الاستخراج.' : 'Veuillez patienter, le bouton "Continuer" sera déverrouillé dès que le chargement sera terminé.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (Object.keys(uploadedFiles).length > 0) && (
                      <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-between gap-4 text-emerald-900 dark:emerald-300">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <h5 className="font-black text-sm text-emerald-900 dark:text-emerald-200">
                              {isRTL ? 'تم استخراج البيانات بنجاح! 🟢' : 'Données Extraintes & Prêtes ! 🟢'}
                            </h5>
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                              {isRTL ? 'تم استخراج البيانات وتعبئتها تلقائياً. يمكنك الآن الضغط على زر "متابعة" للمرور إلى الخطوة الموالية.' : 'Toutes les données ont été pré-remplies. Cliquez sur "Continuer" pour passer à l\'étape suivante.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <SectionCard title={isRTL ? '1. شهادة البكالوريا، بيان النقاط والبطاقة الوطنية (PDF/صورة)' : '1. Scans du Baccalauréat, Relevé de Notes & CNIE (PDF / Image Max 10Mo)'} icon={FileText} isRtl={isRTL}>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                        {/* ─── Card 1: Baccalauréat ─── */}
                        <div className="group relative flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                          <div className="h-1.5 bg-gradient-to-r from-[#0f2863] via-blue-600 to-indigo-500" />
                          <div className="flex flex-col flex-1 p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-[#0f2863]/10 dark:bg-blue-500/20 flex items-center justify-center">
                                  <GraduationCap className="w-4 h-4 text-[#0f2863] dark:text-blue-400" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-wide text-slate-800 dark:text-slate-100">Baccalauréat</span>
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 px-2 py-0.5 rounded-full">Obligatoire</span>
                            </div>

                            {((formData as any).bac_has_existing || formData.bac_pdf_name) && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/60 rounded-xl">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 truncate flex-1">{formData.bac_pdf_name || 'BAC_Enregistre.pdf'}</span>
                                <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-md uppercase shrink-0">DÉPOSÉ</span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const url = (formData as any).bac_file_url || `/api/public/serve-document/bac/${encodeURIComponent(formData.cne || formData.cin || '')}`;
                                const isImg = (formData as any).bac_is_image || /\.(jpg|jpeg|png|webp|gif)$/i.test(formData.bac_pdf_name || '');
                                setPdfPreviewModal({ title: `Baccalauréat Original — ${formData.bac_pdf_name || 'Document Scanné Enregistré'}`, url, isImage: isImg });
                              }}
                              className="w-full py-2.5 bg-[#0f2863] hover:bg-[#1a387e] active:scale-[0.98] text-white rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isRTL ? 'معاينة الوثيقة' : "Voir l'Aperçu Document"}</span>
                            </button>
                          </div>

                          <div className="px-4 pb-4">
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">{isRTL ? 'استبدال الوثيقة (اختياري)' : 'Remplacer le scan (Optionnel)'}</label>
                            <label className="group/upload flex items-center gap-2.5 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 hover:border-[#0f2863] dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 rounded-xl transition-all cursor-pointer">
                              <UploadCloud className="w-4 h-4 text-slate-400 group-hover/upload:text-[#0f2863] dark:group-hover/upload:text-blue-400 transition-colors shrink-0" />
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover/upload:text-[#0f2863] dark:group-hover/upload:text-blue-400 transition-colors truncate">{isRTL ? 'اختر ملف PDF فقط' : 'Choisir un fichier PDF (.pdf)'}</span>
                              <input type="file" accept=".pdf" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (!file.name.toLowerCase().endsWith('.pdf')) {
                                    toast.error('❌ Seuls les fichiers scannés au format PDF (.pdf) sont autorisés.');
                                    return;
                                  }
                                  const objectUrl = URL.createObjectURL(file);
                                  setFormData(prev => ({ ...prev, bac_pdf_name: file.name, bac_file_url: objectUrl, bac_is_image: false, bac_has_existing: true }));
                                  handleOcrDocumentUpload('bac', file);
                                }
                              }} />
                            </label>
                          </div>
                        </div>

                        {/* ─── Card 2: CNIE ─── */}
                        <div className="group relative flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                          <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-600" />
                          <div className="flex flex-col flex-1 p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
                                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-wide text-slate-800 dark:text-slate-100">CNIE Recto-Verso</span>
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 px-2 py-0.5 rounded-full">Obligatoire</span>
                            </div>

                            {((formData as any).cnie_has_existing || formData.cnie_pdf_name) && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/60 rounded-xl">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 truncate flex-1">{formData.cnie_pdf_name || 'CNIE_Enregistree.pdf'}</span>
                                <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-md uppercase shrink-0">DÉPOSÉ</span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const url = (formData as any).cnie_file_url || `/api/public/serve-document/cnie/${encodeURIComponent(formData.cne || formData.cin || '')}`;
                                const isImg = (formData as any).cnie_is_image || /\.(jpg|jpeg|png|webp|gif)$/i.test(formData.cnie_pdf_name || '');
                                setPdfPreviewModal({ title: `Carte d'Identité Nationale (CNIE) — ${formData.cnie_pdf_name || 'Document Scanné Enregistré'}`, url, isImage: isImg });
                              }}
                              className="w-full py-2.5 bg-[#0f2863] hover:bg-[#1a387e] active:scale-[0.98] text-white rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isRTL ? 'معاينة الوثيقة' : "Voir l'Aperçu Document"}</span>
                            </button>
                          </div>

                          <div className="px-4 pb-4">
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">{isRTL ? 'استبدال الوثيقة (اختياري)' : 'Remplacer le scan (Optionnel)'}</label>
                            <label className="group/upload flex items-center gap-2.5 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 hover:border-[#0f2863] dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 rounded-xl transition-all cursor-pointer">
                              <UploadCloud className="w-4 h-4 text-slate-400 group-hover/upload:text-[#0f2863] dark:group-hover/upload:text-blue-400 transition-colors shrink-0" />
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover/upload:text-[#0f2863] dark:group-hover/upload:text-blue-400 transition-colors truncate">{isRTL ? 'اختر ملف PDF فقط' : 'Choisir un fichier PDF (.pdf)'}</span>
                              <input type="file" accept=".pdf" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (!file.name.toLowerCase().endsWith('.pdf')) {
                                    toast.error('❌ Seuls les fichiers scannés au format PDF (.pdf) sont autorisés.');
                                    return;
                                  }
                                  const objectUrl = URL.createObjectURL(file);
                                  setFormData(prev => ({ ...prev, cnie_pdf_name: file.name, cnie_file_url: objectUrl, cnie_is_image: false, cnie_has_existing: true }));
                                  handleOcrDocumentUpload('cnie', file);
                                }
                              }} />
                            </label>
                          </div>
                        </div>

                        {/* ─── Card 3: Relevé de Notes ─── */}
                        <div className="group relative flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                          <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500" />
                          <div className="flex flex-col flex-1 p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-wide text-slate-800 dark:text-slate-100">Relevé de Notes</span>
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 px-2 py-0.5 rounded-full">Obligatoire</span>
                            </div>

                            {((formData as any).releve_notes_has_existing || formData.releve_notes_pdf_name) && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/60 rounded-xl">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 truncate flex-1">{formData.releve_notes_pdf_name || 'RELEVE_Enregistre.pdf'}</span>
                                <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-md uppercase shrink-0">DÉPOSÉ</span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const url = (formData as any).releve_notes_file_url || `/api/public/serve-document/releve_notes/${encodeURIComponent(formData.cne || formData.cin || '')}`;
                                const isImg = (formData as any).releve_notes_is_image || /\.(jpg|jpeg|png|webp|gif)$/i.test(formData.releve_notes_pdf_name || '');
                                setPdfPreviewModal({ title: `Relevé de Notes du Baccalauréat — ${formData.releve_notes_pdf_name || 'Document Scanné Enregistré'}`, url, isImage: isImg });
                              }}
                              className="w-full py-2.5 bg-[#0f2863] hover:bg-[#1a387e] active:scale-[0.98] text-white rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isRTL ? 'معاينة الوثيقة' : "Voir l'Aperçu Document"}</span>
                            </button>
                          </div>

                          <div className="px-4 pb-4">
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">{isRTL ? 'استبدال الوثيقة (اختياري)' : 'Remplacer le scan (Optionnel)'}</label>
                            <label className="group/upload flex items-center gap-2.5 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 hover:border-[#0f2863] dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 rounded-xl transition-all cursor-pointer">
                              <UploadCloud className="w-4 h-4 text-slate-400 group-hover/upload:text-[#0f2863] dark:group-hover/upload:text-blue-400 transition-colors shrink-0" />
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover/upload:text-[#0f2863] dark:group-hover/upload:text-blue-400 transition-colors truncate">{isRTL ? 'اختر ملف PDF فقط' : 'Choisir un fichier PDF (.pdf)'}</span>
                              <input type="file" accept=".pdf" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (!file.name.toLowerCase().endsWith('.pdf')) {
                                    toast.error('❌ Seuls les fichiers scannés au format PDF (.pdf) sont autorisés.');
                                    return;
                                  }
                                  const objectUrl = URL.createObjectURL(file);
                                  setFormData(prev => ({ ...prev, releve_notes_pdf_name: file.name, releve_notes_file_url: objectUrl, releve_notes_is_image: false, releve_notes_has_existing: true }));
                                  handleOcrDocumentUpload('releve_notes', file);
                                }
                              }} />
                            </label>
                          </div>
                        </div>

                      </div>
                    </SectionCard>

                    <SectionCard title={isRTL ? '2. الصورة الشخصية الرسمية (35 × 45 مم)' : '2. Photo d\'Identité Officielle pour Carte Étudiant (35 × 45 mm)'} icon={ImageIcon} isRtl={isRTL}>
                      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="w-24 h-32 bg-slate-900 border-2 border-indigo-500/50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                          {formData.photo_url ? (
                            <img src={formData.photo_url} alt="Photo" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-10 h-10 text-slate-600" />
                          )}
                        </div>
                        <div className="space-y-3 text-center sm:text-left flex-1">
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                            Format obligatoire pour la carte étudiant biométrique Evolis CR80. Fond clair, visage bien dégagé.
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    setFormData(prev => ({ ...prev, photo_url: evt.target?.result as string }));
                                  };
                                  reader.readAsDataURL(file);
                                  setShowPhotoModal(true);

                                  const cneToUse = formData.cne || (user as any)?.cne || '';
                                  const cinToUse = formData.cin || (user as any)?.cin || '';
                                  if (cneToUse || cinToUse) {
                                    const saveData = new FormData();
                                    saveData.append('file', file);
                                    saveData.append('type', 'photo');
                                    saveData.append('cne', cneToUse);
                                    saveData.append('cin', cinToUse);
                                    api.post('/public/upload-candidate-document', saveData, {
                                      headers: { 'Content-Type': 'multipart/form-data' }
                                    }).catch(() => {});
                                  }
                                }
                              }}
                              className="hidden"
                              id="photo-upload-input-step1"
                            />
                            <label htmlFor="photo-upload-input-step1" className="px-4 py-2 bg-[#0f2863] text-white rounded-xl font-extrabold text-xs cursor-pointer hover:opacity-90">
                              📷 Choisir une photo
                            </label>
                            {formData.photo_url && (
                              <button
                                type="button"
                                onClick={() => setShowPhotoModal(true)}
                                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs hover:bg-indigo-100"
                              >
                                <Scissors className="w-3.5 h-3.5 inline mr-1" /> Ajuster le Cadrage 35x45mm
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </SectionCard>

                    {/* CNDP Legal Consent Checkbox */}
                    <div className="p-4 sm:p-5 bg-[#0f2863]/5 dark:bg-blue-500/10 border-2 border-[#0f2863]/20 dark:border-blue-400/30 rounded-2xl flex items-start gap-3 mt-4">
                      <input
                        type="checkbox"
                        id="cndp-consent-checkbox-step1"
                        checked={cndpConsent}
                        onChange={(e) => {
                          setCndpConsent(e.target.checked);
                          if (e.target.checked) setErrorMsg(null);
                        }}
                        className="w-5 h-5 mt-0.5 rounded-lg text-[#0f2863] focus:ring-[#0f2863] cursor-pointer shrink-0"
                      />
                      <label htmlFor="cndp-consent-checkbox-step1" className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer leading-relaxed">
                        {isRTL ? (
                          <>
                            أوافق على معالجة البيانات الشخصية وفقاً للقانون 09-08 (CNDP).{' '}
                            <button
                              type="button"
                              onClick={() => setShowCndpModal(true)}
                              className="text-[#0f2863] dark:text-blue-400 underline font-black hover:opacity-80"
                            >
                              قراءة الشروط والأحكام
                            </button>
                          </>
                        ) : (
                          <>
                            J'accepte le traitement de mes données personnelles conformément à la loi 09-08 (CNDP).{' '}
                            <button
                              type="button"
                              onClick={() => setShowCndpModal(true)}
                              className="text-[#0f2863] dark:text-blue-400 underline font-black hover:opacity-80"
                            >
                              Lire les mentions CNDP
                            </button>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* ═══════════ STEP 2: IDENTITÉ & COMPTE ═══════════ */}
                {step === 2 && (
                  <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#0f2863]/10 dark:bg-blue-500/15 border border-[#0f2863]/20 dark:border-blue-400/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-[#0f2863] dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className={cn("font-black text-slate-900 dark:text-white text-lg sm:text-xl tracking-tight", isRTL && "font-serif text-xl sm:text-2xl")}>
                            {isRTL ? 'معلومات الهوية والحساب (مستخرجة بالذكاء الاصطناعي)' : 'Informations Personnelles & Identité (Pré-remplies par l\'IA)'}
                          </h3>
                          <p className={cn("text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400", isRTL && "font-serif text-base")}>
                            {isRTL ? 'تحقق من المعلومات المستخرجة تلقائياً من الوثائق وعدلها إن دعت الحاجة' : "Vérifiez et complétez les informations d'identité extraites de vos documents"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-[#0f2863] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-4 py-1.5 rounded-full border-2 border-blue-200 dark:border-blue-800 shadow-xs">
                        {isRTL ? 'الخطوة 2 من 5' : 'Étape 2 sur 5'}
                      </span>
                    </div>

                    {/* Gemini AI OCR Extraction Success Badge Banner */}
                    <div className="p-4 bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-[#0f2863] rounded-2xl text-white shadow-lg flex items-center justify-between border border-emerald-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 shrink-0 font-bold">
                          ✨
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-emerald-300 uppercase tracking-wide">
                            {isRTL ? 'بيانات مستخرجة بالذكاء الاصطناعي بنسبة 70%' : 'Champs pré-remplis à 70% par Gemini 1.5 Flash Vision AI'}
                          </h4>
                          <p className="text-xs text-emerald-100 font-medium">
                            {isRTL ? 'تم ملء الحقول تلقائياً من الوثائق المرفوعة. يمكنك مراجعتها وتعديلها عند الحاجة.' : 'Les données ci-dessous ont été extraites automatiquement de vos documents. Vous pouvez les vérifier et les modifier si nécessaire.'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase px-3 py-1 bg-emerald-500/20 text-emerald-200 rounded-full border border-emerald-400/40">
                        OCR Actif
                      </span>
                    </div>

                    {/* Section 1: Identifiants Principaux */}
                    <SectionCard title={isRTL ? '1. معرفات الترشيح والحساب الرسمية' : '1. Identifiants de Candidature & Compte (Anti-Fraude Check)'} icon={Hash} isRtl={isRTL}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={Hash} label={isRTL ? 'رمز مسار (CNE) *' : 'CNE (Code Massar) *'} required type="text" name="cne" value={formData.cne} onChange={handleChange} readOnly={editMode || !!ocrExtractedFields.cne} onUnlock={() => toggleFieldLock('cne')} placeholder={isRTL ? "مثال: N123456789" : "Ex: N123456789"} isRtl={isRTL} />
                        <Field icon={Hash} label={isRTL ? 'بطاقة التعريف الوطنية (CNIE) *' : "CNIE (Carte d'Identité) *"} required type="text" name="cin" value={formData.cin} onChange={handleChange} readOnly={editMode || !!ocrExtractedFields.cin} onUnlock={() => toggleFieldLock('cin')} placeholder={isRTL ? "مثال: CD123456" : "Ex: CD123456"} isRtl={isRTL} />
                        <Field icon={Mail} label={isRTL ? 'البريد الإلكتروني *' : 'Adresse E-mail *'} required type="email" name="email" value={formData.email} onChange={handleChange} readOnly={editMode} placeholder={isRTL ? "مثال: etudiant@gmail.com" : "Ex: etudiant@gmail.com"} isRtl={isRTL} />
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
                        <Field icon={User} label={isRTL ? 'النسب بالفرنسية *' : 'Nom (FR) *'} required type="text" name="last_name_fr" value={formData.last_name_fr} onChange={handleChange} readOnly={!!ocrExtractedFields.last_name_fr} onUnlock={() => toggleFieldLock('last_name_fr')} placeholder={isRTL ? "مثال: BENNANI" : "Ex: BENNANI"} isRtl={isRTL} />
                        <Field icon={User} label={isRTL ? 'الاسم الشخصي بالفرنسية *' : 'Prénom (FR) *'} required type="text" name="first_name_fr" value={formData.first_name_fr} onChange={handleChange} readOnly={!!ocrExtractedFields.first_name_fr} onUnlock={() => toggleFieldLock('first_name_fr')} placeholder={isRTL ? "مثال: Youssef" : "Ex: Youssef"} isRtl={isRTL} />

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
                            <input type="text" dir="rtl" name="last_name_ar" value={formData.last_name_ar} onChange={handleChange} placeholder={isRTL ? "مثال: بناني" : "بناني"} className={cn("w-full rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs transition-all", formData.last_name_ar ? "bg-slate-100 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-inner" : "bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 text-slate-900 dark:text-white")} />
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
                            <input type="text" dir="rtl" name="first_name_ar" value={formData.first_name_ar} onChange={handleChange} placeholder={isRTL ? "مثال: يوسف" : "يوسف"} className={cn("w-full rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs transition-all", formData.first_name_ar ? "bg-slate-100 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-inner" : "bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 text-slate-900 dark:text-white")} />
                          </div>
                        </div>
                      </div>
                    </SectionCard>

                    {/* Section 3: Naissance & État Civil */}
                    <SectionCard title={isRTL ? '3. الولادة والحالة المدنية' : '3. Naissance & État Civil'} icon={Calendar} isRtl={isRTL}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={Calendar} label={isRTL ? 'تاريخ الازدياد *' : 'Date de naissance *'} required type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} readOnly={!!ocrExtractedFields.birth_date} onUnlock={() => toggleFieldLock('birth_date')} isRtl={isRTL} />

                        <Field icon={User} label={isRTL ? 'الجنس *' : 'Sexe *'} required as="select" name="gender" value={formData.gender} onChange={handleChange} isRtl={isRTL}>
                          <option value="female">{isRTL ? 'أنثى' : 'Féminin'}</option>
                          <option value="male">{isRTL ? 'ذكر' : 'Masculin'}</option>
                        </Field>

                        <Field icon={MapPin} label={isRTL ? 'مكان الازدياد بالفرنسية *' : 'Lieu de naissance (FR) *'} required type="text" name="birth_city_fr" value={formData.birth_city_fr} onChange={handleChange} readOnly={!!ocrExtractedFields.birth_city_fr} onUnlock={() => toggleFieldLock('birth_city_fr')} placeholder="FES" isRtl={isRTL} />

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
                          <input type="text" dir="rtl" name="birth_city_ar" value={formData.birth_city_ar} onChange={handleChange} placeholder="فاس" className={cn("w-full rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs transition-all", formData.birth_city_ar ? "bg-slate-100 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-inner" : "bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 text-slate-900 dark:text-white")} />
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
                          <input type="text" name="address_fr" value={formData.address_fr} onChange={handleChange} placeholder={isRTL ? "22AV MLY RACHID RCE JAWHARA APPT8 BOURAMANA VN FES" : "Ex: 22 Av. Moulay Rachid, Res. Jawhara, Appt 8, Fès"} className={cn("w-full rounded-2xl px-4 py-3.5 text-base font-semibold outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs transition-all", formData.address_fr ? "bg-slate-100 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-inner" : "bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 text-slate-900 dark:text-white")} />
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
                          <input type="text" dir="rtl" name="address_ar" value={formData.address_ar} onChange={handleChange} placeholder="22 شارع مولاي رشيد إقامة جوهرة شقة 8 بورمانة فاس" className={cn("w-full rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs transition-all", formData.address_ar ? "bg-slate-100 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-inner" : "bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 text-slate-900 dark:text-white")} />
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
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#0f2863] focus:ring-[#0f2863] accent-[#0f2863] mt-0.5 cursor-pointer flex-shrink-0"
                      />
                      <label htmlFor="cndp_consent" className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer select-none">
                        {lang === 'ar' ? (
                          <>
                            أوافق على معالجة معطياتي الشخصية من طرف المؤسسة لأغراض إدارية وبيداغوجية، وذلك طبقاً لمقتضيات <strong>القانون رقم 09-08</strong>.
                            <button type="button" onClick={() => setShowCndpModal(true)} className="text-[#0f2863] dark:text-blue-400 hover:underline font-bold ms-1">لمعرفة المزيد</button>
                          </>
                        ) : (
                          <>
                            J'accepte le traitement de mes données personnelles par l'ENCG Fès dans le cadre de la gestion administrative et pédagogique de ma scolarité, conformément à la <strong>loi n° 09-08</strong> de la CNDP.
                            <button type="button" onClick={() => setShowCndpModal(true)} className="text-[#0f2863] dark:text-blue-400 hover:underline font-bold ms-1">En savoir plus</button>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* ═══════════ STEP 3: PARENTS & URGENCE ═══════════ */}
                {step === 3 && (
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
                        {isRTL ? 'الخطوة 3 من 5' : 'Étape 3 sur 5'}
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
                          <input type="text" dir="rtl" name="father_last_name_ar" value={formData.father_last_name_ar} onChange={handleChange} placeholder={isRTL ? "مثال: بناني" : "بناني"} className={cn("w-full rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs transition-all", formData.father_last_name_ar ? "bg-slate-100 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" : "bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 text-slate-900 dark:text-white")} />
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
                          <input type="text" dir="rtl" name="father_first_name_ar" value={formData.father_first_name_ar} onChange={handleChange} placeholder={isRTL ? "مثال: محمد" : "محمد"} className={cn("w-full rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs transition-all", formData.father_first_name_ar ? "bg-slate-100 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" : "bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 text-slate-900 dark:text-white")} />
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
                          <input type="text" dir="rtl" name="mother_last_name_ar" value={formData.mother_last_name_ar} onChange={handleChange} placeholder={isRTL ? "مثال: الساطوري" : "الساطوري"} className={cn("w-full rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs transition-all", formData.mother_last_name_ar ? "bg-slate-100 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" : "bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 text-slate-900 dark:text-white")} />
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
                          <input type="text" dir="rtl" name="mother_first_name_ar" value={formData.mother_first_name_ar} onChange={handleChange} placeholder={isRTL ? "مثال: بثينة" : "بثينة"} className={cn("w-full rounded-2xl px-4 py-3.5 text-base sm:text-lg font-serif font-bold outline-none focus:ring-4 focus:ring-[#0f2863]/15 shadow-xs transition-all", formData.mother_first_name_ar ? "bg-slate-100 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" : "bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/15 text-slate-900 dark:text-white")} />
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

                {/* ═══════════ STEP 4: PARCOURS ACADÉMIQUE ═══════════ */}
                {step === 4 && (
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
                        {isRTL ? 'الخطوة 4 من 5' : 'Étape 4 sur 5'}
                      </span>
                    </div>


                    <SectionCard title={isRTL ? 'معلومات شهادة البكالوريا والمؤسسة' : 'Informations du Baccalauréat & Établissement'} icon={BookOpen} isRtl={isRTL}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={BookOpen} label={isRTL ? 'شعبة البكالوريا *' : 'Série du Baccalauréat *'} required as="select" name="bac_name" value={formData.bac_name} onChange={handleChange} isRtl={isRTL}>
                          <option value="Bac Sciences Économiques">{isRTL ? 'علوم اقتصادية' : 'Bac Sciences Économiques'}</option>
                          <option value="Sciences Économiques">{isRTL ? 'علوم اقتصادية' : 'Sciences Économiques'}</option>
                          <option value="Bac Sciences Mathématiques B - Option Français">{isRTL ? 'علوم رياضية "ب" - خيار فرنسية' : 'Bac Sciences Mathématiques B - Option Français'}</option>
                          <option value="Bac Sciences Mathématiques A - Option Français">{isRTL ? 'علوم رياضية "أ" - خيار فرنسية' : 'Bac Sciences Mathématiques A - Option Français'}</option>
                          <option value="Sciences Mathématiques">{isRTL ? 'علوم رياضية' : 'Sciences Mathématiques'}</option>
                          <option value="Bac Physique-Chimie (PC)">{isRTL ? 'علوم فيزيائية' : 'Bac Physique-Chimie (PC)'}</option>
                          <option value="Sciences Physiques">{isRTL ? 'علوم فيزيائية' : 'Sciences Physiques'}</option>
                          <option value="Bac Sciences de la Vie et de la Terre (SVT)">{isRTL ? 'علوم الحياة والأرض' : 'Bac Sciences de la Vie et de la Terre (SVT)'}</option>
                          <option value="Sciences de la Vie et de la Terre">{isRTL ? 'علوم الحياة والأرض' : 'Sciences de la Vie et de la Terre'}</option>
                          <option value="Bac Techniques de Gestion et Comptabilité (TGC)">{isRTL ? 'علوم التدبير المحاسباتي' : 'Bac Techniques de Gestion et Comptabilité (TGC)'}</option>
                        </Field>

                        <Field icon={Star} label={isRTL ? 'الميزة في البكالوريا *' : 'Mention au Bac *'} required as="select" name="bac_mention" value={formData.bac_mention} onChange={handleChange} isRtl={isRTL}>
                          <option value="Très Bien">{isRTL ? 'حسن جداً  ≥ 16.00' : 'Très Bien (≥ 16.00)'}</option>
                          <option value="Bien">{isRTL ? 'حسن  14.00 – 15.99' : 'Bien (14.00 – 15.99)'}</option>
                          <option value="Assez Bien">{isRTL ? 'مستحسن  12.00 – 13.99' : 'Assez Bien (12.00 – 13.99)'}</option>
                          <option value="Passable">{isRTL ? 'مقبول  10.00 – 11.99' : 'Passable (10.00 – 11.99)'}</option>
                        </Field>

                        <Field icon={Star} label={isRTL ? 'المعدل العام للبكالوريا *' : 'Moyenne générale du Bac *'} required type="number" step="0.01" name="bac_average" value={formData.bac_average} onChange={handleChange} readOnly={editMode ? false : !!ocrExtractedFields.bac_average} onUnlock={() => toggleFieldLock('bac_average')} placeholder={isRTL ? "مثال: 16.00" : "Ex: 16.00"} isRtl={isRTL} />

                        <Field icon={Calendar} label={isRTL ? 'سنة الحصول على البكالوريا *' : "Année d'obtention du Bac *"} required as="select" name="bac_year" value={formData.bac_year} onChange={handleChange} isRtl={isRTL}>
                          <option value="2026">2026</option>
                          <option value="2025">2025</option>
                          <option value="2024">2024</option>
                        </Field>

                        <Field icon={Building2} label={isRTL ? 'اسم الثانوية / المؤسسة *' : 'Lycée / Établissement *'} required type="text" name="high_school" value={formData.high_school} onChange={handleChange} readOnly={editMode ? false : !!ocrExtractedFields.high_school} onUnlock={() => toggleFieldLock('high_school')} placeholder={isRTL ? "مثال: ثانوية مولاي إدريس" : "Ex: Lycée Moulay Idriss"} className="sm:col-span-2" isRtl={isRTL} />

                        <Field icon={Building2} label={isRTL ? 'الأكاديمية الجهوية *' : 'Académie Régionale *'} required as="select" name="academy" value={formData.academy} onChange={handleChange} isRtl={isRTL}>
                          <option value="ACADEMIE L'Oriental">{isRTL ? 'أكاديمية الشرق' : "ACADÉMIE L'Oriental"}</option>
                          <option value="ACADEMIE Fès-Meknès">{isRTL ? 'أكاديمية فاس - مكناس' : 'ACADÉMIE Fès-Meknès'}</option>
                          <option value="ACADEMIE Rabat-Salé-Kénitra">{isRTL ? 'أكاديمية الرباط - سلا - القنيطرة' : 'ACADÉMIE Rabat-Salé-Kénitra'}</option>
                          <option value="ACADEMIE Casablanca-Settat">{isRTL ? 'أكاديمية الدار البيضاء - سطات' : 'ACADÉMIE Casablanca-Settat'}</option>
                          <option value="ACADEMIE Tanger-Tétouan-Al Hoceïma">{isRTL ? 'أكاديمية طنجة - تطوان - الحسيمة' : 'ACADÉMIE Tanger-Tétouan-Al Hoceïma'}</option>
                          <option value="ACADEMIE Marrakech-Safi">{isRTL ? 'أكاديمية مراكش - آسفي' : 'ACADÉMIE Marrakech-Safi'}</option>
                          <option value="ACADEMIE Souss-Massa">{isRTL ? 'أكاديمية سوس - ماسة' : 'ACADÉMIE Souss-Massa'}</option>
                          <option value="ACADEMIE Béni Mellal-Khénifra">{isRTL ? 'أكاديمية بني ملال - خنيفرة' : 'ACADÉMIE Béni Mellal-Khénifra'}</option>
                          <option value="ACADEMIE Drâa-Tafilalet">{isRTL ? 'أكاديمية درعة - تافيلالت' : 'ACADÉMIE Drâa-Tafilalet'}</option>
                          <option value="ACADEMIE Guelmim-Oued Noun">{isRTL ? 'أكاديمية كلميم - واد نون' : 'ACADÉMIE Guelmim-Oued Noun'}</option>
                          <option value="ACADEMIE Laâyoune-Sakia El Hamra">{isRTL ? 'أكاديمية العيون - الساقية الحمراء' : 'ACADÉMIE Laâyoune-Sakia El Hamra'}</option>
                          <option value="ACADEMIE Dakhla-Oued Ed-Dahab">{isRTL ? 'أكاديمية الداخلة - وادي الذهب' : 'ACADÉMIE Dakhla-Oued Ed-Dahab'}</option>
                        </Field>

                        <Field icon={MapPin} label={isRTL ? 'المديرية الإقليمية *' : 'Délégation *'} required as="select" name="delegation" value={formData.delegation} onChange={handleChange} isRtl={isRTL}>
                          <option value="Guercif">{isRTL ? 'جرسيف' : 'Guercif'}</option>
                          <option value="Oujda-Angad">{isRTL ? 'وجدة أنكاد' : 'Oujda-Angad'}</option>
                          <option value="Nador">{isRTL ? 'الناظور' : 'Nador'}</option>
                          <option value="Berkane">{isRTL ? 'بركان' : 'Berkane'}</option>
                          <option value="Taourirt">{isRTL ? 'تاوريرت' : 'Taourirt'}</option>
                          <option value="Driouch">{isRTL ? 'الدريوش' : 'Driouch'}</option>
                          <option value="Jerada">{isRTL ? 'جرادة' : 'Jerada'}</option>
                          <option value="Figuig">{isRTL ? 'فكيك' : 'Figuig'}</option>
                          <option value="Fès">{isRTL ? 'فاس' : 'Fès'}</option>
                          <option value="Meknès">{isRTL ? 'مكناس' : 'Meknès'}</option>
                          <option value="Sefrou">{isRTL ? 'صفرو' : 'Sefrou'}</option>
                          <option value="Taounate">{isRTL ? 'تاونات' : 'Taounate'}</option>
                          <option value="Taza">{isRTL ? 'تازة' : 'Taza'}</option>
                          <option value="Ifrane">{isRTL ? 'إفران' : 'Ifrane'}</option>
                          <option value="El Hajeb">{isRTL ? 'الحاجب' : 'El Hajeb'}</option>
                          <option value="Boulemane">{isRTL ? 'بولمان' : 'Boulemane'}</option>
                          <option value="Rabat">{isRTL ? 'الرباط' : 'Rabat'}</option>
                          <option value="Salé">{isRTL ? 'سلا' : 'Salé'}</option>
                          <option value="Kénitra">{isRTL ? 'القنيطرة' : 'Kénitra'}</option>
                          <option value="Casablanca">{isRTL ? 'الدار البيضاء' : 'Casablanca'}</option>
                          <option value="Settat">{isRTL ? 'سطات' : 'Settat'}</option>
                          <option value="Tanger">{isRTL ? 'طنجة' : 'Tanger'}</option>
                          <option value="Tétouan">{isRTL ? 'تطوان' : 'Tétouan'}</option>
                          <option value="Marrakech">{isRTL ? 'مراكش' : 'Marrakech'}</option>
                          <option value="Agadir">{isRTL ? 'أكادير' : 'Agadir'}</option>
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


                {/* ═══════════ STEP 5: RÉCAPITULATIF & CONFIRMATION ═══════════ */}
                {step === 5 && (
                  <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <h3 className={cn("font-black text-slate-900 dark:text-white text-lg sm:text-xl tracking-tight", isRTL && "font-serif text-xl sm:text-2xl")}>
                            {isRTL ? 'ملخص الترشيح والتأكيد النهائي' : 'Récapitulatif & Confirmation Finale du Dossier'}
                          </h3>
                          <p className={cn("text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400", isRTL && "font-serif text-base")}>
                            {isRTL ? 'راجع جميع بياناتك بعناية قبل الضغط على زر الإرسال النهائي' : 'Vérifiez l\'ensemble des informations renseignées avant la soumission définitive'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-4 py-1.5 rounded-full border-2 border-emerald-200 dark:border-emerald-800 shadow-xs">
                        {isRTL ? 'الخطوة 5 من 5' : 'Étape 5 sur 5'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Summary Card 1: Identité */}
                      <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                            <User className="w-4 h-4" /> <span>Identité & Compte</span>
                          </h4>
                          <button type="button" onClick={() => setStep(1)} className="text-[11px] font-bold text-blue-600 hover:underline">Modifier</button>
                        </div>
                        <div className="space-y-2 text-xs font-bold divide-y divide-slate-200/60 dark:divide-slate-800">
                          <div className="pt-1 flex justify-between"><span className="text-slate-500">Nom & Prénom FR :</span><span>{formData.last_name_fr} {formData.first_name_fr}</span></div>
                          <div className="pt-1 flex justify-between"><span className="text-slate-500">Nom & Prénom AR :</span><span className="font-serif">{formData.last_name_ar} {formData.first_name_ar}</span></div>
                          <div className="pt-1 flex justify-between"><span className="text-slate-500">CNE (Massar) :</span><span className="font-mono text-indigo-600">{formData.cne || 'Non renseigné'}</span></div>
                          <div className="pt-1 flex justify-between"><span className="text-slate-500">CNIE :</span><span className="font-mono">{formData.cin || 'Non renseigné'}</span></div>
                          <div className="pt-1 flex justify-between"><span className="text-slate-500">Email :</span><span>{formData.email}</span></div>
                          <div className="pt-1 flex justify-between"><span className="text-slate-500">Téléphone :</span><span>{formData.phone}</span></div>
                          <div className="pt-1 flex justify-between"><span className="text-slate-500">Date & Lieu de Naissance :</span><span>{formData.birth_date} à {formData.birth_city_fr}</span></div>
                        </div>
                      </div>

                      {/* Summary Card 2: Parents */}
                      <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            <Users className="w-4 h-4" /> <span>Parents & Tuteurs</span>
                          </h4>
                          <button type="button" onClick={() => setStep(2)} className="text-[11px] font-bold text-blue-600 hover:underline">Modifier</button>
                        </div>
                        <div className="space-y-2 text-xs font-bold divide-y divide-slate-200/60 dark:divide-slate-800">
                          <div className="pt-1 flex justify-between"><span className="text-slate-500">Père :</span><span>{formData.father_last_name_fr} {formData.father_first_name_fr}</span></div>
                          <div className="pt-1 flex justify-between"><span className="text-slate-500">CNIE Père :</span><span className="font-mono">{formData.father_cin}</span></div>
                          <div className="pt-1 flex justify-between"><span className="text-slate-500">Profession Père :</span><span>{formData.father_job}</span></div>
                          <div className="pt-1 flex justify-between"><span className="text-slate-500">Mère :</span><span>{formData.mother_last_name_fr} {formData.mother_first_name_fr}</span></div>
                          <div className="pt-1 flex justify-between"><span className="text-slate-500">CNIE Mère :</span><span className="font-mono">{formData.mother_cin}</span></div>
                          <div className="pt-1 flex justify-between"><span className="text-slate-500">Tél. Parent / Urgence :</span><span className="font-mono">{formData.parent_phone}</span></div>
                        </div>
                      </div>

                      {/* Summary Card 3: Académique */}
                      <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 md:col-span-2">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" /> <span>Parcours Académique & Filière Sélectionnée</span>
                          </h4>
                          <button type="button" onClick={() => setStep(3)} className="text-[11px] font-bold text-blue-600 hover:underline">Modifier</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                          <div><span className="text-slate-500 block text-[10px] uppercase">Baccalauréat</span><span>{formData.bac_name}</span></div>
                          <div><span className="text-slate-500 block text-[10px] uppercase">Moyenne Générale</span><span className="text-emerald-600 font-extrabold text-sm">{formData.bac_average ? `${formData.bac_average} / 20` : 'Non renseignée'} ({formData.bac_mention})</span></div>
                          <div><span className="text-slate-500 block text-[10px] uppercase">Filière Affectée</span><span className="text-indigo-600 font-black">{formData.filiere}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* ─── Certification Banner ─── */}
                    <div className="relative overflow-hidden rounded-2xl border border-[#0f2863]/20 dark:border-blue-700/30 bg-gradient-to-br from-[#0f2863]/[0.04] to-blue-50/60 dark:from-[#0f2863]/20 dark:to-blue-950/30">
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#0f2863] to-indigo-500 rounded-l-2xl" />
                      <div className="px-5 py-4 pl-6 flex items-start gap-4">
                        <div className="w-9 h-9 rounded-xl bg-[#0f2863]/10 dark:bg-blue-500/20 border border-[#0f2863]/20 dark:border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Shield className="w-4.5 h-4.5 text-[#0f2863] dark:text-blue-400" />
                        </div>
                        <p className={cn("text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed", isRTL && "font-serif text-sm text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
                          {isRTL
                            ? <> بالنقر على زر الإرسال أدناه، تُقرّ على شرفك بصحة جميع المعلومات المُقدَّمة. سيُحال ملفك فوراً إلى مصلحة الشؤون الطلابية بـ ENCG فاس. </>
                            : <> En cliquant sur le bouton ci-dessous, vous certifiez sur l'honneur l'exactitude des renseignements fournis. Votre dossier sera immédiatement transmis au service scolarité de l'ENCG Fès. </>
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Navigation ── */}
                <div className="flex items-center justify-between gap-2 mt-8 pt-6 border-t border-slate-200 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={goPrev}
                    className={cn(
                      'flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-base border transition-all cursor-pointer shadow-xs',
                      step === 1
                        ? 'opacity-0 pointer-events-none'
                        : 'border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white',
                      isRTL && 'font-serif text-sm sm:text-lg'
                    )}
                  >
                    {isRTL ? <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />}
                    <span className="inline">{t.btnPrev}</span>
                  </button>

                  <div className="hidden sm:flex items-center gap-2">
                    {([1, 2, 3, 4, 5] as StepId[]).map(i => (
                      <span key={i} className={cn(
                        'rounded-full transition-all duration-300',
                        step === i ? 'w-8 h-2.5 bg-[#0f2863] dark:bg-blue-400 shadow-xs' : step > i ? 'w-2.5 h-2.5 bg-[#0f2863]/40 dark:bg-blue-400/40' : 'w-2.5 h-2.5 bg-slate-300 dark:bg-white/20'
                      )} />
                    ))}
                  </div>

                  {editMode && (
                    <button
                      type="button"
                      onClick={saveDirectToDatabase}
                      disabled={submitting || ocrExtracting}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-base px-5 py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                      title="Enregistrer directement les modifications dans la base de données PostgreSQL"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                      <span>Enregistrer les Modifications (PostgreSQL Direct)</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || ocrExtracting}
                    className={cn(
                      "flex items-center gap-1.5 sm:gap-2.5 text-white px-4 sm:px-9 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-xs sm:text-lg tracking-wide transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer",
                      ocrExtracting
                        ? "bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 animate-pulse cursor-wait shadow-amber-600/30 ring-4 ring-amber-500/20"
                        : "bg-gradient-to-r from-[#0f2863] via-[#162e74] to-[#09193d] hover:opacity-95 shadow-[#0f2863]/25",
                      isRTL && "font-serif"
                    )}
                  >
                    {ocrExtracting ? (
                      <>
                        <svg className="animate-spin w-5 h-5 text-amber-200" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span>{isRTL ? 'جاري استخراج البيانات... ⏳' : 'Extraction IA en cours... ⏳'}</span>
                      </>
                    ) : submitting ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        {t.btnSending}
                      </>
                    ) : step === 5 ? (
                      <><Rocket className="w-5 h-5 text-amber-400" /> {editMode ? 'Valider la Modification' : t.btnSubmit}</>
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
      </div>

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

      {/* ── MODAL TEST EXTRACTION DES DONNÉES (OCR IA) ── */}
      {showOcrConfirmationModal && extractedDataResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-95">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl space-y-0">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-[#0f2863] via-[#162e74] to-[#09193d] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-black text-2xl">
                  🤖
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-amber-300">
                    {isRTL ? 'نتائج استخراج البيانات بالذكاء الاصطناعي (Groq Llama 3.2 Vision)' : 'Résultats de l\'Extraction OCR Groq Llama 3.2 Vision'}
                  </h3>
                  <p className="text-xs text-amber-200 font-extrabold flex items-center gap-1.5 mt-0.5">
                    <span>📄 Document Analysé :</span>
                    <span className="bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/40 text-amber-100 font-mono">
                      {extractedDataResult.doc_type_label || 'Document Numérisé'} ({extractedDataResult.file_name || 'Scan'})
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOcrConfirmationModal(false)}
                className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body - Grid of extracted fields */}
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>70% des données ont été extraites avec succès. Vérifiez et validez pour continuer vers l'Étape 2.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">CNE / Code Massar</span>
                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">{extractedDataResult.cne}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">CIN / Carte Nationale</span>
                  <span className="font-mono font-black text-slate-800 dark:text-white text-sm">{extractedDataResult.cin}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Nom & Prénom (FR)</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{extractedDataResult.last_name_fr} {extractedDataResult.first_name_fr}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Nom & Prénom (AR)</span>
                  <span className="font-serif font-extrabold text-slate-900 dark:text-white">{extractedDataResult.last_name_ar} {extractedDataResult.first_name_ar}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Moyenne du Bac</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{extractedDataResult.bac_average} / 20 ({extractedDataResult.bac_mention})</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Type de Baccalauréat</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{extractedDataResult.bac_type}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Date & Lieu de Naissance</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{extractedDataResult.birth_date || 'En attente'} — {extractedDataResult.birth_city_fr || ''} ({extractedDataResult.birth_city_ar || ''})</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Lycée & Académie</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{extractedDataResult.high_school || ''} ({extractedDataResult.academy || 'Fès-Meknès'})</span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowOcrConfirmationModal(false)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer hover:opacity-90"
              >
                Fermer & Corriger
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOcrConfirmationModal(false);
                  setCndpConsent(true);
                  goNext();
                  toast.success("✅ Données validées ! Bienvenue dans l'Étape 2.");
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Valider & Passer à l'Étape 2 →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PDF Iframe Verification Modal ── */}
      {pdfPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-4xl w-full flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{pdfPreviewModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPdfPreviewModal(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-[70vh] bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center relative p-2">
              {pdfPreviewModal.isImage || /\.(jpg|jpeg|png|webp|gif)$/i.test(pdfPreviewModal.title || '') || pdfPreviewModal.url?.startsWith('data:image/') ? (
                <img
                  src={pdfPreviewModal.url}
                  alt={pdfPreviewModal.title}
                  className="max-w-full max-h-full object-contain p-2 rounded-xl shadow-lg"
                />
              ) : (
                <iframe
                  src={pdfPreviewModal.url}
                  className="w-full h-full border-0 rounded-xl bg-white"
                  title={pdfPreviewModal.title}
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Document connecté et vérifié dans PostgreSQL
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={pdfPreviewModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Ouvrir dans un nouvel onglet
                </a>
                <button
                  type="button"
                  onClick={() => setPdfPreviewModal(null)}
                  className="px-6 py-2.5 bg-[#0f2863] text-white font-extrabold text-xs rounded-xl shadow-md hover:opacity-90 cursor-pointer"
                >
                  Fermer l'Aperçu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* ── Modal d'Alerte Champs Manquants ── */}
      {showMissingModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-2 border-red-500/40 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 relative overflow-hidden text-left" dir={isRTL ? "rtl" : "ltr"}>
            <div className="h-2 bg-gradient-to-r from-red-500 via-amber-500 to-red-600 absolute top-0 left-0 right-0" />

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className={cn("text-xl font-black text-slate-900 dark:text-white", isRTL && "font-serif text-2xl")}>
                  {isRTL ? `حقول إجبارية غير مكتملة (${missingFieldsList.length})` : `Champs Obligatoires Incomplets (${missingFieldsList.length})`}
                </h3>
                <p className={cn("text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1", isRTL && "font-serif")}>
                  {isRTL ? 'يرجى ملء الحقول الإجبارية التالية للتمكن من المرور إلى الخطوة الموالية:' : 'Veuillez renseigner les champs ci-dessous pour pouvoir continuer à l\'étape suivante :'}
                </p>
              </div>
            </div>

            <div className="bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2.5">
              {missingFieldsList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-extrabold text-red-700 dark:text-red-300">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowMissingModal(false);
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="w-full py-4 bg-gradient-to-r from-[#0f2863] to-indigo-700 hover:opacity-95 text-white font-black rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
            >
              {isRTL ? 'فهمت، سأقوم باستكمال البيانات ✍️' : 'Compris, Je Complète Mes Données ✍️'}
            </button>
          </div>
        </div>
      )}

      <CndpPrivacyModal isOpen={showCndpModal} onClose={() => setShowCndpModal(false)} lang={lang} />

      {/* AI ScolarBot Widget (AI Module #4) */}
      <AiScolarBotWidget />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease both; }
      `}</style>
    </div>
  );
}
