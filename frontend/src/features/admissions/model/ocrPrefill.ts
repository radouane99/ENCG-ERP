import type { OcrRun } from './workflow'

// Only editable documentary fields may enter the form. Official identifiers and
// administrative decisions are never writable through extracted data.
const fieldMap: Record<string, string> = {
  first_name_fr: 'first_name',
  last_name_fr: 'last_name',
  first_name_ar: 'first_name_ar',
  last_name_ar: 'last_name_ar',
  birth_date: 'birth_date',
  birth_city: 'birth_city',
  cin: 'cin',
  bac_average: 'bac_average',
  bac_type: 'bac_series',
  high_school: 'high_school',
  academy: 'academy',
  province: 'province',
  bac_year: 'bac_year',
  gender: 'gender',
  nationality: 'nationality',
}

export function ocrPrefill(run: OcrRun, current: Record<string, unknown>, replace = true) {
  const result: Record<string, string | number> = {}
  for (const [key, field] of Object.entries(run.fields ?? {})) {
    const target = fieldMap[key]
    if (!target || field.conflict || field.value === null || field.value === '' || !['string', 'number'].includes(typeof field.value)) continue
    if (!replace && current[target] !== null && current[target] !== undefined && String(current[target]).trim() !== '') continue
    result[target] = field.value
  }
  return result
}

