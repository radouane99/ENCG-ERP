import { useMemo } from 'react'
import type { AdmissionDossier } from '../model/workflow'
import type { AdmissionDraft } from '../hooks/useAdmissionDraftAutosave'
import { sections, type Field } from '../model/candidateProfileFields'
import {
  COUNTRIES,
  MOROCCAN_REGIONS,
  getProvincesForRegion,
  getAllMoroccanProvinces,
  getRegionForProvince,
  getProvinceDetails,
  getCountryDetails
} from '../model/moroccanGeography'

const required = new Set(['first_name', 'last_name', 'phone', 'birth_date', 'address', 'bac_average', 'bac_year'])

export default function CandidateProfileFields({
  dossier,
  values,
  onChange,
  errors,
  disabled,
  ar,
  inputClass
}: {
  dossier: AdmissionDossier
  values: AdmissionDraft
  onChange: (key: string, value: string | boolean) => void
  errors: Record<string, string>
  disabled: boolean
  ar: boolean
  inputClass: string
}) {
  const currentCountry = String(values.country || 'Maroc').trim()
  const isMorocco = !values.country || currentCountry.toLowerCase() === 'maroc' || currentCountry === 'المغرب'

  const currentRegion = String(values.region || '').trim()
  const currentProvince = String(values.province || '').trim()

  const availableProvinces = useMemo(() => {
    if (!isMorocco) return []
    if (currentRegion) {
      const match = getProvincesForRegion(currentRegion)
      if (match.length > 0) return match
    }
    return getAllMoroccanProvinces()
  }, [isMorocco, currentRegion])

  const suggestedCities = useMemo(() => {
    if (!isMorocco) return []
    if (currentProvince) {
      const p = getProvinceDetails(currentProvince)
      if (p?.cities?.length) return p.cities
    }
    if (currentRegion) {
      const provs = getProvincesForRegion(currentRegion)
      return provs.flatMap(p => p.cities)
    }
    return ['Fès', 'Casablanca', 'Rabat', 'Salé', 'Tanger', 'Marrakech', 'Meknès', 'Agadir', 'Oujda', 'Kénitra', 'Tétouan', 'Safi', 'El Jadida', 'Béni Mellal', 'Nador', 'Taza', 'Settat']
  }, [isMorocco, currentProvince, currentRegion])

  const handleCountryChange = (countryName: string) => {
    onChange('country', countryName)
    const details = getCountryDetails(countryName)
    if (details) {
      if (!values.nationality || values.nationality === 'Marocaine' || values.nationality === 'Étrangère') {
        onChange('nationality', details.nationality)
      }
      if (!values.nationality_ar || values.nationality_ar === 'مغربية' || values.nationality_ar === 'أجنبية') {
        onChange('nationality_ar', details.nationalityAr)
      }
    }
  }

  const handleRegionChange = (regionName: string) => {
    onChange('region', regionName)
    if (regionName && currentProvince) {
      const provs = getProvincesForRegion(regionName)
      if (!provs.some(p => p.name.toLowerCase() === currentProvince.toLowerCase())) {
        onChange('province', '')
        onChange('delegation', '')
      }
    }
  }

  const handleProvinceChange = (provinceName: string) => {
    onChange('province', provinceName)
    if (!provinceName) return
    const details = getProvinceDetails(provinceName)
    if (details) {
      if (details.delegation && (!values.delegation || values.delegation.toString().startsWith('Direction Provinciale'))) {
        onChange('delegation', details.delegation)
      }
      const parentRegion = getRegionForProvince(provinceName)
      if (parentRegion && (!values.region || values.region !== parentRegion)) {
        onChange('region', parentRegion)
      }
      if (!values.city && details.cities.length > 0) {
        onChange('city', details.cities[0])
      }
    }
  }

  const input = (field: Field) => {
    const [key, label, labelAr, type = 'text'] = field
    const numericYear = type === 'number' && key !== 'bac_average'
    return (
      <label key={key} htmlFor={`admission-${key}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        <span>
          {ar ? labelAr : label}
          {required.has(key) && <span aria-hidden="true"> *</span>}
        </span>
        <input
          id={`admission-${key}`}
          className={`${inputClass} mt-1.5 shadow-2xs`}
          type={type}
          aria-label={ar ? labelAr : label}
          lang={key.endsWith('_ar') ? 'ar' : 'fr'}
          dir={key.endsWith('_ar') ? 'rtl' : undefined}
          value={String(values[key] ?? '')}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? `error-${key}` : undefined}
          min={key === 'bac_average' ? 0 : numericYear ? 1980 : undefined}
          max={key === 'bac_average' ? 20 : numericYear ? new Date().getFullYear() + (key === 'bac_year' ? 0 : 1) : undefined}
          step={key === 'bac_average' ? '0.01' : numericYear ? 1 : undefined}
          maxLength={
            type === 'text'
              ? key.startsWith('address')
                ? 500
                : key.endsWith('_cin')
                ? 30
                : key.includes('name') || key.startsWith('nationality') || key === 'bac_mention'
                ? 100
                : key.startsWith('previous_')
                ? 255
                : key === 'high_school' || key.endsWith('_profession')
                ? 180
                : 120
              : undefined
          }
          onChange={event => onChange(key, event.target.value)}
        />
        {errors[key] && (
          <span id={`error-${key}`} className="mt-1 block text-xs font-normal text-red-600 dark:text-red-400">
            {errors[key]}
          </span>
        )}
      </label>
    )
  }

  return (
    <fieldset disabled={disabled} className="space-y-6">
      <p className="text-xs text-muted-foreground">
        {ar
          ? 'الحقول المشار إليها بـ * مطلوبة عند إرسال الملف. معلومات الوالدين والصحة اختيارية.'
          : 'Les champs marqués * sont nécessaires à l’envoi. Les informations des parents et de santé restent facultatives.'}
      </p>

      {sections.map(section => (
        <section key={section.id} aria-labelledby={`profile-section-${section.id}`} className="space-y-4">
          <h3
            id={`profile-section-${section.id}`}
            className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-800 dark:border-slate-800 dark:text-slate-200"
          >
            {ar ? section.titleAr : section.title}
          </h3>

          {section.id === 'identity' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['cne', 'CNE / Code Massar', dossier.cne],
                ['cin', 'CNIE officielle', dossier.cin],
                ['email', 'Adresse e-mail du compte', dossier.email]
              ].map(([key, label, value]) => (
                <label key={key} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {label}
                  <input readOnly value={value || ''} className={`${inputClass} mt-1.5 bg-slate-50 dark:bg-slate-900`} />
                </label>
              ))}
            </div>
          )}

          {['father', 'mother'].includes(section.id) && values[`${section.id}_name`] && !values[`${section.id}_last_name`] && (
            <p className="text-xs text-muted-foreground">
              {ar ? 'الاسم الكامل المسجل سابقاً' : 'Nom complet conservé du dossier existant'} : {String(values[`${section.id}_name`])}
            </p>
          )}

          {section.id === 'higher' && (
            <label className="flex items-start gap-3 text-sm">
              <input
                className="mt-1 h-4 w-4"
                type="checkbox"
                checked={!!values.has_prior_higher_education}
                onChange={event => onChange('has_prior_higher_education', event.target.checked)}
              />
              {ar ? 'سبق لي التسجيل بمؤسسة للتعليم العالي' : 'J’ai déjà été inscrit dans l’enseignement supérieur'}
            </label>
          )}

          {section.id === 'residence' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Pays de résidence */}
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="admission-country">
                <span>{ar ? 'بلد الإقامة' : 'Pays de résidence'}</span>
                <select
                  id="admission-country"
                  className={`${inputClass} mt-1.5 shadow-2xs`}
                  value={currentCountry || 'Maroc'}
                  onChange={e => handleCountryChange(e.target.value)}
                >
                  {COUNTRIES.map(c => (
                    <option key={c.name} value={c.name}>
                      {ar ? `${c.nameAr} (${c.name})` : c.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Région */}
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="admission-region">
                <span>{ar ? 'الجهة' : 'Région'}</span>
                {isMorocco ? (
                  <select
                    id="admission-region"
                    className={`${inputClass} mt-1.5 shadow-2xs`}
                    value={currentRegion}
                    onChange={e => handleRegionChange(e.target.value)}
                  >
                    <option value="">{ar ? 'اختر الجهة...' : 'Sélectionner une région...'}</option>
                    {MOROCCAN_REGIONS.map(r => (
                      <option key={r.name} value={r.name}>
                        {ar ? `${r.nameAr} (${r.name})` : r.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="admission-region"
                    className={`${inputClass} mt-1.5 shadow-2xs`}
                    placeholder={ar ? 'الجهة / الولاية / المقاطعة' : 'Région / Département / État'}
                    value={String(values.region ?? '')}
                    onChange={e => onChange('region', e.target.value)}
                  />
                )}
              </label>

              {/* Province */}
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="admission-province">
                <span>{ar ? 'الإقليم / العمالة' : 'Province / Préfecture'}</span>
                {isMorocco ? (
                  <select
                    id="admission-province"
                    className={`${inputClass} mt-1.5 shadow-2xs`}
                    value={currentProvince}
                    onChange={e => handleProvinceChange(e.target.value)}
                  >
                    <option value="">{ar ? 'اختر الإقليم...' : 'Sélectionner une province...'}</option>
                    {availableProvinces.map(p => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="admission-province"
                    className={`${inputClass} mt-1.5 shadow-2xs`}
                    placeholder={ar ? 'الإقليم / المقاطعة' : 'Province / District'}
                    value={String(values.province ?? '')}
                    onChange={e => onChange('province', e.target.value)}
                  />
                )}
              </label>

              {/* Délégation */}
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="admission-delegation">
                <span>{ar ? 'المندوبية / المديرية الإقليمية' : 'Délégation / Direction provinciale'}</span>
                <input
                  id="admission-delegation"
                  className={`${inputClass} mt-1.5 shadow-2xs`}
                  placeholder={ar ? 'المديرية الإقليمية' : 'Direction Provinciale'}
                  value={String(values.delegation ?? '')}
                  onChange={e => onChange('delegation', e.target.value)}
                />
              </label>

              {/* Ville */}
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="admission-city">
                <span>{ar ? 'المدينة' : 'Ville'}</span>
                <input
                  id="admission-city"
                  list="admission-cities-datalist"
                  className={`${inputClass} mt-1.5 shadow-2xs`}
                  placeholder={ar ? 'اكتب أو اختر المدينة' : 'Tapez ou choisissez la ville'}
                  value={String(values.city ?? '')}
                  onChange={e => onChange('city', e.target.value)}
                />
                <datalist id="admission-cities-datalist">
                  {suggestedCities.map(city => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </label>

              {/* Adresse de résidence (Fr) */}
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="admission-address">
                <span>
                  {ar ? 'عنوان السكن بالفرنسية' : 'Adresse de résidence (Fr)'}
                  <span aria-hidden="true"> *</span>
                </span>
                <input
                  id="admission-address"
                  className={`${inputClass} mt-1.5 shadow-2xs`}
                  maxLength={500}
                  placeholder={ar ? 'رقم، شارع، حي...' : 'N°, Rue, Quartier...'}
                  value={String(values.address ?? '')}
                  onChange={e => onChange('address', e.target.value)}
                />
                {errors.address && (
                  <span id="error-address" className="mt-1 block text-xs font-normal text-red-600 dark:text-red-400">
                    {errors.address}
                  </span>
                )}
              </label>

              {/* Adresse de résidence (Ar) */}
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="admission-address_ar">
                <span>{ar ? 'عنوان السكن بالعربية' : 'Adresse de résidence (Ar)'}</span>
                <input
                  id="admission-address_ar"
                  dir="rtl"
                  lang="ar"
                  className={`${inputClass} mt-1.5 shadow-2xs`}
                  maxLength={500}
                  placeholder="العنوان الكامل بالعربية..."
                  value={String(values.address_ar ?? '')}
                  onChange={e => onChange('address_ar', e.target.value)}
                />
              </label>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {section.fields
                .filter(
                  ([key]) =>
                    section.id !== 'higher' ||
                    !key.startsWith('previous_') ||
                    values.has_prior_higher_education ||
                    dossier.campaign.entry_route === 'cnaem' ||
                    values[key]
                )
                .map(input)}
            </div>
          )}

          {section.id === 'identity' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="admission-gender">
                {ar ? 'الجنس *' : 'Sexe *'}
                <select
                  id="admission-gender"
                  value={String(values.gender ?? '')}
                  className={`${inputClass} mt-1.5`}
                  onChange={event => onChange('gender', event.target.value)}
                  aria-invalid={!!errors.gender}
                >
                  <option value="">{ar ? 'اختر' : 'Choisir'}</option>
                  <option value="female">{ar ? 'أنثى' : 'Féminin'}</option>
                  <option value="male">{ar ? 'ذكر' : 'Masculin'}</option>
                </select>
                {errors.gender && <span className="mt-1 block text-red-600">{errors.gender}</span>}
              </label>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Sexe (Ar)
                <input
                  readOnly
                  dir="rtl"
                  value={values.gender === 'male' ? 'ذكر' : values.gender === 'female' ? 'أنثى' : ''}
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {ar ? 'الحالة العائلية' : 'Situation familiale'}
                <select
                  id="admission-marital_status"
                  className={`${inputClass} mt-1.5`}
                  value={String(values.marital_status ?? '')}
                  onChange={event => onChange('marital_status', event.target.value)}
                >
                  <option value="">{ar ? 'غير محددة' : 'Non renseignée'}</option>
                  {[
                    ['single', 'Célibataire', 'أعزب / عزباء'],
                    ['married', 'Marié(e)', 'متزوج(ة)'],
                    ['divorced', 'Divorcé(e)', 'مطلق(ة)'],
                    ['widowed', 'Veuf / Veuve', 'أرمل(ة)']
                  ].map(([key, fr, arabic]) => (
                    <option key={key} value={key}>
                      {ar ? arabic : fr}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </section>
      ))}
    </fieldset>
  )
}
