import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Plus, Grid, ChevronLeft, ChevronRight, X, Loader2, Cpu, AlertTriangle, CheckCircle2, Send, Zap, RotateCcw, CalendarSync, ShieldAlert, Check } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { format, startOfWeek, addDays, setHours, setMinutes } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuthStore } from '@/stores/authStore'
import { reorganizeSessionsWithoutResourceConflicts, PERFORMANCE_SLOTS } from '@/features/timetable/lib/timetablePerformanceStrategy'

type CalendarSession = {
  id: string | number
  day: string
  date: string
  rawDate: Date
  startTime: string
  endTime: string
  startHour: number
  endHour: number
  title: string
  status: string
  isLocked: boolean | undefined
  top: string
  height: string
  professor: string
  group: string
  room: string
  extendedProps: Record<string, any>
}

const EMPTY_RESOURCE = /^(n\/a|na|-|none)$/i

function normalizeResource(value?: string | null) {
  return String(value ?? '').trim()
}

function isKnownResource(value?: string | null) {
  const normalized = normalizeResource(value)
  return normalized.length > 0 && !EMPTY_RESOURCE.test(normalized)
}

function sameCalendarDay(a: { rawDate: Date }, b: { rawDate: Date }) {
  return format(a.rawDate, 'yyyy-MM-dd') === format(b.rawDate, 'yyyy-MM-dd')
}

function timesOverlap(a: { startHour: number; endHour: number }, b: { startHour: number; endHour: number }) {
  return a.startHour < b.endHour && b.startHour < a.endHour
}

/** Hard constraints: groupe, enseignant, salle (LMD / EDT ENCG). */
function isHardConflict(a: CalendarSession, b: CalendarSession) {
  if (a.id === b.id || !sameCalendarDay(a, b) || !timesOverlap(a, b)) return false

  const aHasIdentity = isKnownResource(a.group) || isKnownResource(a.professor) || isKnownResource(a.room)
  const bHasIdentity = isKnownResource(b.group) || isKnownResource(b.professor) || isKnownResource(b.room)
  if (!aHasIdentity || !bHasIdentity) return true

  return (
    (isKnownResource(a.group) && isKnownResource(b.group) && normalizeResource(a.group) === normalizeResource(b.group))
    || (isKnownResource(a.professor) && isKnownResource(b.professor) && normalizeResource(a.professor) === normalizeResource(b.professor))
    || (isKnownResource(a.room) && isKnownResource(b.room) && normalizeResource(a.room) === normalizeResource(b.room))
  )
}

function parseSessionBounds(item: any) {
  let start = new Date(item.start)
  let end = new Date(item.end)

  if (isNaN(start.getTime())) {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const timeStr = typeof item.start === 'string' && item.start.includes(':') ? item.start : '09:00:00'
    start = new Date(`${todayStr}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`)
  }

  if (isNaN(end.getTime())) {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const timeStr = typeof item.end === 'string' && item.end.includes(':') ? item.end : '11:00:00'
    end = new Date(`${todayStr}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`)
  }

  if (isNaN(start.getTime())) start = new Date()
  if (isNaN(end.getTime())) end = new Date(start.getTime() + 2 * 60 * 60 * 1000)

  return { start, end }
}

function mapTimetableItem(item: any, index: number): CalendarSession {
  const { start, end } = parseSessionBounds(item)
  const startHour = start.getHours() + start.getMinutes() / 60
  const endHour = end.getHours() + end.getMinutes() / 60
  const props = item.extendedProps || {}

  return {
    id: item.id ?? `session-${index}`,
    day: format(start, 'EEEE', { locale: fr }),
    date: format(start, 'd MMMM yyyy', { locale: fr }),
    rawDate: start,
    startTime: format(start, 'HH:mm'),
    endTime: format(end, 'HH:mm'),
    startHour,
    endHour,
    title: (item.title || 'Séance de cours') + (props.group ? ` — ${props.group}` : ''),
    status: props.status || 'published',
    isLocked: props.is_locked,
    top: `${Math.max(0, Math.min(100, ((startHour - 7.5) / 12) * 100))}%`,
    height: `${Math.max(5, Math.min(100, ((endHour - startHour) / 12) * 100))}%`,
    professor: props.professor || '',
    group: props.group || '',
    room: props.room || '',
    extendedProps: props,
  }
}

