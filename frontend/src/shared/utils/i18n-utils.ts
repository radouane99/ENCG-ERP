import i18n from '@/app/i18n';

/**
 * Returns the localized value of a database field.
 * If the current language is Arabic, it checks for a `{fieldName}_ar` field.
 * If the Arabic field exists and is not null/empty, it returns it.
 * Otherwise, it falls back to the standard (French) field.
 * 
 * @param model The data object (e.g., student, department)
 * @param fieldName The base field name (e.g., 'first_name', 'name')
 * @returns The localized string
 */
export function getLocalizedField(model: any, fieldName: string): string {
  if (!model) return '';

  const currentLang = i18n.language;
  
  if (currentLang === 'ar') {
    const arField = `${fieldName}_ar`;
    if (model[arField]) {
      return model[arField];
    }
  }

  return model[fieldName] || '';
}
