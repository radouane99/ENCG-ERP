import type { OcrRun } from './workflow'
import { getRegionForProvince, getProvinceDetails } from './moroccanGeography'

// Only editable documentary fields may enter the form. Official identifiers and
// administrative decisions are never writable through extracted data.
const fieldMap: Record<string, string> = {
  first_name_fr: 'first_name',
  last_name_fr: 'last_name',
  first_name_ar: 'first_name_ar',
  last_name_ar: 'last_name_ar',
  birth_date: 'birth_date',
  birth_city: 'birth_city', birth_city_fr: 'birth_city', birth_place_fr: 'birth_city',
  birth_city_ar: 'birth_city_ar', birth_place_ar: 'birth_city_ar', address: 'address', address_fr: 'address', address_ar: 'address_ar',
  father_first_name: 'father_first_name', father_name_fr: 'father_first_name', father_name: 'father_first_name',
  father_first_name_ar: 'father_first_name_ar', father_name_ar: 'father_first_name_ar',
  father_last_name: 'father_last_name', father_last_name_ar: 'father_last_name_ar',
  mother_first_name: 'mother_first_name', mother_name_fr: 'mother_first_name', mother_name: 'mother_first_name',
  mother_first_name_ar: 'mother_first_name_ar', mother_name_ar: 'mother_first_name_ar',
  mother_last_name: 'mother_last_name', mother_last_name_ar: 'mother_last_name_ar',
  nationality_ar: 'nationality_ar', bac_mention: 'bac_mention', mention: 'bac_mention',
  bac_province: 'bac_province', bac_regional_average: 'bac_regional_average', bac_national_average: 'bac_national_average', bac_continuous_average: 'bac_continuous_average',
  bac_average: 'bac_average',
  bac_type: 'bac_series',
  high_school: 'high_school',
  academy: 'academy',
  province: 'province',
  bac_year: 'bac_year',
  gender: 'gender',
  nationality: 'nationality',
}

export function ocrPrefill(run: OcrRun, current: Record<string, unknown>, replace = false) {
  const result: Record<string, string | number> = {}
  for (const [key, field] of Object.entries(run.fields ?? {})) {
    const target = fieldMap[key]
    if (!target || field.conflict || field.value === null || field.value === '' || !['string', 'number'].includes(typeof field.value)) continue
    if (!replace && current[target] !== null && current[target] !== undefined && String(current[target]).trim() !== '') continue

    if (target === 'bac_series' && typeof field.value === 'string') {
      let s = field.value
      if (/sciences\s+physiques/i.test(s)) s = 'Sciences Physiques'
      else if (/sciences\s+math[eé]matiques\s*a/i.test(s)) s = 'Sciences Mathématiques A'
      else if (/sciences\s+math[eé]matiques\s*b/i.test(s)) s = 'Sciences Mathématiques B'
      else if (/sciences\s+math[eé]matiques/i.test(s)) s = 'Sciences Mathématiques'
      else if (/sciences\s+(?:de\s+la\s+vie|svt)/i.test(s)) s = 'Sciences de la Vie et de la Terre'
      else if (/sciences\s+[eé]conomiques/i.test(s)) s = 'Sciences Économiques'
      else if (/techniques?\s+de\s+gestion/i.test(s)) s = 'Techniques de Gestion et Comptabilité'
      result[target] = s
      continue
    }

    result[target] = field.value
  }

  // Automatic geographic enrichment & normalization if province was extracted
  if (result.province && typeof result.province === 'string') {
    const details = getProvinceDetails(result.province)
    if (details) {
      result.province = details.name
      if (!current.region && !result.region) {
        const reg = getRegionForProvince(details.name)
        if (reg) result.region = reg
      }
      if (!current.delegation && !result.delegation && details.delegation) {
        result.delegation = details.delegation
      }
    }
  }

  return result
}
