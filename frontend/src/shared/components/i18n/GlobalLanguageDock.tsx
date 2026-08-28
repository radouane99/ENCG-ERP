import { useTranslation } from 'react-i18next'
import { changeAppLanguage, LOCALE_META, normalizeLocale, SUPPORTED_LOCALES } from '@shared/lib/locale'
import { cn } from '@shared/lib/utils'

/**
 * Language switcher dock — DISABLED.
 * Language selection is handled exclusively by the navbar Globe button (Header.tsx).
 * Kept here for reference; returns null to avoid redundancy.
 */
export function GlobalLanguageDock() {
  return null
}
