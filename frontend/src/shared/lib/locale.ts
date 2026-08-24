export const SUPPORTED_LOCALES = ['fr', 'ar', 'en'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_META: Record<AppLocale, { label: string; native: string; dir: 'ltr' | 'rtl' }> = {
  fr: { label: 'Français', native: 'FR', dir: 'ltr' },
  ar: { label: 'العربية', native: 'عربي', dir: 'rtl' },
  en: { label: 'English', native: 'EN', dir: 'ltr' },
}

export function normalizeLocale(lng?: string): AppLocale {
  const code = (lng || 'fr').slice(0, 2).toLowerCase()
  return (SUPPORTED_LOCALES as readonly string[]).includes(code) ? (code as AppLocale) : 'fr'
}

export function applyDocumentLocale(lng: string) {
  const locale = normalizeLocale(lng)
  const dir = LOCALE_META[locale].dir
  document.documentElement.setAttribute('dir', dir)
  document.documentElement.setAttribute('lang', locale)
  document.documentElement.classList.toggle('rtl', dir === 'rtl')
  localStorage.setItem('encg_lang', locale)
  localStorage.setItem('i18nextLng', locale)
}

export async function changeAppLanguage(lng: string) {
  const locale = normalizeLocale(lng)
  const { default: i18n } = await import('@/app/i18n')
  await i18n.changeLanguage(locale)
  applyDocumentLocale(locale)
}
