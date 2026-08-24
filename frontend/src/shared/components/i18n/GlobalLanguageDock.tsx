import { useTranslation } from 'react-i18next'
import { changeAppLanguage, LOCALE_META, normalizeLocale, SUPPORTED_LOCALES } from '@shared/lib/locale'
import { cn } from '@shared/lib/utils'

/** Always visible on every page so no screen is excluded from FR / AR / EN. */
export function GlobalLanguageDock() {
  const { i18n, t } = useTranslation('common')
  const current = normalizeLocale(i18n.language)

  return (
    <div
      className="fixed z-[200] bottom-4 end-4 flex items-center gap-1 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 shadow-lg backdrop-blur-md p-1"
      role="navigation"
      aria-label={t('language', { defaultValue: 'Language' })}
    >
      {SUPPORTED_LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => void changeAppLanguage(code)}
          className={cn(
            'min-w-[2.5rem] px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors cursor-pointer',
            current === code
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
          )}
          aria-pressed={current === code}
          title={LOCALE_META[code].label}
        >
          {LOCALE_META[code].native}
        </button>
      ))}
    </div>
  )
}
