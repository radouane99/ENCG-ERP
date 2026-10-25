import React,{ useId } from 'react';
import { Modal } from '@shared/components/ui/Modal';
import { Lock,Check,X,Keyboard,Delete } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { Lang } from '../model/registrationTypes';

export function CustomSelect({ icon: Icon, value, onChange, options, isRtl, name, id, required, disabled }: {
  icon: React.ElementType; value: string; onChange: (e: { target: { name: string; value: string } }) => void;
  options: { value: string; label: React.ReactNode }[]; isRtl: boolean; name?: string; id?: string; required?: boolean; disabled?: boolean;
}) {
  return <div className="relative w-full">
    <Icon aria-hidden="true" className={cn('pointer-events-none absolute top-4 h-5 w-5 text-muted-foreground', isRtl ? 'right-4' : 'left-4')} />
    <select id={id} name={name} required={required} disabled={disabled} value={value} dir={isRtl ? 'rtl' : 'ltr'}
      onChange={e => onChange({ target: { name: name ?? '', value: e.target.value } })}
      className="w-full border border-input bg-background px-12 py-3.5 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 rounded-[var(--control-radius)]">
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </div>
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
  const generatedId = useId();
  const inputId = props.id ?? generatedId;
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
        <label htmlFor={inputId} className={cn("text-sm sm:text-base font-bold tracking-wide uppercase text-foreground dark:text-foreground flex items-center", isRtl && "justify-start font-serif text-lg font-bold")}>
          <span>{cleanLabel}</span>
          {required && <span className="text-[#E60028] font-bold ms-1">*</span>}
        </label>
        <CustomSelect
          icon={Icon}
          value={String(selectProps.value ?? '')}
          name={selectProps.name}
          id={inputId}
          required={required}
          disabled={selectProps.disabled}
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
      <label htmlFor={inputId} className={cn("text-sm sm:text-base font-bold tracking-wide uppercase text-foreground dark:text-foreground flex items-center", isRtl && "justify-start font-serif text-lg font-bold")}>
        <span>{cleanLabel}</span>
        {required && <span className="text-rose-500 font-bold ms-1">*</span>}
      </label>
      <div className="relative group">
        <span className={cn("pointer-events-none absolute inset-y-0 flex items-center text-slate-400 dark:text-slate-500 group-focus-within:text-[#0f2863] dark:group-focus-within:text-blue-400 transition-colors", isRtl ? "right-4" : "left-4")}>
          <Icon className="w-5 h-5" />
        </span>
        <input
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          id={inputId}
          required={required}
          className={cn(
            "w-full py-4 text-base sm:text-lg font-bold placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all shadow-sm rounded-[var(--control-radius)]",
            isReadOnly || hasVal
              ? "bg-muted dark:bg-slate-800/90 border-2 border-slate-300 dark:border-border text-foreground dark:text-white shadow-inner rounded-[var(--control-radius)]"
              : "bg-card dark:bg-slate-900/90 border-2 border-slate-300 dark:border-white/20 text-foreground dark:text-white focus:border-[#0f2863] dark:focus:border-blue-400 focus:ring-4 focus:ring-[#0f2863]/20 rounded-[var(--control-radius)]",
            isRtl ? "pr-12 pl-4 text-right font-serif text-xl font-bold rounded-[var(--control-radius)]" : "pl-12 pr-4 rounded-[var(--control-radius)]",
            isReadOnly && !isRtl && "pr-36 rounded-[var(--control-radius)]"
          )}
        />
        {isReadOnly && (
          <button
            type="button"
            onClick={onUnlock}
            title="Cliquer pour déverrouiller et modifier ce champ"
            className={cn("absolute inset-y-0 flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/30 px-2.5 py-0.5 rounded-lg border border-emerald-400/50 h-6 my-auto cursor-pointer transition-all shadow-xs hover:scale-105", isRtl ? "left-3" : "right-3")}
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
    <div className="rounded-2xl border-2 border-border dark:border-white/15 bg-white/90 dark:bg-white/[0.04] p-6 sm:p-8 space-y-6 shadow-md">
      <p className={cn("text-sm sm:text-base font-bold uppercase tracking-wider text-[#0f2863] dark:text-blue-400 flex items-center gap-3 border-b-2 border-border dark:border-white/15 pb-3.5", isRtl && "font-serif text-xl font-bold")}>
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
    <Modal open={true} onClose={onClose} title={isAr ? "لوحة المفاتيح العربية" : "Clavier arabe"} size="lg">
      <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl shadow-sm w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#0c1e4e] via-[#162e74] to-[#081436] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/20 shadow-md">
              <Keyboard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">
                {isAr ? 'لوحة المفاتيح العربية' : 'Clavier Arabe Virtuel'}
              </h4>
              <p className="text-[11px] text-blue-200">
                {isAr ? 'الكتابة المباشرة في حقل:' : 'Saisie directe dans le champ :'} <span className="text-amber-300 font-bold">{fieldLabel}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={isAr ? "إغلاق" : "Fermer"}
            className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Display Input */}
        <div className="p-4 bg-muted/50 dark:bg-background border-b border-border dark:border-border space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
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
            className="w-full p-4 bg-card dark:bg-card border-2 border-indigo-500/40 text-2xl font-bold font-serif text-foreground dark:text-white text-right outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-inner rounded-[var(--control-radius)]"
          />
        </div>

        {/* Tactile Keypad */}
        <div className="p-4 space-y-2.5 overflow-x-auto bg-muted dark:bg-card select-none">
          {/* Row 0: Numbers */}
          <div className="flex gap-1.5 min-w-max" dir="rtl">
            {['ذ', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٠'].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, [fieldName]: (prev[fieldName] || '') + k }))}
                className="min-w-11 min-h-11 py-2.5 bg-card dark:bg-card hover:bg-primary hover:text-white dark:hover:bg-primary text-foreground dark:text-foreground font-serif font-bold text-lg rounded-xl border border-border dark:border-border shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                {k}
              </button>
            ))}
          </div>

          {/* Row 1 */}
          <div className="flex gap-1.5 min-w-max" dir="rtl">
            {['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, [fieldName]: (prev[fieldName] || '') + k }))}
                className="min-w-11 min-h-11 py-2.5 bg-card dark:bg-card hover:bg-primary hover:text-white dark:hover:bg-primary text-foreground dark:text-foreground font-serif font-bold text-lg rounded-xl border border-border dark:border-border shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                {k}
              </button>
            ))}
          </div>

          {/* Row 2 */}
          <div className="flex gap-1.5 min-w-max" dir="rtl">
            {['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, [fieldName]: (prev[fieldName] || '') + k }))}
                className="min-w-11 min-h-11 py-2.5 bg-card dark:bg-card hover:bg-primary hover:text-white dark:hover:bg-primary text-foreground dark:text-foreground font-serif font-bold text-lg rounded-xl border border-border dark:border-border shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                {k}
              </button>
            ))}
          </div>

          {/* Row 3 */}
          <div className="flex gap-1.5 min-w-max" dir="rtl">
            {['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ'].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, [fieldName]: (prev[fieldName] || '') + k }))}
                className="min-w-11 min-h-11 py-2.5 bg-card dark:bg-card hover:bg-primary hover:text-white dark:hover:bg-primary text-foreground dark:text-foreground font-serif font-bold text-lg rounded-xl border border-border dark:border-border shadow-xs active:scale-95 transition-all cursor-pointer"
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
              className="flex-1 py-3 bg-card dark:bg-card hover:bg-slate-200 text-foreground dark:text-foreground font-bold text-sm rounded-xl border border-border dark:border-border shadow-xs cursor-pointer active:scale-98 transition-all"
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
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-98 transition-all"
            >
              <Check className="w-4 h-4" /> {isAr ? 'تم' : 'Valider'}
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
}

