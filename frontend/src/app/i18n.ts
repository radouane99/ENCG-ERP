import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en', 'ar'],
    defaultNS: 'common',
    ns: [
      'common',
      'auth',
      'students',
      'professors',
      'academic',
      'exams',
      'documents',
      'lms',
      'dashboard',
      'admission',
      'admissions',
      'timetable',
      'attendance',
      'deliberation',
      'library',
      'communication',
      'vacataire',
      'admin',
      'sidebar',
      'modules',
      'internship',
      'pages',
    ],
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
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

import { applyDocumentLocale } from '@shared/lib/locale'

i18n.on('languageChanged', (lng) => {
  applyDocumentLocale(lng)
})

if (typeof document !== 'undefined') {
  applyDocumentLocale(i18n.language || 'fr')
}

export default i18n
