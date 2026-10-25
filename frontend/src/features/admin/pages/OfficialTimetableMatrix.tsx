import { useState,useMemo,useEffect } from 'react'
import { cn } from '@/shared/lib/utils'
import {
FileText,
Search,
X,
RotateCcw,
Calendar,
Settings,
Check,
Sparkles,
Building2,
DoorOpen,
GraduationCap,
BookOpen,
Clock,
Users,
Layers,
ArrowUpRight
} from 'lucide-react'
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
  const rawRows = useMemo(() => (section?.rows || []), [section])
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
    <div className="space-y-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-border rounded-2xl p-5 sm:p-7 shadow-sm shadow-slate-200/40 dark:shadow-none transition-all">
      
      {/* ─── EN-TÊTE DE LA SECTION & BOUTON EXPORT PDF ─── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border dark:border-slate-800/80">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white text-[11px] font-bold uppercase tracking-wider shadow-sm shadow-blue-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {section.filiere_code || 'FILÈRE'}
            </span>
            <h3 className="text-lg font-bold tracking-tight text-foreground dark:text-white">
              {section.title}
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-500/10 text-primary dark:text-blue-300 border border-blue-500/20">
              Document officiel
            </span>
            {searchQuery.trim() && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/5 dark:bg-indigo-950/60 text-primary dark:text-indigo-300 border border-primary/20 dark:border-indigo-800/50">
                {rows.length} résultat(s)
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground flex items-center gap-2">
            <span>{section.filiere_name}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
            <span className="font-bold text-slate-700 dark:text-foreground">{section.semester_label}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
            <span>Année Universitaire {section.academic_year}</span>
          </p>

          {/* Sub-group architecture pills */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40">
              <BookOpen className="w-3 h-3 text-primary dark:text-blue-400" />
              <span className="text-[10px] font-bold text-primary dark:text-blue-300">CM → Section entière (Amphi)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40">
              <Users className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">TD/TP → G?.1 • G?.2 (Ordre alpha)</span>
            </div>
          </div>
        </div>

        <a
          href={exportUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group shrink-0"
        >
          <FileText className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
          <span>Télécharger {section.filiere_code || ''} (PDF Officiel 1 Page)</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-200" />
        </a>
      </div>

      {/* ─── BANNIÈRE OFFICIELLE DES DATES DE DÉMARRAGE (CONFORME ENCG) ─── */}
      <div className="bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/40 dark:from-slate-800/70 dark:via-blue-950/30 dark:to-slate-900 border border-primary/20 dark:border-blue-900/40 rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card dark:bg-slate-800/90 border border-blue-200/60 dark:border-blue-800/50 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-muted-foreground dark:text-foreground font-medium">Démarrage des cours (CM) :</span>
            <strong className="font-bold text-blue-950 dark:text-white underline decoration-blue-400 underline-offset-2">
              {coursStart}
            </strong>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card dark:bg-slate-800/90 border border-purple-200/60 dark:border-purple-800/50 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            <span className="text-muted-foreground dark:text-foreground font-medium">Démarrage des TD/TP :</span>
            <strong className="font-bold text-purple-950 dark:text-purple-200 underline decoration-purple-400 underline-offset-2">
              {tdDisplay}
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenConfig}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-card dark:bg-card hover:bg-muted dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-foreground border border-slate-200/80 dark:border-border transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
          title="Modifier les dates officielles de démarrage pour l'affichage et l'export PDF"
        >
          <Settings className="w-3.5 h-3.5 text-primary dark:text-blue-400 group-hover:rotate-45 transition-transform" />
          <span>Configurer dates</span>
        </button>
      </div>

      {/* ─── TABLE DE LA GRILLE OFFICIELLE ─── */}
      <div className="overflow-hidden border border-slate-200/80 dark:border-slate-700/80 rounded-2xl bg-card dark:bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] border-collapse text-[11px] table-fixed">
            <colgroup>
              <col style={{ width: '7%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '9.8%' }} />
              <col style={{ width: '9.8%' }} />
              <col style={{ width: '9.8%' }} />
              <col style={{ width: '9.8%' }} />
              <col style={{ width: '9.8%' }} />
              <col style={{ width: '11%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gradient-to-r from-[#001A4B] via-[#07255E] to-[#0A1833] text-white">
                <th className="py-3 px-2 font-bold text-center text-[10.5px] uppercase tracking-wider text-blue-100 border-r border-white/10">Semestre</th>
                <th className="py-3 px-2 font-bold text-center text-[10.5px] uppercase tracking-wider text-blue-100 border-r border-white/10">Modules</th>
                <th className="py-3 px-2 font-bold text-center text-[10.5px] uppercase tracking-wider text-blue-100 border-r border-white/10">Éléments de modules</th>
                <th className="py-3 px-2 font-bold text-center text-[10.5px] uppercase tracking-wider text-blue-100 border-r border-white/10">Intervenants</th>
                {DAYS.map((d) => (
                  <th key={d} className="py-3 px-2 font-bold text-center text-[10.5px] uppercase tracking-wider text-blue-100 border-r border-white/10">{d}</th>
                ))}
                <th className="py-3 px-2 font-bold text-center text-[10.5px] uppercase tracking-wider text-blue-100">Salles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400 font-medium">
                    Aucune séance correspondante aux critères de recherche
                  </td>
                </tr>
              ) : rows.map((row: any, index: number) => {
                // Détecter type de séance
                const isCm = row.session_type === 'cm' || (row.element_name || '').startsWith('CM ')
                const isTd = row.session_type === 'td' || (row.element_name || '').startsWith('TD ')
                const isTp = row.session_type === 'tp' || (row.element_name || '').startsWith('TP ')
                
                // Nettoyer libellé de l'élément
                const cleanElementName = (row.element_name || '')
                  .replace(/^(CM|TD|TP)\s+/i, '')

                return (
                  <tr 
                    key={`${section.filiere_code}-${section.semester_number}-${row.module_label}-${row.professor_id}-${index}`}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {index === 0 && (
                      <td 
                        rowSpan={rows.length} 
                        className="p-3 text-center align-middle bg-slate-50/90 dark:bg-slate-800/60 border-r border-slate-200/80 dark:border-border"
                      >
                        <div className="inline-flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-blue-600/15 dark:from-blue-500/20 dark:to-indigo-500/20 border border-blue-200/70 dark:border-blue-800/50 shadow-2xs">
                          <GraduationCap className="w-5 h-5 text-primary dark:text-blue-300 mb-1" />
                          <span className="font-bold text-xs text-[#001A4B] dark:text-blue-200 leading-tight">
                            {section.semester_label}
                          </span>
                        </div>
                      </td>
                    )}

                    {row.show_module && (
                      <td 
                        rowSpan={row.module_rowspan} 
                        className="p-3 text-center align-middle bg-slate-50/40 dark:bg-slate-800/20 border-r border-slate-200/80 dark:border-border"
                      >
                        <div className="flex items-center gap-2 justify-center px-1">
                          <span className="w-5 h-5 rounded-full bg-primary/10 dark:bg-blue-900/60 text-primary dark:text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-primary shadow-2xs">
                            {row.module_index}
                          </span>
                          <span className="font-bold text-foreground dark:text-foreground text-left leading-snug">
                            {row.module_name}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Éléments de modules avec badge CM / TD / TP */}
                    <td className="p-2.5 border-r border-slate-200/80 dark:border-border">
                      <div className="flex items-center gap-1.5">
                        {isCm && (
                          <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-bold bg-primary/10 text-primary dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300/60 dark:border-blue-800/60 shadow-2xs shrink-0">
                            CM
                          </span>
                        )}
                        {isTd && (
                          <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300/60 dark:border-purple-800/60 shadow-2xs shrink-0">
                            TD
                          </span>
                        )}
                        {isTp && (
                          <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60 shadow-2xs shrink-0">
                            TP
                          </span>
                        )}
                        <span className="font-semibold text-slate-700 dark:text-foreground leading-tight">
                          {cleanElementName}
                        </span>
                      </div>
                    </td>

                    {/* Intervenants */}
                    <td className="p-2.5 border-r border-slate-200/80 dark:border-border">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs ring-2 ring-white dark:ring-slate-900" 
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="font-bold text-xs truncate" style={{ color: row.color }}>
                          {row.professor_name}
                        </span>
                      </div>
                    </td>

                    {/* Créneaux par Jour (Lundi à Vendredi) */}
                    {[1, 2, 3, 4, 5].map((day) => (
                      <td key={day} className="p-1.5 align-middle text-center border-r border-slate-200/80 dark:border-border">
                        <div className="flex flex-col items-center gap-1">
                          {(row.days?.[day] || []).map((slot: string) => {
                            const matchSub = slot.match(/^(G\d+(?:\.\d+)?):\s*(.*)$/i)
                            if (matchSub) {
                              const groupTag = matchSub[1]
                              const isSubGroup = groupTag.includes('.')
                              const timeRange = matchSub[2]

                              return (
                                <div 
                                  key={slot} 
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-xl border shadow-2xs hover:scale-105 transition-transform",
                                    isSubGroup 
                                      ? "bg-gradient-to-r from-purple-50 to-pink-50/80 dark:from-purple-950/50 dark:to-pink-950/40 border-purple-200/80 dark:border-purple-800/60"
                                      : "bg-gradient-to-r from-blue-50 to-indigo-50/80 dark:from-blue-950/50 dark:to-indigo-950/40 border-blue-200/80 dark:border-blue-800/60"
                                  )}
                                >
                                  <span className={cn(
                                    "px-1.5 py-0.2 rounded-md text-[9.5px] font-bold tracking-wide text-white shadow-2xs",
                                    isSubGroup ? "bg-purple-600" : "bg-primary"
                                  )}>
                                    {groupTag}
                                  </span>
                                  <span className={cn(
                                    "font-mono text-[10px] font-bold tracking-tight",
                                    isSubGroup ? "text-purple-950 dark:text-purple-200" : "text-blue-950 dark:text-blue-200"
                                  )}>
                                    {timeRange}
                                  </span>
                                </div>
                              )
                            }
                            return (
                              <div key={slot} className="text-[10px] whitespace-nowrap font-mono font-bold text-muted-foreground dark:text-foreground">
                                {slot}
                              </div>
                            )
                          })}
                        </div>
                      </td>
                    ))}

                    {/* Salles */}
                    <td className="p-2 text-center align-middle">
                      {row.room_label ? (
                        row.room_label.toLowerCase().includes('amphi') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/50 shadow-2xs">
                            <Building2 className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{row.room_label}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-bold bg-muted dark:bg-card text-foreground dark:text-foreground border border-border dark:border-border shadow-2xs">
                            <DoorOpen className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>{row.room_label}</span>
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── LÉGENDE PÉDAGOGIQUE OFFICIELLE ENCG FÈS ─── */}
      <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border dark:border-slate-800/60">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-primary/20 dark:border-blue-900/40">
          <span className="w-5 h-5 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-[8px] font-bold shrink-0">G1</span>
          <span className="text-[10px] font-semibold text-slate-700 dark:text-foreground">Section entière — Amphi (CM)</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
          <span className="w-5 h-5 rounded-md bg-purple-600 flex items-center justify-center text-white text-[7px] font-bold shrink-0">G1.1</span>
          <span className="text-[10px] font-semibold text-slate-700 dark:text-foreground">Sous-groupe TD/TP (alpha)</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
          <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-[10px] font-semibold text-slate-700 dark:text-foreground">Amphithéâtre / Salle</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-border dark:border-border">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-[10px] font-semibold text-muted-foreground dark:text-muted-foreground">Norme mono-shift ENCG</span>
        </div>
      </div>

    </div>
  )
}

export default function OfficialTimetableMatrix({ matrix }: { matrix: any }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [coursStart, setCoursStart] = useState<string>('')
  const [tdTpStart, setTdTpStart] = useState<string>('')
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [tempCoursStart, setTempCoursStart] = useState<string>('')
  const [tempTdTpStart, setTempTdTpStart] = useState<string>('')
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
    return (
      <div className="py-16 text-center space-y-3 bg-card dark:bg-card rounded-2xl border border-border dark:border-border p-8">
        <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto animate-pulse" />
        <p className="text-sm font-bold text-muted-foreground dark:text-muted-foreground">
          Chargement de la matrice officielle des emplois du temps (toutes filières / semestres)...
        </p>
      </div>
    )
  }

  const sections = matrix.sections || (matrix.rows ? [matrix] : [])

  if (sections.length === 0) {
    return (
      <div className="py-16 text-center space-y-3 bg-card dark:bg-card rounded-2xl border border-border dark:border-border p-8">
        <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="text-sm font-bold text-muted-foreground dark:text-muted-foreground">
          Aucune séance pour ce filtre. Choisissez une autre filière ou un autre semestre (S1–S10).
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* ─── BARRE DE CONTRÔLE ET ACTIONS ADMINISTRATIVES ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-border shadow-sm">
        
        {/* Barre de recherche temps réel */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-primary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par module, enseignant, salle, créneau..."
            className="w-full pl-10 pr-8 py-2.5 bg-muted/50 dark:bg-card border border-border dark:border-border text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs transition-all rounded-[var(--control-radius)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-muted-foreground p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Boutons d'actions rapides */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
          <button
            type="button"
            disabled={isDispatchingSubGroups}
            onClick={handleDispatchSubGroups}
            className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white shadow-sm shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Découpage automatique de chaque section en sous-groupes TD (G1.1, G1.2) par ordre alphabétique officiel"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200 animate-spin-slow" />
            <span>{isDispatchingSubGroups ? 'Répartition...' : '⚡ Répartir Sous-Groupes TD (Alpha)'}</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-muted/50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span>{sections.length} grille{sections.length > 1 ? 's' : ''} officielle{sections.length > 1 ? 's' : ''}</span>
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 font-bold cursor-pointer ml-1"
            >
              <RotateCcw className="w-3 h-3" /> Effacer filtre
            </button>
          )}
        </div>
      </div>

      {/* ─── LISTE DES GRILLES DE SECTIONS ─── */}
      <div className="space-y-8">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-card dark:bg-card rounded-2xl border border-border dark:border-border p-6 max-w-md w-full shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-primary/5 dark:bg-blue-950/60 text-[#0f2863] dark:text-blue-400 border border-primary/20 dark:border-blue-900/50">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground dark:text-white">Configuration des Dates Officielles</h3>
                  <p className="text-[11px] text-slate-400 font-medium">En-tête de l'emploi du temps & Export PDF officiel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-muted-foreground dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-foreground">
                  🏛️ Date de Démarrage des Cours (CM) :
                </label>
                <input
                  type="text"
                  value={tempCoursStart}
                  onChange={(e) => setTempCoursStart(e.target.value)}
                  placeholder="JJ/MM/AAAA"
                  className="w-full px-3.5 py-2.5 bg-muted/50 dark:bg-card border border-border dark:border-border text-xs font-bold text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs rounded-[var(--control-radius)]"
                />
                <span className="text-[10.5px] text-slate-400 italic">Format : JJ/MM/AAAA</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-foreground">
                  📝 Date de Démarrage des TD / TP :
                </label>
                <input
                  type="text"
                  value={tempTdTpStart}
                  onChange={(e) => setTempTdTpStart(e.target.value)}
                  placeholder="JJ/MM/AAAA"
                  className="w-full px-3.5 py-2.5 bg-muted/50 dark:bg-card border border-border dark:border-border text-xs font-bold text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs rounded-[var(--control-radius)]"
                />
                <span className="text-[10.5px] text-slate-400 italic">Format : JJ/MM/AAAA</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border dark:border-border">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground dark:text-foreground hover:bg-muted dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
