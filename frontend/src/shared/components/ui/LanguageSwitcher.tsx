import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { changeAppLanguage, normalizeLocale } from '@shared/lib/locale'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation('common')
  const current = normalizeLocale(i18n.language)

  return (
    <div className={cn('relative inline-flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors dark:hover:bg-slate-800', className)}>
      <Languages className="w-4 h-4 text-slate-500" />
      <select
        value={current}
        onChange={(e) => void changeAppLanguage(e.target.value)}
        aria-label={t('language', { defaultValue: 'Language' })}
        className="appearance-none bg-transparent outline-none text-sm font-medium uppercase text-slate-700 dark:text-slate-300 cursor-pointer pe-4"
      >
        <option value="fr">FR</option>
        <option value="ar">AR</option>
        <option value="en">EN</option>
      </select>
    </div>
  )
}
