import React,{ useState,useRef,useEffect } from 'react';
import { Lock,ChevronDown,Check,X,Keyboard,Delete } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { Lang } from '../model/registrationTypes';

export function CustomSelect({
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

export function Field({
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

export function SectionCard({ title, icon: Icon, children, isRtl = false }: { title: string; icon: React.ElementType; children: React.ReactNode; isRtl?: boolean }) {
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

export function VirtualArabicKeyboardModal({
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

