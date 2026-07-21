import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, Database, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import api from '@shared/lib/api'
import { useAuthStore } from '@stores/authStore'

type AcademicYear = {
  id: number
  label: string
  start_date?: string | null
  end_date?: string | null
  is_current: boolean
  is_locked?: boolean
}

type ExamLockingStatus = {
  current_phase?: string
  audits?: Array<unknown>
}

const readOnlyInputClass = 'w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-500 outline-none'
const readOnlyTextAreaClass = 'w-full h-24 p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none font-medium text-slate-500 outline-none'

export default function AdminSettingsPage() {
  const { i18n } = useTranslation(['admin', 'common'])
  const { user } = useAuthStore()
  const isRtl = i18n.language === 'ar'

  const unsupportedValue = isRtl ? 'غير متاح عبر الواجهة الخلفية الحالية' : "Non exposé par l'API backend actuelle"

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | null>(null)
  const [persistedAcademicYearId, setPersistedAcademicYearId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshingSystem, setIsRefreshingSystem] = useState(false)
  const [systemState, setSystemState] = useState<ExamLockingStatus>({})

  const currentAcademicYear = useMemo(
    () => academicYears.find((year: AcademicYear) => year.id === selectedAcademicYearId) ?? null,
    [academicYears, selectedAcademicYearId]
  )

  useEffect(() => {
    let active = true

    const loadSettings = async () => {
      setLoading(true)

      try {
        const [yearsResponse, systemResponse] = await Promise.all([
          api.get('/academic-years'),
          api.get('/admin/exam-locking'),
        ])

        if (!active) return

        const years: AcademicYear[] = yearsResponse.data?.data ?? []
        const currentYear = years.find((year) => year.is_current) ?? null

        setAcademicYears(years)
        setSelectedAcademicYearId(currentYear?.id ?? years[0]?.id ?? null)
        setPersistedAcademicYearId(currentYear?.id ?? years[0]?.id ?? null)
        setSystemState(systemResponse.data ?? {})
      } catch (error: any) {
        if (!active) return
        toast.error(error?.response?.data?.message || 'Impossible de charger les paramètres administratifs.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      active = false
    }
  }, [])

  const handleSave = async () => {
    if (!selectedAcademicYearId) {
      toast.error("Aucune année académique n'est sélectionnée.")
      return
    }

    if (selectedAcademicYearId === persistedAcademicYearId) {
      toast.info('Aucun changement persistant détecté. Seule l’année académique active est modifiable via API pour le moment.')
      return
    }

    setIsSaving(true)

    try {
      await api.patch(`/academic-years/${selectedAcademicYearId}`, { is_current: true })

      setAcademicYears((previousYears: AcademicYear[]) => previousYears.map((year: AcademicYear) => ({
        ...year,
        is_current: year.id === selectedAcademicYearId,
      })))
      setPersistedAcademicYearId(selectedAcademicYearId)

      toast.success('Année académique active enregistrée avec succès.')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Impossible d'enregistrer l'année académique active.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefreshSystem = async () => {
    setIsRefreshingSystem(true)

    try {
      const response = await api.get('/admin/exam-locking')
      setSystemState(response.data ?? {})
      toast.success('État du système rechargé depuis le backend.')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Impossible de rafraîchir l'état du système.")
    } finally {
      setIsRefreshingSystem(false)
    }
  }

  return (
    <div className="space-y-8 animate-in p-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[#0f2863]">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Paramètres de l&apos;Institution</h1>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Administration Générale</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm text-blue-900">
        <p className="font-semibold mb-2">Cette page est maintenant branchée sur le backend existant.</p>
        <ul className="list-disc pl-5 space-y-1 text-blue-800">
          <li>L&apos;année académique active est chargée et persistée via <code>/api/academic-years</code>.</li>
          <li>Le bloc système lit l&apos;état courant via <code>/api/admin/exam-locking</code>.</li>
          <li>Les autres champs institutionnels restent en lecture seule tant qu&apos;aucun endpoint dédié de configuration institutionnelle n&apos;est exposé par le backend.</li>
        </ul>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-[#0f2863] uppercase tracking-wider mb-6">INFORMATIONS GÉNÉRALES</h2>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Nom de l&apos;Institution</label>
              <input
                type="text"
                readOnly
                value={user?.institution_name || unsupportedValue}
                className={readOnlyInputClass}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Année Académique Active</label>
              <select
                value={selectedAcademicYearId ?? ''}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedAcademicYearId(e.target.value ? Number(e.target.value) : null)}
                disabled={loading || academicYears.length === 0}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-[#0f2863] focus:ring-1 focus:ring-[#0f2863] outline-none transition-all text-sm font-medium text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
              >
                {academicYears.length === 0 ? (
                  <option value="">{loading ? 'Chargement...' : 'Aucune année disponible'}</option>
                ) : (
                  academicYears.map((year: AcademicYear) => (
                    <option key={year.id} value={year.id}>
                      {year.label}{year.is_locked ? ' • verrouillée' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Email Officiel</label>
              <input type="email" readOnly value={unsupportedValue} className={readOnlyInputClass} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Téléphone</label>
              <input type="tel" readOnly value={unsupportedValue} className={readOnlyInputClass} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Adresse complète</label>
              <textarea readOnly value={unsupportedValue} className={readOnlyTextAreaClass}></textarea>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-sm font-bold text-[#0f2863] uppercase tracking-wider mb-6">IDENTITÉ VISUELLE</h2>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Logo de l&apos;Institution</label>
              <div className="flex items-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Endpoint backend non disponible pour la gestion des médias institutionnels dans ce scope frontend.
              </div>
            </div>

            <div className="space-y-2 mt-8">
              <label className="text-xs font-bold text-slate-700">Cachet et Signature (pour les PDFs)</label>
              <div className="flex items-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Endpoint backend non disponible pour la gestion du cachet/signature institutionnels.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100">
          <h2 className="text-sm font-bold text-[#0f2863] uppercase tracking-wider mb-2">DATES DES CAMPAGNES ACADÉMIQUES</h2>
          <p className="text-xs text-slate-500 mb-6">
            Les dates métier d&apos;inscription/réinscription ne sont pas exposées par un endpoint dédié. Les seules dates backend disponibles ici sont celles de l&apos;année académique active.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="text-[10px] font-bold text-[#c01844] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c01844]"></span>
                CAMPAGNE D&apos;INSCRIPTION (APERÇU)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Début</label>
                  <input type="text" readOnly value={currentAcademicYear?.start_date || unsupportedValue} className={readOnlyInputClass} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Fin</label>
                  <input type="text" readOnly value={currentAcademicYear?.end_date || unsupportedValue} className={readOnlyInputClass} />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="text-[10px] font-bold text-[#0f2863] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0f2863]"></span>
                CAMPAGNE DE RÉINSCRIPTION (APERÇU)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Début</label>
                  <input type="text" readOnly value={currentAcademicYear?.start_date || unsupportedValue} className={readOnlyInputClass} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Fin</label>
                  <input type="text" readOnly value={currentAcademicYear?.end_date || unsupportedValue} className={readOnlyInputClass} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100">
          <h2 className="text-sm font-bold text-[#0f2863] uppercase tracking-wider mb-2">RÈGLEMENT DES EXAMENS</h2>
          <p className="text-xs text-slate-500 mb-6">Le texte de règlement institutionnel n&apos;est pas encore servi par une API dédiée dans le backend actuel.</p>
          <textarea readOnly value={unsupportedValue} className="w-full h-32 p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none transition-all text-sm resize-none font-medium text-slate-500"></textarea>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || loading || !selectedAcademicYearId}
            className="bg-[#0f2863] hover:bg-[#1a387e] active:scale-[0.98] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Enregistrement...' : 'ENREGISTRER L’ANNÉE ACTIVE'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-slate-400"><Database className="w-5 h-5" /></div>
          <h2 className="text-sm font-bold text-[#0f2863] uppercase tracking-wider">ÉTAT DU SYSTÈME</h2>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Ce bloc ne lance pas de migration frontend-only. Il relit l&apos;état administrateur déjà exposé par le backend, notamment la phase de verrouillage des examens.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700 leading-relaxed space-y-1">
            <p><strong>Phase actuelle :</strong> {systemState.current_phase || 'Indisponible'}</p>
            <p><strong>Historique d&apos;audit chargé :</strong> {systemState.audits?.length ?? 0} entrées</p>
          </div>
        </div>

        <button
          onClick={handleRefreshSystem}
          disabled={isRefreshingSystem}
          className="bg-[#0f2863] hover:bg-[#1a387e] active:scale-[0.98] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
        >
          {isRefreshingSystem ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {isRefreshingSystem ? 'Rafraîchissement...' : 'RAFRAÎCHIR L’ÉTAT DU SYSTÈME'}
        </button>
      </div>
    </div>
  )
}
