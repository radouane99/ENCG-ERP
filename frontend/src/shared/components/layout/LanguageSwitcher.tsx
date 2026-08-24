import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { changeAppLanguage, LOCALE_META, normalizeLocale, SUPPORTED_LOCALES } from '@shared/lib/locale'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const current = normalizeLocale(i18n.language)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        title={t('language', { defaultValue: 'Change language' })}
      >
        <Globe className="w-4 h-4" />
        <span className="text-xs font-medium uppercase hidden sm:inline">{current}</span>
      </button>
      {open && (
        <div className="absolute end-0 top-10 w-40 bg-card border border-border rounded-xl shadow-xl z-50 py-1">
          {SUPPORTED_LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                void changeAppLanguage(code)
                setOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground',
                current === code ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
              )}
            >
              <span>{LOCALE_META[code].native}</span>
              <span>{LOCALE_META[code].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
