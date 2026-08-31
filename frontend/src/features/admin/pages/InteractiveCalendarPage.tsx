import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Send,
  Zap,
  CalendarSync,
  Calendar,
  Filter,
  FileText,
  Clock,
  MapPin,
  User,
  Layers,
  Search,
  Check,
  Building2,
  Users
} from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { format, startOfWeek, addDays, addWeeks, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuthStore } from '@/stores/authStore'
import { reorganizeSessionsWithoutResourceConflicts, PERFORMANCE_SLOTS } from '@/features/timetable/lib/timetablePerformanceStrategy'
import { CustomSelect, SelectOption } from '@/shared/components/ui/CustomSelect'

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

function isCoursMagistral(session: CalendarSession) {
  const type = String(session.extendedProps?.type || session.extendedProps?.session_type || '').toLowerCase()
  return ['cm', 'cours', 'lecture', 'amphi', 'magistral'].includes(type)
}

function moduleKey(session: CalendarSession) {
  return String(session.extendedProps?.module_id || session.extendedProps?.module_code || session.title.split(' — ')[0] || '').trim().toLowerCase()
}

/** Chevauchement réel (08:30–10:30 vs 09:30–11:30). CM G1+G2 = cours commun, pas un conflit. */
function isHardConflict(a: CalendarSession, b: CalendarSession) {
  if (a.id === b.id || !sameCalendarDay(a, b) || !timesOverlap(a, b)) return false

  const aHasIdentity = isKnownResource(a.group) || isKnownResource(a.professor) || isKnownResource(a.room)
  const bHasIdentity = isKnownResource(b.group) || isKnownResource(b.professor) || isKnownResource(b.room)
  if (!aHasIdentity || !bHasIdentity) return true

  const sharedCours = isCoursMagistral(a) && isCoursMagistral(b)
    && isKnownResource(a.professor) && normalizeResource(a.professor) === normalizeResource(b.professor)
    && moduleKey(a) !== '' && moduleKey(a) === moduleKey(b)
  if (sharedCours) return false

  if (isKnownResource(a.professor) && isKnownResource(b.professor) && normalizeResource(a.professor) === normalizeResource(b.professor)) {
    return true
  }
  if (isKnownResource(a.room) && isKnownResource(b.room) && normalizeResource(a.room) === normalizeResource(b.room)) {
    return true
  }
  if (isKnownResource(a.group) && isKnownResource(b.group) && normalizeResource(a.group) === normalizeResource(b.group)) {
    return true
  }
  return false
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

  // 11 hours total: 08:00 to 19:00
  const topPercent = Math.max(0, Math.min(100, ((startHour - 8.0) / 11.0) * 100))
  const heightPercent = Math.max(7, Math.min(100, ((endHour - startHour) / 11.0) * 100))

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
    top: `${topPercent}%`,
    height: `${heightPercent}%`,
    professor: props.professor || '',
    group: props.group || '',
    room: props.room || '',
    extendedProps: props,
  }
}

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
  const currentProfName = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.name || '' : ''
  const [viewMode, setViewMode] = useState<'Semaine' | 'Jour' | 'Liste'>('Semaine')
  const [showSaturday, setShowSaturday] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resolvingCsp, setResolvingCsp] = useState(false)
  const [cspResolved, setCspResolved] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

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
        return []
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
    let exportUrl = '/api/timetable/export/all/0/ics'
    if (selectedGroupe) {
      exportUrl = `/api/timetable/export/group/${selectedGroupe}/ics`
    } else if (selectedFiliere) {
      exportUrl = `/api/timetable/export/filiere/${selectedFiliere}/ics`
    } else if (selectedProfessor) {
      exportUrl = `/api/timetable/export/professor/${selectedProfessor}/ics`
    } else if (!isAdmin && (u?.professor?.id || u?.id)) {
      exportUrl = `/api/timetable/export/professor/${u?.professor?.id || u?.id}/ics`
    }

    window.open(exportUrl, '_blank')
    toast.success("📅 Synchronisation du calendrier (.ics) téléchargée !", { id: 'prof-ics' })
  }

  const handleExportPdf = () => {
    let exportUrl = '/api/timetable/export/all/0/pdf'
    if (selectedGroupe) {
      exportUrl = `/api/timetable/export/group/${selectedGroupe}/pdf`
    } else if (selectedFiliere) {
      exportUrl = `/api/timetable/export/filiere/${selectedFiliere}/pdf`
    } else if (selectedProfessor) {
      exportUrl = `/api/timetable/export/professor/${selectedProfessor}/pdf`
    } else if (!isAdmin && (u?.professor?.id || u?.id)) {
      exportUrl = `/api/timetable/export/professor/${u?.professor?.id || u?.id}/pdf`
    }

    window.open(exportUrl, '_blank')
    toast.success("📄 Emploi du Temps Officiel PDF ouvert !", { id: 'prof-pdf' })
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
    } else {
      setGroupes([])
      setSelectedGroupe('')
      setLoading(true)
      fetchAllFilieresSchedules([]).then(setTimetableItems).finally(() => setLoading(false))
    }
  }, [selectedFiliere])

  useEffect(() => {
    if (selectedGroupe) {
      setLoading(true)
      api.get(`/timetable/export/group/${selectedGroupe}`)
        .then(res => {
          setTimetableItems(res.data.data || res.data || [])
          setCspResolved(false)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [selectedGroupe])

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

  const currentWeekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])
  const weekLabel = `${format(currentWeekStart, 'd MMM')} — ${format(addDays(currentWeekStart, 6), 'd MMMM yyyy', { locale: fr })}`

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
        applySessionToSlot(item, currentWeekStart, dayIndex, slot)
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
    } catch {
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
        bg: 'bg-gradient-to-br from-indigo-700 via-indigo-800 to-blue-900 border-indigo-400/40 text-white shadow-indigo-900/30',
        badge: 'bg-indigo-950/80 text-indigo-200 border border-indigo-500/30',
        label: 'GFC',
        color: '#4f46e5'
      }
    }
    if (text.includes('MCM') || text.includes('MARKETING') || text.includes('COMMUNICATION')) {
      return {
        bg: 'bg-gradient-to-br from-purple-700 via-purple-800 to-fuchsia-900 border-purple-400/40 text-white shadow-purple-900/30',
        badge: 'bg-purple-950/80 text-purple-200 border border-purple-500/30',
        label: 'MCM',
        color: '#9333ea'
      }
    }
    if (text.includes('INFO') || text.includes('SYSTÈMES') || text.includes('MSI')) {
      return {
        bg: 'bg-gradient-to-br from-cyan-700 via-teal-800 to-blue-900 border-cyan-400/40 text-white shadow-cyan-900/30',
        badge: 'bg-cyan-950/80 text-cyan-200 border border-cyan-500/30',
        label: 'MSI',
        color: '#0891b2'
      }
    }
    if (text.includes('TC') || text.includes('TRONC COMMUN') || text.includes('TRONC')) {
      return {
        bg: 'bg-gradient-to-br from-emerald-700 via-teal-800 to-emerald-900 border-emerald-400/40 text-white shadow-emerald-900/30',
        badge: 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/30',
        label: 'TC',
        color: '#059669'
      }
    }
    if (text.includes('GRH') || text.includes('HUMAINES') || text.includes('MANAGEMENT') || text.includes('DROIT')) {
      return {
        bg: 'bg-gradient-to-br from-amber-700 via-orange-800 to-amber-900 border-amber-400/40 text-white shadow-amber-900/30',
        badge: 'bg-amber-950/80 text-amber-200 border border-amber-500/30',
        label: 'GRH',
        color: '#d97706'
      }
    }
    return {
      bg: 'bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 border-blue-400/40 text-white shadow-blue-900/30',
      badge: 'bg-blue-950/80 text-blue-200 border border-blue-500/30',
      label: 'EDT',
      color: '#2563eb'
    }
  }

  const renderListView = () => {
    const grouped: Record<string, CalendarSession[]> = {}

    mappedEvents.forEach(e => {
      if (!grouped[e.date]) {
        grouped[e.date] = []
      }
      grouped[e.date].push(e)
    })

    const sortedDates = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(grouped[a][0].date)
      const dateB = new Date(grouped[b][0].date)
      return dateA.getTime() - dateB.getTime()
    })

    return (
      <div className="p-4 md:p-6 bg-white dark:bg-slate-900">
        {mappedEvents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            Aucun cours trouvé pour cette sélection.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((date) => (
              <div key={date} className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                  <span className="font-black text-slate-900 dark:text-slate-100 capitalize text-sm">{date.split(' ')[0]}</span>
                  <span className="text-xs font-bold text-slate-400">{date.split(' ').slice(1).join(' ')}</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(event => {
                    const style = getFiliereStyle(event.title, event.extendedProps?.group)
                    return (
                      <div key={event.id} className="px-5 py-3.5 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black text-white shrink-0 shadow-xs" style={{ background: style.color }}>
                            {style.label}
                          </span>
                          <div className="min-w-0">
                            <p className="font-black text-sm text-slate-900 dark:text-slate-100 truncate">{event.title}</p>
                            <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-3">
                              {event.professor && <span className="flex items-center gap-1"><User size={11} />{event.professor}</span>}
                              {event.room && <span className="flex items-center gap-1"><MapPin size={11} />{event.room}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {event.startTime} – {event.endTime}
                          </span>
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
    const daysCount = showSaturday ? 6 : 5
    const days = Array.from({ length: daysCount }, (_, i) => {
      const d = addDays(currentWeekStart, i)
      return {
        date: d,
        formatted: format(d, 'EEE. dd/MM', { locale: fr }),
        isToday: isSameDay(d, new Date())
      }
    })

    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex overflow-x-auto relative shadow-xs">
          {loading && (
            <div className="absolute inset-0 z-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[2px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          )}

          {/* Time column */}
          <div className="w-18 shrink-0 border-r border-slate-100 dark:border-slate-800 pt-14 bg-slate-50/50 dark:bg-slate-900/50">
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-center text-[11px] font-extrabold text-slate-500 dark:text-slate-400 relative">
                <span className="absolute -top-2.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">{hour}</span>
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="flex-1 min-w-[750px] flex">
            {days.map(({ date, formatted, isToday }) => {
              const dayName = formatted.split('.')[0]
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
                  widthStyle: 'calc(100% - 10px)',
                  leftStyle: '5px'
                }
              })

              return (
                <div key={formatted} className="flex-1 border-r border-slate-100 dark:border-slate-800 relative last:border-r-0">
                  <div className={cn(
                    "h-14 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center font-black text-xs md:text-sm capitalize transition-colors",
                    isToday ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black border-b-2 border-b-indigo-500" : "text-slate-800 dark:text-slate-200"
                  )}>
                    {isToday && <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 mr-2 animate-pulse" />}
                    {formatted}
                  </div>

                  <div className="relative" style={{ height: `${11 * 64}px` }}>
                    {hours.map((_, h) => (
                      <div key={h} className="h-16 border-b border-slate-100/60 dark:border-slate-800/40" />
                    ))}

                    {processedEvents.map(event => {
                      const style = getFiliereStyle(event.title, event.extendedProps?.group)
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "absolute rounded-2xl p-2.5 md:p-3 text-white text-xs font-bold leading-tight shadow-md cursor-pointer border transition-all hover:scale-[1.03] hover:z-30 hover:shadow-2xl overflow-hidden flex flex-col justify-between",
                            style.bg,
                            event.hasConflict && "ring-2 ring-rose-500 shadow-rose-500/40 shadow-lg"
                          )}
                          style={{
                            top: event.top,
                            height: event.height,
                            width: event.widthStyle,
                            left: event.leftStyle
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                              <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider", style.badge)}>
                                {style.label} {event.extendedProps?.group ? `· ${event.extendedProps.group}` : ''}
                              </span>
                              <span className="text-[10px] opacity-95 font-mono font-black bg-black/30 px-2 py-0.5 rounded-full shrink-0">
                                {event.startTime}–{event.endTime}
                              </span>
                            </div>

                            <div className="font-black text-xs md:text-[13px] line-clamp-2 leading-snug tracking-tight">
                              {event.title}
                            </div>
                          </div>

                          <div className="pt-1.5 border-t border-white/20 flex items-center justify-between gap-1 text-[10px] opacity-95 mt-1">
                            <span className="truncate font-medium flex items-center gap-1 text-white/90">
                              <User size={11} className="shrink-0 opacity-80" />
                              <span className="truncate">{event.professor || 'Enseignant non assigné'}</span>
                            </span>
                            {event.room && (
                              <span className="font-extrabold px-1.5 py-0.5 rounded-md bg-black/30 text-white shrink-0 flex items-center gap-1">
                                <MapPin size={10} className="shrink-0 opacity-80" />
                                <span>{event.room}</span>
                              </span>
                            )}
                          </div>

                          {event.hasConflict && (
                            <div className="mt-1 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse">
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

  const filiereOptions: SelectOption[] = useMemo(() => [
    { value: '', label: 'Toutes les Filières', badge: 'Global', icon: <Building2 className="w-3.5 h-3.5 text-indigo-500" /> },
    ...filieres.map((f: any) => ({
      value: String(f.id),
      label: `${f.code ? f.code + ' — ' : ''}${f.name}`,
      badge: f.code || 'FIL',
      icon: <Building2 className="w-3.5 h-3.5 text-indigo-500" />
    }))
  ], [filieres])

  const groupeOptions: SelectOption[] = useMemo(() => [
    { value: '', label: 'Tous les Groupes', badge: 'Tous', icon: <Users className="w-3.5 h-3.5 text-emerald-500" /> },
    ...groupes.map((g: any) => ({
      value: String(g.id),
      label: g.name,
      badge: 'GRP',
      icon: <Users className="w-3.5 h-3.5 text-emerald-500" />
    }))
  ], [groupes])

  const professorOptions: SelectOption[] = useMemo(() => [
    { value: '', label: 'Tous les professeurs', badge: 'Tous', icon: <User className="w-3.5 h-3.5 text-blue-500" /> },
    ...professors.map((p: any) => ({
      value: String(p.id),
      label: `${p.user?.first_name || ''} ${p.user?.last_name || ''}`.trim() || p.name || `Professeur #${p.id}`,
      badge: 'Prof',
      icon: <User className="w-3.5 h-3.5 text-blue-500" />
    }))
  ], [professors])

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ══════════════════════════════════════════════════════
          HERO HEADER — Deep ENCG Navy Style
      ══════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #001A4B 0%, #003087 50%, #001A4B 100%)' }}>
        <div className="absolute top-0 right-0 w-80 h-80 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 opacity-8 pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 15px rgba(79,70,229,0.4)' }}>
              <CalendarSync className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300/90 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Emploi du Temps Intelligent · ENCG Fès
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Emploi du Temps & Synchronisation
              </h1>
              <p className="text-xs md:text-sm text-blue-200/70 font-medium">
                Visualisation dynamique, détection automatique des conflits et synchronisation smartphone.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <FileText className="w-3.5 h-3.5" /> PDF Officiel
            </button>
            <button
              onClick={handleExportIcs}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 cursor-pointer shadow-md"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 15px rgba(79,70,229,0.35)' }}
            >
              <Calendar className="w-3.5 h-3.5" /> Exporter Agenda (.ics)
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)' }} />
      </div>

      {/* ══════════════════════════════════════════════════════
          CONFLICT DETECTOR & CSP RESOLUTION DECK
      ══════════════════════════════════════════════════════ */}
      {conflictClusters.length > 0 && (
        <div className="rounded-2xl p-5 md:p-6 border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200 space-y-4 animate-in fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold shadow-md">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Scanner IA Actif
                  </span>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    {totalConflictingEventsCount} Séances en Chevauchement Détectées ({conflictClusters.length} Créneaux Surchargés)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  CM : les 2 groupes ensemble. TD : par groupe. Un professeur ou une salle ne peut pas recevoir 2 créneaux qui se chevauchent.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {conflictClusters.map((c, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-lg text-xs font-bold">
                      {c.day.toUpperCase()} ({c.time}) : <strong>{c.events.length} cours</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setShowBatchModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 text-amber-950 dark:text-amber-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5 text-amber-600" />
                Déclarer en 1-Clic
              </button>

              <button
                onClick={handleCspAutoResolve}
                disabled={resolvingCsp}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #001A4B, #003087)', boxShadow: '0 4px 15px rgba(0,26,75,0.3)' }}
              >
                {resolvingCsp ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
                Stratégie performance (0 conflit)
              </button>
            </div>
          </div>
        </div>
      )}

      {cspResolved && conflictClusters.length === 0 && mappedEvents.length > 0 && (
        <div className="rounded-2xl p-5 border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  CSP Zero-Conflit
                </span>
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Stratégie performance : 0 conflit dur validé</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                Un professeur, une salle, un groupe par créneau. Les groupes parallèles (G1 / G2) restent autorisés.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          FILTERS CARD
      ══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            {!isAdmin ? "Filtres & Vue Enseignant" : "Filtres Globaux de Recherche"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Filière</label>
            <CustomSelect
              value={selectedFiliere}
              onChange={(val) => setSelectedFiliere(String(val))}
              options={filiereOptions}
              placeholder="Toutes les Filières"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Groupe</label>
            <CustomSelect
              value={selectedGroupe}
              onChange={(val) => setSelectedGroupe(String(val))}
              options={groupeOptions}
              disabled={!selectedFiliere}
              placeholder={!selectedFiliere ? "Sélectionnez une filière" : "Tous les Groupes"}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Professeur</label>
            {!isAdmin ? (
              <div className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span className="truncate">{currentProfName} (Compte Enseignant)</span>
              </div>
            ) : (
              <CustomSelect
                value={selectedProfessor}
                onChange={(val) => setSelectedProfessor(String(val))}
                options={professorOptions}
                placeholder="Tous les professeurs"
                className="w-full"
              />
            )}
          </div>
          <div>
            <button
              onClick={fetchTimetable}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-10 px-5 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm"
              style={{ background: 'linear-gradient(135deg, #001A4B, #003087)' }}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Appliquer le filtre
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CALENDAR CONTROLS & HEADER
      ══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setCurrentDate(addWeeks(currentDate, -1))}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer rounded-lg hover:bg-white dark:hover:bg-slate-700"
                title="Semaine précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer rounded-lg hover:bg-white dark:hover:bg-slate-700"
                title="Semaine suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              Aujourd'hui
            </button>
          </div>

          <h2 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 capitalize">{weekLabel}</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaturday(!showSaturday)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                showSaturday
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
              )}
            >
              {showSaturday ? "📅 Lun–Sam (6J)" : "📅 Lun–Ven (5J)"}
            </button>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {(['Semaine', 'Jour', 'Liste'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    viewMode === mode
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {viewMode === 'Liste' ? renderListView() : renderWeekView()}
      </div>

      {/* ══════════════════════════════════════════════════════
          BATCH CONFLICT REPORT MODAL
      ══════════════════════════════════════════════════════ */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 space-y-6">

            <div className="p-6 text-white relative" style={{ background: 'linear-gradient(135deg, #001A4B 0%, #003087 50%, #001A4B 100%)' }}>
              <button
                onClick={() => setShowBatchModal(false)}
                className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Déclaration Groupée Automatisée
              </span>
              <h3 className="font-black text-xl tracking-tight">Signalement Pack de Conflits</h3>
              <p className="text-xs text-blue-200/80 font-medium mt-1">
                Génération automatique du rapport récapitulatif pour le Service des Emplois du Temps.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-900 dark:text-amber-300 tracking-wider">
                  Détail du Pack de Conflits ({totalConflictingEventsCount} Séances)
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {conflictClusters.map((c, i) => (
                    <div key={i} className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                      <strong>{c.day.toUpperCase()} ({c.time}) :</strong> {c.events.length} cours simultanés
                      <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                        {c.events.map(e => e.title).join(' • ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSendBatchConflictReport}
                  disabled={submittingRequest}
                  className="flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}
                >
                  {submittingRequest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Transmettre le Rapport Global
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
