import React, { useState, useMemo, useEffect } from 'react'
import { cn } from '@/shared/lib/utils'
import { FileText, Search, X, RotateCcw, Calendar, Settings, Check, Sparkles } from 'lucide-react'
import api from '@/shared/lib/api'
import { toast } from 'sonner'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']

interface SectionTableProps {
  section: any
  searchQuery: string
  coursStart: string
  tdTpStart: string
  onOpenConfig: () => void
}

function SectionTable({ section, searchQuery, coursStart, tdTpStart, onOpenConfig }: SectionTableProps) {
  const rawRows = section?.rows || []
  const filiereId = section?.filiere_id || 0
  const semesterNum = section?.semester_number || ''

  const tdDisplay = useMemo(() => {
    if (!tdTpStart) return 'la semaine du 07/10/2024'
    return tdTpStart.startsWith('la semaine du') ? tdTpStart : `la semaine du ${tdTpStart}`
  }, [tdTpStart])

  const coursParam = coursStart ? `&cours_start=${encodeURIComponent(coursStart)}` : ''
  const tdParam = tdTpStart ? `&td_tp_start=${encodeURIComponent(tdTpStart)}` : ''
  const exportUrl = filiereId 
    ? `/api/timetable/export/filiere/${filiereId}/pdf?semester_number=${semesterNum || ''}${coursParam}${tdParam}`
    : `/api/timetable/export/all/0/pdf?semester_number=${semesterNum || ''}${coursParam}${tdParam}`

  const rows = useMemo(() => {
    if (!searchQuery.trim()) return rawRows
    const q = searchQuery.toLowerCase().trim()
    return rawRows.filter((r: any) => 
      String(r.module_label || '').toLowerCase().includes(q) ||
      String(r.element_name || '').toLowerCase().includes(q) ||
      String(r.professor_name || '').toLowerCase().includes(q) ||
      String(r.room_label || '').toLowerCase().includes(q)
    )
  }, [rawRows, searchQuery])

  if (searchQuery.trim() && rows.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-xs">
      {/* ─── EN-TÊTE DE LA SECTION & BOUTON EXPORT PDF ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#0f2863] text-white text-[10px] font-black uppercase tracking-wider">
              {section.filiere_code || 'FILIÈRE'}
            </span>
            <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">{section.title}</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
              Document officiel
            </span>
            {searchQuery.trim() && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                {rows.length} résultat(s)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{section.filiere_name} · {section.semester_label} · Année {section.academic_year}</p>
        </div>

        <a
          href={exportUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:bg-slate-800 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span>Télécharger {section.filiere_code || ''} (PDF Officiel)</span>
        </a>
      </div>

      {/* ─── BANNIÈRE OFFICIELLE DES DATES DE DÉMARRAGE (CONFORME ENCG) ─── */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-slate-50 dark:from-slate-800/90 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/40 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 text-xs text-[#0f2863] dark:text-blue-300">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">
              Démarrage des cours le <strong className="font-black text-blue-950 dark:text-white underline decoration-blue-400">{coursStart}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-600 font-bold">—</span>
            <span className="font-semibold">
              Démarrage des TD/TP : <strong className="font-black text-indigo-950 dark:text-indigo-200 underline decoration-indigo-400">{tdDisplay}</strong>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenConfig}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-[11px] font-bold text-[#0f2863] dark:text-blue-300 border border-blue-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
          title="Modifier les dates officielles de démarrage pour l'affichage et l'export PDF"
        >
          <Settings className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          <span>Configurer dates</span>
        </button>
      </div>

      {/* ─── TABLE DE LA GRILLE OFFICIELLE ─── */}
      <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full min-w-[980px] border-collapse text-[11px] table-fixed">
          <colgroup>
            <col style={{ width: '7.5%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '14.5%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
          </colgroup>
          <thead>
            <tr className="bg-[#0f2863] text-white">
              <th className="border border-blue-900 p-2 font-black text-center text-white">Semestre</th>
              <th className="border border-blue-900 p-2 font-black text-center text-white">Modules</th>
              <th className="border border-blue-900 p-2 font-black text-center text-white">Éléments de modules</th>
              <th className="border border-blue-900 p-2 font-black text-center text-white">Intervenants</th>
              {DAYS.map((d) => (
                <th key={d} className="border border-blue-900 p-2 font-black text-center text-white">{d}</th>
              ))}
              <th className="border border-blue-900 p-2 font-black text-center text-white">Salles</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-400">Aucune séance correspondante</td>
              </tr>
            ) : rows.map((row: any, index: number) => (
              <tr key={`${section.filiere_code}-${section.semester_number}-${row.module_label}-${row.professor_id}-${index}`}>
                {index === 0 && (
                  <td rowSpan={rows.length} className="border border-slate-300 dark:border-slate-700 p-2 text-center font-black align-middle bg-slate-50 dark:bg-slate-800/50">
                    {section.semester_label}
                  </td>
                )}
                {row.show_module && (
                  <td rowSpan={row.module_rowspan} className="border border-slate-300 dark:border-slate-700 p-2 text-center font-black align-middle bg-slate-50/50 dark:bg-slate-800/30">
                    {row.module_label}
                  </td>
                )}
                <td className="border border-slate-300 dark:border-slate-700 p-2 font-medium">{row.element_name}</td>
                <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold" style={{ color: row.color }}>{row.professor_name}</td>
                {[1, 2, 3, 4, 5].map((day) => (
                  <td key={day} className={cn('border border-slate-300 dark:border-slate-700 p-1.5 align-middle text-center font-bold')} style={{ color: row.color }}>
                    {(row.days?.[day] || []).map((slot: string) => {
                      const matchSub = slot.match(/^(G\d+(?:\.\d+)?):\s*(.*)$/i)
                      if (matchSub) {
                        const groupTag = matchSub[1]
                        const isSubGroup = groupTag.includes('.')
                        const timeRange = matchSub[2]
                        return (
                          <div key={slot} className="text-[10.5px] whitespace-nowrap py-0.5">
                            <span className={cn(
                              "px-1 py-0.2 rounded font-extrabold mr-1",
                              isSubGroup 
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-200" 
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200"
                            )}>
                              {groupTag}
                            </span>
                            <span className="font-mono">{timeRange}</span>
                          </div>
                        )
                      }
                      return (
                        <div key={slot} className="text-[10.5px] whitespace-nowrap font-mono">{slot}</div>
                      )
                    })}
                  </td>
                ))}
                <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold">{row.room_label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function OfficialTimetableMatrix({ matrix }: { matrix: any }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [coursStart, setCoursStart] = useState<string>('16/09/2024')
  const [tdTpStart, setTdTpStart] = useState<string>('07/10/2024')
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [tempCoursStart, setTempCoursStart] = useState<string>('16/09/2024')
  const [tempTdTpStart, setTempTdTpStart] = useState<string>('07/10/2024')
  const [isSavingDates, setIsSavingDates] = useState(false)
  const [isDispatchingSubGroups, setIsDispatchingSubGroups] = useState(false)

  const handleDispatchSubGroups = async () => {
    try {
      setIsDispatchingSubGroups(true)
      const res = await api.post('/groups/dispatch-subgroups')
      toast.success(res.data?.message || 'Sous-groupes TD (G1.1, G1.2) répartis avec succès par ordre alphabétique !')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la répartition des sous-groupes')
    } finally {
      setIsDispatchingSubGroups(false)
    }
  }

  // Initialiser les dates à partir de la matrice ou de la config persistée
  useEffect(() => {
    if (matrix?.cours_start) {
      setCoursStart(matrix.cours_start)
      setTempCoursStart(matrix.cours_start)
    }
    if (matrix?.td_tp_start) {
      setTdTpStart(matrix.td_tp_start)
      setTempTdTpStart(matrix.td_tp_start)
    }
  }, [matrix?.cours_start, matrix?.td_tp_start])

  // Charger la configuration sauvegardée
  useEffect(() => {
    api.get('/timetable/dates-config')
      .then((res) => {
        if (res.data?.data) {
          const cfg = res.data.data
          if (cfg.cours_start) {
            setCoursStart(cfg.cours_start)
            setTempCoursStart(cfg.cours_start)
          }
          if (cfg.td_tp_start) {
            setTdTpStart(cfg.td_tp_start)
            setTempTdTpStart(cfg.td_tp_start)
          }
        }
      })
      .catch(() => {})
  }, [])

  const handleSaveDates = async () => {
    try {
      setIsSavingDates(true)
      await api.post('/timetable/dates-config', {
        cours_start: tempCoursStart,
        td_tp_start: tempTdTpStart,
      })
      setCoursStart(tempCoursStart)
      setTdTpStart(tempTdTpStart)
      setIsConfigOpen(false)
      toast.success('📅 Dates officielles de démarrage enregistrées avec succès !')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement des dates')
    } finally {
      setIsSavingDates(false)
    }
  }

  if (!matrix) {
    return <p className="text-sm text-slate-400 py-10 text-center">Charge des emplois du temps pour voir le modèle officiel (toutes filières / semestres).</p>
  }

  const sections = matrix.sections || (matrix.rows ? [matrix] : [])

  if (sections.length === 0) {
    return <p className="text-sm text-slate-400 py-10 text-center">Aucune séance pour ce filtre. Choisissez une autre filière ou un autre semestre (S1–S10).</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer la matrice par module, intervenant, salle..."
            className="w-full pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <button
            type="button"
            disabled={isDispatchingSubGroups}
            onClick={handleDispatchSubGroups}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Découpage automatique de chaque section en sous-groupes TD (G1.1, G1.2) par ordre alphabétique officiel"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isDispatchingSubGroups ? 'Répartition...' : '⚡ Répartir Sous-Groupes TD (Alpha)'}</span>
          </button>

          <span>{sections.length} grille{sections.length > 1 ? 's' : ''} · format officiel affichage ENCG Fès</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Effacer filtre
            </button>
          )}
        </div>
      </div>

      <div className="space-y-10">
        {sections.map((section: any) => (
          <SectionTable 
            key={`${section.filiere_id}-${section.semester_number}-${section.filiere_code}`} 
            section={section} 
            searchQuery={searchQuery}
            coursStart={coursStart}
            tdTpStart={tdTpStart}
            onOpenConfig={() => {
              setTempCoursStart(coursStart)
              setTempTdTpStart(tdTpStart)
              setIsConfigOpen(true)
            }}
          />
        ))}
      </div>

      {/* ─── MODAL DE CONFIGURATION DES DATES OFFICIELLES ─── */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0f2863] dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Configuration des Dates Officielles</h3>
                  <p className="text-[11px] text-slate-400 font-medium">En-tête de l'emploi du temps & Export PDF officiel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  🏛️ Date de Démarrage des Cours (CM) :
                </label>
                <input
                  type="text"
                  value={tempCoursStart}
                  onChange={(e) => setTempCoursStart(e.target.value)}
                  placeholder="Ex: 16/09/2024"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-[10.5px] text-slate-400 italic">Exemple standard ENCG : 16/09/2024</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  📝 Date de Démarrage des TD / TP :
                </label>
                <input
                  type="text"
                  value={tempTdTpStart}
                  onChange={(e) => setTempTdTpStart(e.target.value)}
                  placeholder="Ex: 07/10/2024 ou la semaine du 07/10/2024"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-[10.5px] text-slate-400 italic">Exemple standard ENCG : la semaine du 07/10/2024</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSavingDates || !tempCoursStart.trim() || !tempTdTpStart.trim()}
                onClick={handleSaveDates}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0f2863] hover:bg-[#1a3a8a] text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingDates ? 'Enregistrement...' : 'Enregistrer & Appliquer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