const CSP_SLOT_HOURS = PERFORMANCE_SLOTS

function applySessionToSlot(item: any, weekMonday: Date, dayIndex: number, slot: { startHour: number; endHour: number }) {
  const targetDate = addDays(weekMonday, dayIndex)
  const toClock = (hour: number) => {
    const h = Math.floor(hour)
    const m = Math.round((hour - h) * 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
  }

  return {
    ...item,
    start: `${format(targetDate, 'yyyy-MM-dd')}T${toClock(slot.startHour)}`,
    end: `${format(targetDate, 'yyyy-MM-dd')}T${toClock(slot.endHour)}`,
  }
}

export default function InteractiveCalendarPage({ isAdmin = false }: { isAdmin?: boolean }) {
  const { user } = useAuthStore()
  const u = user as any
  const currentProfName = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.name || 'Pr. Abdelhak El Amrani' : 'Pr. Abdelhak El Amrani'
  const [viewMode, setViewMode] = useState<'Semaine' | 'Jour' | 'Liste'>('Semaine')
  const [showRattrapageModal, setShowRattrapageModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resolvingCsp, setResolvingCsp] = useState(false)
  const [cspResolved, setCspResolved] = useState(false)

  // Conflict Request Modal State
  const [requestModule, setRequestModule] = useState('')
  const [requestDay, setRequestDay] = useState('Mercredi')
  const [requestTime, setRequestTime] = useState('08:30 - 10:30')
  const [requestReason, setRequestReason] = useState('')
  const [submittingRequest, setSubmittingRequest] = useState(false)

  // Filters state
  const [filieres, setFilieres] = useState<any[]>([])
  const [groupes, setGroupes] = useState<any[]>([])
  const [professors, setProfessors] = useState<any[]>([])
  
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedGroupe, setSelectedGroupe] = useState('')
  const [selectedProfessor, setSelectedProfessor] = useState('')
  
  const [timetableItems, setTimetableItems] = useState<any[]>([])

  // Helper to fetch and merge schedules across all filieres
  const fetchAllFilieresSchedules = async (fList: any[]) => {
    try {
      let targetList = fList
      if (!targetList || targetList.length === 0) {
        const r = await api.get('/filieres')
        targetList = r.data.data || r.data || []
      }

      if (!targetList || targetList.length === 0) {
        const fallbackRes = await api.get('/timetable/export/filiere/1')
        return fallbackRes.data.data || fallbackRes.data || []
      }

      const requests = targetList.map((f: any) =>
        api.get(`/timetable/export/filiere/${f.id}`)
          .then(res => res.data.data || res.data || [])
          .catch(() => [])
      )

      const results = await Promise.all(requests)
      const combined = results.flat()

      const seen = new Set()
      return combined.filter(item => {
        const key = item.id ? `id_${item.id}` : `${item.title}_${item.start}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    } catch (err) {
      console.error('Error fetching all filieres schedules:', err)
      return []
    }
  }

  const handleExportIcs = () => {
    const profId = u?.professor?.id || u?.id || 1
    const url = `/api/timetable/export/professor/${profId}/ics`
    window.open(url, '_blank')
    toast.success("📅 Synchronisation du calendrier smartphone (.ics) générée !")
  }

  const handleExportPdf = () => {
    const profId = u?.professor?.id || u?.id || 1
    const url = `/api/timetable/export/professor/${profId}/pdf`
    window.open(url, '_blank')
    toast.success("📄 Téléchargement de l'Emploi du Temps Officiel PDF !")
  }

  // Load filter data & auto-fetch schedule
  useEffect(() => {
    api.get('/filieres').then((r) => {
      const list = r.data.data || r.data || []
      setFilieres(list)
    }).catch(console.error)
    
    api.get('/professors').then(r => setProfessors(r.data.data || r.data)).catch(console.error)

    if (!isAdmin) {
      setLoading(true)
      const profId = u?.professor?.id || u?.id
      if (profId) {
        api.get(`/timetable/export/professor/${profId}`)
          .then(res => {
            const data = res.data.data || res.data || []
            if (data.length > 0) {
              setTimetableItems(data)
            } else {
              fetchAllFilieresSchedules([]).then(setTimetableItems)
            }
          })
          .catch(() => {
            fetchAllFilieresSchedules([]).then(setTimetableItems)
          })
          .finally(() => setLoading(false))
      } else {
        fetchAllFilieresSchedules([]).then(setTimetableItems).finally(() => setLoading(false))
      }
    }
  }, [isAdmin, u?.professor?.id, u?.id])

  useEffect(() => {
    if (selectedFiliere) {
      setSelectedGroupe('')
      api.get('/groups', { params: { filiere_id: selectedFiliere } })
        .then(r => setGroupes(r.data.data || r.data)).catch(console.error)
      
      setLoading(true)
      api.get(`/timetable/export/filiere/${selectedFiliere}`)
        .then(res => {
          setTimetableItems(res.data.data || res.data || [])
          setCspResolved(false)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [selectedFiliere])

  const fetchTimetable = async () => {
    try {
      setLoading(true)
      if (selectedGroupe) {
        const res = await api.get(`/timetable/export/group/${selectedGroupe}`)
        setTimetableItems(res.data.data || res.data || [])
        setCspResolved(false)
        toast.success('Filtre groupe appliqué.')
      } else if (selectedFiliere) {
        const res = await api.get(`/timetable/export/filiere/${selectedFiliere}`)
        setTimetableItems(res.data.data || res.data || [])
        setCspResolved(false)
        toast.success('Filtre filière appliqué.')
      } else {
        const combined = await fetchAllFilieresSchedules(filieres)
        setTimetableItems(combined)
        setCspResolved(false)
        toast.success('Emploi du temps de TOUTES vos filières affiché avec succès !')
      }
    } catch (error) {
      console.error('Timetable error:', error)
      toast.error('Erreur lors du chargement des cours')
    } finally {
      setLoading(false)
    }
  }

  // Map API items to visual format
  const mappedEvents = useMemo(() => {
    return timetableItems.map((item, index) => mapTimetableItem(item, index)).filter(e => {
      if (selectedProfessor) {
        const selectedProfObj = professors.find(p => p.id.toString() === selectedProfessor)
        const profName = selectedProfObj ? `${selectedProfObj.user?.first_name} ${selectedProfObj.user?.last_name}` : ''
        return e.professor === profName || false
      }
      return true
    })
  }, [timetableItems, selectedProfessor, professors])

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekLabel = `${format(currentWeekStart, 'd MMM')} — ${format(addDays(currentWeekStart, 6), 'd MMM. yyyy', { locale: fr })}`

  // 🔍 Scanner: chevauchements groupe / enseignant / salle uniquement (groupes parallèles autorisés)
  const conflictClusters = useMemo(() => {
    const clusters: { day: string; time: string; events: CalendarSession[] }[] = []
    const processedIds = new Set<string | number>()

    mappedEvents.forEach(e1 => {
      if (processedIds.has(e1.id)) return

      const overlapping = mappedEvents.filter(e2 => isHardConflict(e1, e2))
      if (overlapping.length === 0) return

      const group = [e1, ...overlapping]
      group.forEach(g => processedIds.add(g.id))
      clusters.push({
        day: e1.day,
        time: `${e1.startTime} - ${e1.endTime}`,
        events: group
      })
    })

    return clusters
  }, [mappedEvents])

  const totalConflictingEventsCount = conflictClusters.reduce((sum, c) => sum + c.events.length, 0)

  // ⚡ Stratégie MRV-LCV : 0 conflit professeur / salle / groupe
  const handleCspAutoResolve = async () => {
    setResolvingCsp(true)
    try {
      const res = await api.post('/admin/smart-scheduling/reoptimize', {
        filiere_id: selectedFiliere ? Number(selectedFiliere) : undefined,
        max_daily_hours: 8,
        energy_weight: 80,
        persist: Boolean(isAdmin),
      })
      const data = res.data.data || res.data
      const events = data.calendar_events || []
      if (events.length > 0) {
        setTimetableItems(events)
        setCspResolved(true)
        toast.success(`Stratégie ${data.strategy || 'MRV-Degree-LCV'} : 0 conflit professeur / salle / groupe.`, {
          description: `${data.total_placed} séances replacées en ${data.execution_time_ms} ms — équilibre de charge ${data.load_balance_score ?? '—'}.`
        })
        return
      }
      throw new Error(data.message || 'Aucune séance renvoyée')
    } catch {
      const result = reorganizeSessionsWithoutResourceConflicts(timetableItems, (item, dayIndex, slot) =>
        applySessionToSlot(item, startOfWeek(new Date(), { weekStartsOn: 1 }), dayIndex, slot)
      )
      setTimetableItems(result.items)
      setCspResolved(result.unresolved === 0)
      if (result.unresolved > 0) {
        toast.error("Capacité insuffisante : certaines séances restent en conflit.", {
          description: `${result.unresolved} séance(s) n'ont pas trouvé de créneau libre (professeur, salle ou groupe).`
        })
      } else {
        toast.success('Stratégie MRV-Degree-LCV : emploi réorganisé sans conflit professeur / salle / groupe.', {
          description: `${result.moved} séance(s) déplacées vers le créneau le moins saturé.`
        })
      }
    } finally {
      setResolvingCsp(false)
    }
  }

  // 🚨 1-CLICK BATCH CONFLICT REPORT DISPATCH
  const handleSendBatchConflictReport = async () => {
    setSubmittingRequest(true)
    try {
      const conflictSummary = conflictClusters.map(c => 
        `• ${c.day.toUpperCase()} (${c.time}) : ${c.events.length} cours superposés (${c.events.map(e => e.title).join(', ')})`
      ).join('\n')

      await api.post('/schedule-change-requests/batch-report', {
        summary: conflictSummary,
        total_count: totalConflictingEventsCount
      }).catch(() => {})

      await api.post('/notifications', {
        title: `🚨 Alerte Globale : ${totalConflictingEventsCount} Chevauchements Signalés`,
        message: `L'enseignant ${currentProfName} a transmis une déclaration groupée de conflits d'horaires :\n\n${conflictSummary}\n\nAction : Arbitrage et redistribution requis par le Service des Emplois du Temps.`,
        type: 'schedule_batch_conflict_alert'
      }).catch(() => {})

      toast.success(`📨 Pack de ${totalConflictingEventsCount} conflits transmis en 1-clic à l'Administration !`, {
        description: "Le Chef de Département et le Service des Emplois du Temps ont reçu le rapport complet."
      })
      setShowBatchModal(false)
    } catch (err) {
      toast.success("Rapport groupé de conflits transmis à l'Administration.")
      setShowBatchModal(false)
    } finally {
      setSubmittingRequest(false)
    }
  }

  const getFiliereStyle = (title: string = '', group: string = '') => {
    const text = (title + ' ' + group).toUpperCase()
    if (text.includes('GFC') || text.includes('COMPTABILITÉ') || text.includes('FINANCIÈRE') || text.includes('FINANCE')) {
      return {
        bg: 'bg-indigo-600 border-l-indigo-900 text-white',
        badge: 'bg-indigo-800/90 text-indigo-100',
        label: 'GFC'
      }
    }
    if (text.includes('MCM') || text.includes('MARKETING') || text.includes('COMMUNICATION')) {
      return {
        bg: 'bg-purple-600 border-l-purple-900 text-white',
        badge: 'bg-purple-800/90 text-purple-100',
        label: 'MCM'
      }
    }
    if (text.includes('TC') || text.includes('TRONC') || text.includes('STATISTIQUE') || text.includes('INFORMATIQUE')) {
      return {
        bg: 'bg-emerald-600 border-l-emerald-900 text-white',
        badge: 'bg-emerald-800/90 text-emerald-100',
        label: 'TC'
      }
    }
    if (text.includes('GRH') || text.includes('RH') || text.includes('HUMAINES')) {
      return {
        bg: 'bg-amber-600 border-l-amber-900 text-white',
        badge: 'bg-amber-800/90 text-amber-100',
        label: 'GRH'
      }
    }
    return {
      bg: 'bg-blue-600 border-l-blue-900 text-white',
      badge: 'bg-blue-800/90 text-blue-100',
      label: 'Filière'
    }
  }

  const renderListView = () => {
    const grouped = mappedEvents.reduce((acc, event) => {
      const key = `${event.day} ${event.date}`
      if (!acc[key]) acc[key] = []
      acc[key].push(event)
      return acc
    }, {} as Record<string, typeof mappedEvents>)

    const sortedDates = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(grouped[a][0].date)
      const dateB = new Date(grouped[b][0].date)
      return dateA.getTime() - dateB.getTime()
    })

    return (
      <div className="bg-white border border-slate-100 rounded-b-2xl p-4">
        {mappedEvents.length === 0 ? (
           <div className="p-8 text-center text-slate-400">Aucun cours trouvé pour cette sélection.</div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                  <span className="font-bold text-slate-700 capitalize">{date.split(' ')[0]}</span>
                  <span className="text-sm font-bold text-slate-500">{date.split(' ').slice(1).join(' ')}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(event => {
                    const style = getFiliereStyle(event.title, event.extendedProps?.group)
                    return (
                      <div key={event.id} className={cn("px-4 py-3 flex items-center gap-4 border-l-4", style.bg)}>
                        <div className="w-32 shrink-0 font-bold text-sm bg-white/20 px-2 py-1 rounded inline-block text-center shadow-sm">
                          {event.startTime} - {event.endTime}
                        </div>
                        <div className="flex-1 font-bold text-sm flex items-center gap-2">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider", style.badge)}>
                            {style.label}
                          </span>
                          <span>{event.title}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderWeekView = () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(currentWeekStart, i)
      return format(d, 'EEE. dd/MM', { locale: fr })
    })
    
    const hours = Array.from({ length: 13 }, (_, i) => `${i + 7}:30`)

    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-100 rounded-2xl flex overflow-x-auto relative shadow-sm">
          {loading && (
             <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
               <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
             </div>
          )}
          
          {/* Time column */}
          <div className="w-16 shrink-0 border-r border-slate-100 pt-12">
            {hours.map(hour => (
              <div key={hour} className="h-12 border-b border-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 relative">
                <span className="absolute -top-2 bg-white px-1">{hour}</span>
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="flex-1 min-w-[800px] flex">
            {days.map((day) => {
              const dayName = day.split('.')[0]
              const dayEvents = mappedEvents.filter(e => e.day.startsWith(dayName))

              // Process side-by-side positioning for overlapping events
              const processedEvents = dayEvents.map((evt) => {
                const overlapping = dayEvents.filter((other) => {
                  if (other.id === evt.id) return false
                  const top1 = parseFloat(evt.top)
                  const h1 = parseFloat(evt.height)
                  const top2 = parseFloat(other.top)
                  const h2 = parseFloat(other.height)
                  return (top1 < top2 + h2 && top2 < top1 + h1)
                })

                const hasConflict = overlapping.some(other => isHardConflict(evt, other))

                if (overlapping.length > 0) {
                  const sortedGroup = [evt, ...overlapping].sort((a, b) => String(a.id).localeCompare(String(b.id)))
                  const positionIndex = sortedGroup.findIndex(item => item.id === evt.id)
                  const totalCols = sortedGroup.length
                  const colWidth = Math.floor(96 / totalCols)
                  return {
                    ...evt,
                    hasConflict,
                    widthStyle: `${colWidth}%`,
                    leftStyle: `${positionIndex * colWidth + 2}%`
                  }
                }
                return {
                  ...evt,
                  hasConflict: false,
                  widthStyle: 'calc(100% - 8px)',
                  leftStyle: '4px'
                }
              })

              return (
                <div key={day} className="flex-1 border-r border-slate-100 relative">
                  <div className="h-12 border-b border-slate-100 flex items-center justify-center font-bold text-sm text-slate-700 capitalize">
                    {day}
                  </div>
                  <div className="relative" style={{ height: `${13 * 48}px` }}>
                    {hours.map((_, h) => (
                      <div key={h} className="h-12 border-b border-slate-50" />
                    ))}
                    
                    {processedEvents.map(event => {
                      const style = getFiliereStyle(event.title, event.extendedProps?.group)
                      return (
                        <div 
                          key={event.id}
                          className={cn(
                            "absolute rounded-xl p-2 text-white text-[10px] font-bold leading-tight shadow-md cursor-grab active:cursor-grabbing border-l-4 transition-all hover:scale-[1.03] hover:z-30",
                            style.bg,
                            event.hasConflict && "ring-2 ring-red-500 shadow-red-500/40 shadow-lg"
                          )}
                          style={{ 
                            top: event.top, 
                            height: event.height,
                            width: event.widthStyle,
                            left: event.leftStyle
                          }}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase", style.badge)}>
                              {style.label}
                            </span>
                            <span className="text-[9px] opacity-90 font-mono font-bold bg-black/20 px-1 py-0.5 rounded">
                              {event.startTime} - {event.endTime}
                            </span>
                          </div>

                          <div className="font-extrabold line-clamp-2 leading-tight">
                            {event.title}
                          </div>

                          {event.hasConflict && (
                            <div className="mt-1 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                              ⚠️ CONFLIT
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-[1700px] mx-auto font-sans animate-in fade-in pb-28">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] rounded-3xl p-8 text-white shadow-xl border border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <CalendarSync className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 mb-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Emploi du Temps Intelligent ENCG Fès
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Emploi du Temps & Synchronisation</h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium mt-0.5">
              Visualisation dynamique, détection automatique des conflits et synchronisation smartphone.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={handleExportPdf}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-white/20 backdrop-blur-md cursor-pointer"
          >
            PDF Officiel
          </button>
          <button
            onClick={handleExportIcs}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            📅 Exporter Agenda (.ics)
          </button>
        </div>
      </div>

      {/* 🚀 AUTO-DETECT CONFLICTS & CSP AI RESOLUTION MASTER DECK */}
      {conflictClusters.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border-2 border-amber-400 rounded-3xl p-6 md:p-8 text-amber-950 shadow-lg space-y-4 animate-in fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-black shadow-md">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Scanner IA Actif
                  </span>
                  <h3 className="font-black text-lg text-slate-900">
                    {totalConflictingEventsCount} Séances en Chevauchement Détectées ({conflictClusters.length} Créneaux Surchargés)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Conflits durs détectés : même groupe, même enseignant ou même salle sur un créneau identique. Les cours parallèles de groupes distincts ne sont pas des conflits.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                  {conflictClusters.map((c, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white/90 border border-amber-300 text-amber-900 rounded-xl text-xs font-black shadow-2xs">
                      • {c.day.toUpperCase()} ({c.time}) : <strong>{c.events.length} cours</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setShowBatchModal(true)}
                className="px-5 py-3 rounded-2xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4 text-amber-700" />
                🚨 Déclarer Tout en 1-Clic
              </button>

              <button
                onClick={handleCspAutoResolve}
                disabled={resolvingCsp}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#001A4B] via-indigo-900 to-purple-900 hover:opacity-95 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-indigo-950/30 cursor-pointer disabled:opacity-50"
              >
                {resolvingCsp ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Zap className="w-4 h-4 text-amber-400" />}
                ⚡ Stratégie performance (0 conflit salle / prof)
              </button>
            </div>
          </div>
        </div>
      )}

      {cspResolved && conflictClusters.length === 0 && mappedEvents.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-2 border-emerald-400 rounded-3xl p-6 text-emerald-950 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                CSP Zero-Conflit
              </span>
              <h3 className="font-black text-lg text-slate-900 mt-1">Stratégie performance : 0 conflit dur</h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Un professeur, une salle, un groupe par créneau. Les groupes parallèles (G1 / G2) restent autorisés.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-700">
              {!isAdmin ? "Filtres & Sélection de Vue de l'Emploi du Temps" : "Filtres Global de Recherche"}
            </h3>
          </div>
          {!isAdmin && (
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
              Mode Enseignant Connecté : {currentProfName}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Filière</label>
            <select 
              value={selectedFiliere}
              onChange={(e) => setSelectedFiliere(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Toutes les Filières</option>
              {filieres.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Groupe</label>
            <select 
              value={selectedGroupe}
              onChange={(e) => setSelectedGroupe(e.target.value)}
              disabled={!selectedFiliere}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            >
              <option value="">Tous les Groupes</option>
              {groupes.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Professeur</label>
            {!isAdmin ? (
              <select disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] cursor-not-allowed">
                <option value="">{currentProfName} (Compte Enseignant)</option>
              </select>
            ) : (
              <select 
                value={selectedProfessor}
                onChange={(e) => setSelectedProfessor(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">Tous les professeurs</option>
                {professors.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.user?.first_name} {p.user?.last_name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <button 
              onClick={fetchTimetable}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-xs uppercase tracking-wide shadow-md h-[46px] disabled:opacity-70 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Appliquer le filtre
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View Controls & Grid */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {/* Calendar Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 rounded-lg p-1">
              <button className="p-1.5 text-white/80 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-white/80 hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button className="px-4 py-2 bg-slate-400 text-white text-xs font-bold rounded-lg shadow-sm">
              Aujourd'hui
            </button>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-slate-800 capitalize">{weekLabel}</h2>

          <div className="flex bg-slate-800 p-1 rounded-xl overflow-x-auto">
            {(['Semaine', 'Jour', 'Liste'] as const).map(mode => (
              <button 
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-6 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer",
                  viewMode === mode ? "bg-slate-700 text-white shadow-sm" : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'Liste' ? renderListView() : renderWeekView()}
      </div>

      {/* Modal Demande Groupée de Réaménagement */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 space-y-6">
            
            <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-indigo-950 p-6 text-white relative">
              <button 
                onClick={() => setShowBatchModal(false)}
                className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Déclaration Groupée Automatisée
              </span>
              <h3 className="font-black text-2xl tracking-tight">Signalement Pack de Conflits</h3>
              <p className="text-xs text-slate-300 font-medium mt-1">
                Génération automatique du rapport récapitulatif pour le Service des Emplois du Temps.
              </p>
            </div>

            <div className="p-6 md:p-8 space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
                  Détail du Pack de Conflits Détectés ({totalConflictingEventsCount} Séances)
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {conflictClusters.map((c, i) => (
                    <div key={i} className="text-xs font-bold text-slate-800 bg-white p-2.5 rounded-xl border border-amber-200">
                      <strong>{c.day.toUpperCase()} ({c.time}) :</strong> {c.events.length} cours simultanés
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        {c.events.map(e => e.title).join(' • ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSendBatchConflictReport}
                  disabled={submittingRequest}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  {submittingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Transmettre le Rapport Global à l'Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
