import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'
import { applyDocumentLocale } from '@shared/lib/locale'

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en', 'ar'],
    defaultNS: 'common',
    ns: ['common', 'pages'],
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'encg_lang',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
  })

i18n.on('languageChanged', (lng) => {
  applyDocumentLocale(lng)
})

if (typeof document !== 'undefined') {
  const savedLocale = localStorage.getItem('encg_lang')
  if (savedLocale) applyDocumentLocale(savedLocale)
}

export default i18n
