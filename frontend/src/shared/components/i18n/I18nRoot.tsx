import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { applyDocumentLocale, normalizeLocale } from '@shared/lib/locale'
import { GlobalLanguageDock } from './GlobalLanguageDock'

/**
 * Applies FR/AR/EN + RTL on every route (public, auth, student, professor, admin).
 */
export default function I18nRoot({ children }: { children: React.ReactNode }) {
  const { i18n, t } = useTranslation(['common', 'pages'])
  const location = useLocation()

  useEffect(() => {
    applyDocumentLocale(normalizeLocale(i18n.language))
  }, [i18n.language])

  useEffect(() => {
    const key = location.pathname.replace(/\/+$/, '') || '/'
    const title = t(`pages:routes.${key}`, { defaultValue: '' })
    const app = t('common:app_name', { defaultValue: 'ENCG ERP' })
    document.title = title ? `${title} · ${app}` : app
  }, [location.pathname, i18n.language, t])

  return (
    <>
      {children}
      <GlobalLanguageDock />
    </>
  )
}
