import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className={cn("relative inline-flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors dark:hover:bg-slate-800", className)}>
      <Languages className="w-4 h-4 text-slate-500" />
      <select
        value={i18n.language}
        onChange={changeLanguage}
        className="appearance-none bg-transparent outline-none text-sm font-medium uppercase text-slate-700 dark:text-slate-300 cursor-pointer pr-4"
        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
      >
        <option value="fr">FR</option>
        <option value="ar">AR</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
