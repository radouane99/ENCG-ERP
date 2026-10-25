import { useEffect, useState, useMemo, useRef, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@shared/lib/api'
import { Modal } from '@shared/components/ui/Modal'
import { Button } from '@shared/components/ui/Button'
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck2,
  Search,
  Zap,
  Calendar,
  MapPin,
  Barcode,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  GraduationCap,
  Save,
  Check
} from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  sessionId: string | number
  sessionData?: {
    id?: string | number
    session_id?: string | number
    title?: string
    module?: string
    group?: string
    room?: string
    location?: string
    time?: string
    day_name?: string
    day_of_week?: number | string
    filiere_code?: string
    module_id?: number
    group_id?: number
    date?: string
  }
}

interface Schedule {
  id: string
  moduleId: number
  groupId: number | null
  moduleName: string
  groupName: string
  timeSlot: string
  day: string
  day_of_week?: number | null
  roomName: string
  sessionType?: string
}

type Status = 'present' | 'absent' | 'late' | 'excused'

interface StudentRosterItem {
  id: number
  name: string
  cne: string
  apogee?: string
  version?: number; status: Status
}

// Subtle audio feedback for laser / barcode / RFID card scan
function playBeep(success = true) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(success ? 880 : 320, ctx.currentTime)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (success ? 0.12 : 0.2))
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + (success ? 0.12 : 0.2))
  } catch {
    // Ignore audio restrictions
  }
}

// Map day name or abbreviation to ISO day of week (1=Monday, ..., 7=Sunday)
const DAY_NAME_TO_ISO: Record<string, number> = {
  '1': 1, 'lundi': 1, 'lun': 1, 'mon': 1, 'monday': 1,
  '2': 2, 'mardi': 2, 'mar': 2, 'tue': 2, 'tuesday': 2,
  '3': 3, 'mercredi': 3, 'mer': 3, 'wed': 3, 'wednesday': 3,
  '4': 4, 'jeudi': 4, 'jeu': 4, 'thu': 4, 'thursday': 4,
  '5': 5, 'vendredi': 5, 'ven': 5, 'fri': 5, 'friday': 5,
  '6': 6, 'samedi': 6, 'sam': 6, 'sat': 6, 'saturday': 6,
  '7': 7, 'dimanche': 7, 'dim': 7, 'sun': 7, 'sunday': 7,
}

// Compute the exact calendar date of the scheduled day of the week within current week
function getDateForScheduleDay(dayInput?: string | number): string {
  const now = new Date()
  if (dayInput === undefined || dayInput === null || dayInput === '') {
    return now.toISOString().split('T')[0]
  }

  let targetIso: number | undefined
  if (typeof dayInput === 'number' && dayInput >= 1 && dayInput <= 7) {
    targetIso = dayInput
  } else {
    const clean = String(dayInput).trim().toLowerCase()
    targetIso = DAY_NAME_TO_ISO[clean]
    if (!targetIso) {
      for (const [key, val] of Object.entries(DAY_NAME_TO_ISO)) {
        if (clean.startsWith(key)) {
          targetIso = val
          break
        }
      }
    }
  }

  if (!targetIso) {
    return now.toISOString().split('T')[0]
  }

  // Current ISO day of week: 1 (Mon) to 7 (Sun)
  const currentDay = now.getDay()
  const currentIso = currentDay === 0 ? 7 : currentDay

  // Day difference relative to today
  const diffDays = targetIso - currentIso
  const targetDate = new Date(now)
  targetDate.setDate(now.getDate() + diffDays)

  const y = targetDate.getFullYear()
  const m = targetDate.getMonth() + 1
  const d = targetDate.getDate()
  return `${y}-${m < 10 ? `0${m}` : m}-${d < 10 ? `0${d}` : d}`
}

// Helper to format French date with day of the week
function formatFrenchFullDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const str = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
    return str.charAt(0).toUpperCase() + str.slice(1)
  } catch {
    return dateStr
  }
}

function formatFrenchCompactDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date)
    const day = d < 10 ? `0${d}` : d
    const month = m < 10 ? `0${m}` : m
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day}/${month}/${y}`
  } catch {
    return dateStr
  }
}

export function QRScannerModal({ isOpen, onClose, sessionId, sessionData }: Props) {
  const [scheduleId, setScheduleId] = useState('')
  const [activeId, setActiveId] = useState<number | null>(null)
  const [sessionDate, setSessionDate] = useState(() =>
    getDateForScheduleDay(sessionData?.day_of_week ?? sessionData?.day_name)
  )
  const [statuses, setStatuses] = useState<Record<number, Status>>({})
  const dirtyIds = useRef(new Set<number>()); const versions = useRef<Record<number, number>>({})
  const markLocal = (id: number, status: Status) => { dirtyIds.current.add(id); setStatuses(prev => ({ ...prev, [id]: status })) }
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')
  const [showSchedulePicker, setShowSchedulePicker] = useState(false)
  const [lastScannedStudent, setLastScannedStudent] = useState<{ name: string; warning?: string | null } | null>(null)
  const scanInputRef = useRef<HTMLInputElement>(null)

  // Fetch official assignments
  const context = useQuery({
    queryKey: ['attendance-context-scanner'],
    enabled: isOpen,
    queryFn: () => api.get('/professor/attendance/context').then(r => r.data.data.schedules as Schedule[]),
  })

  // Fetch student roster for active attendance session
  const roster = useQuery({
    queryKey: ['attendance-session-students', activeId],
    enabled: isOpen && !!activeId,
    queryFn: () =>
      api
        .get('/professor/attendance/students', { params: { attendance_session_id: activeId } })
        .then(r => r.data.data as StudentRosterItem[]),
  })

  // Reset state on close or when sessionData changes
  useEffect(() => {
    if (!isOpen) {
      setActiveId(null)
      setScheduleId('')
      setSessionDate(getDateForScheduleDay(sessionData?.day_of_week ?? sessionData?.day_name))
      setStatuses({}); dirtyIds.current.clear(); versions.current = {}
      setError('')
      setSearchQuery('')
      setStatusFilter('all')
      setLastScannedStudent(null)
      setShowSchedulePicker(false)
    } else {
      // Initialize date for current session's day
      const targetDay = sessionData?.day_of_week ?? sessionData?.day_name
      if (targetDay) {
        setSessionDate(getDateForScheduleDay(targetDay))
      }
    }
  }, [isOpen, sessionData?.day_of_week, sessionData?.day_name])

  // Auto-detect matching schedule
  useEffect(() => {
    if (context.data && context.data.length > 0 && !scheduleId) {
      // 1. Try matching by exact session_id / schedule id
      const directMatch = context.data.find(s => s.id === String(sessionId))
      if (directMatch) {
        setScheduleId(directMatch.id)
        return
      }

      // 2. Try matching by module title and group name
      if (sessionData?.title) {
        const titleMatch = context.data.find(
          s =>
            s.moduleName?.toLowerCase() === sessionData.title?.toLowerCase() &&
            (!sessionData.group || s.groupName?.toLowerCase() === sessionData.group?.toLowerCase())
        )
        if (titleMatch) {
          setScheduleId(titleMatch.id)
          return
        }
      }

      // 3. Fallback to first valid schedule
      const firstValid = context.data.find(s => s.groupId)
      if (firstValid) {
        setScheduleId(firstValid.id)
      }
    }
  }, [context.data, sessionId, sessionData, scheduleId])

  // Populate statuses when roster loads
  useEffect(() => {
    if (roster.data) {
      const initial: Record<number, Status> = {}
      for (const s of roster.data) {
        initial[s.id] = s.status || 'absent'; if (!dirtyIds.current.has(s.id)) versions.current[s.id] = s.version ?? 0
      }
      setStatuses(previous => Object.fromEntries(Object.entries(initial).map(([id, status]) => [id, dirtyIds.current.has(Number(id)) ? previous[Number(id)] ?? status : status])))
    }
  }, [roster.data])

  const selectedSchedule = context.data?.find(s => s.id === scheduleId)

  // Automatically recalculate sessionDate when selectedSchedule resolves
  useEffect(() => {
    if (selectedSchedule) {
      const scheduleDay = selectedSchedule.day_of_week ?? selectedSchedule.day
      setSessionDate(getDateForScheduleDay(scheduleDay))
    }
  }, [selectedSchedule?.id, selectedSchedule?.day, selectedSchedule?.day_of_week])

  // Start attendance session
  async function handleStartSession() {
    if (!selectedSchedule?.groupId) {
      setError('Veuillez sélectionner une séance valide avec un groupe rattaché.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const response = await api.post('/professor/attendance/start', {
        module_id: selectedSchedule.moduleId,
        group_id: selectedSchedule.groupId,
        room_name: selectedSchedule.roomName || 'Salle ENCG',
        date: sessionDate,
      })
      if (!response.data.session?.id) throw new Error('ID de session manquant')
      setActiveId(response.data.session.id)
      toast.success('Session d’appel démarrée avec succès.')
      setTimeout(() => scanInputRef.current?.focus(), 300)
    } catch {
      setError('Impossible de démarrer la session. Vérifiez vos affectations et réessayez.')
    } finally {
      setBusy(false)
    }
  }

  // Quick scan / barcode / CNE pointer
  async function handleScanSubmit(e?: FormEvent) {
    if (e) e.preventDefault()
    const raw = code.trim()
    if (!raw || !activeId) return

    setBusy(true)
    setError('')
    try {
      // Backend API scan (handles QR tokens, CNEs, and warning counts)
      const res = await api.post(`/professor/attendance/${activeId}/scan`, { token: raw })
      const studentName = res.data.student_name || 'Étudiant'
      const warning = res.data.warning

      // Update student locally in roster
      if (res.data.record?.student_id) {
        dirtyIds.current.delete(res.data.record.student_id); versions.current[res.data.record.student_id] = res.data.record.version; setStatuses(prev => ({ ...prev, [res.data.record.student_id]: 'present' }))
      }

      setLastScannedStudent({ name: studentName, warning })
      playBeep(true)

      if (warning) {
        toast.warning(`${studentName} : ${warning}`)
      } else {
        toast.success(`Présence confirmée : ${studentName}`)
      }

      setCode('')
      await roster.refetch()
      scanInputRef.current?.focus()
    } catch {
      playBeep(false)
      setError('Code introuvable ou étudiant non inscrit à cette séance.')
    } finally {
      setBusy(false)
    }
  }

  // Bulk actions (Fast 1-click attendance)
  function handleMarkAll(status: Status) {
    if (!roster.data) return
    const updated: Record<number, Status> = {}
    for (const student of roster.data) {
      updated[student.id] = status; dirtyIds.current.add(student.id)
    }
    setStatuses(updated)
    if (status === 'present') {
      toast.success('Tous les étudiants ont été marqués Présents !')
    } else {
      toast.info('Tous les étudiants ont été réinitialisés à Absents.')
    }
  }

  // Save & close session
  async function handleSaveSession() {
    if (!activeId) return
    setBusy(true)
    setError('')
    try {
      await api.post('/professor/attendance/save', {
        session_id: activeId,
        close_session: true,
        date: sessionDate,
        records: Object.entries(statuses).map(([student_id, status]) => ({
          student_id: Number(student_id), version: versions.current[Number(student_id)] ?? 0,
          status,
        })),
      })
      toast.success('Feuille d’émargement officielle enregistrée et session clôturée avec succès !')
      onClose()
    } catch {
      setError('Une erreur est survenue lors de l’enregistrement. Vos choix sont conservés.')
    } finally {
      setBusy(false)
    }
  }

  // Safe close guard
  function handleCloseModal() {
    if (busy) return
    if (activeId) {
      if (window.confirm('Voulez-vous fermer sans enregistrer les dernières modifications ?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  // Metrics computation
  const totalStudents = roster.data?.length ?? 0
  const statsSummary = useMemo(() => {
    let present = 0
    let absent = 0
    let late = 0
    let excused = 0

    for (const status of Object.values(statuses)) {
      if (status === 'present') present++
      else if (status === 'absent') absent++
      else if (status === 'late') late++
      else if (status === 'excused') excused++
    }

    const attendanceRate = totalStudents > 0 ? Math.round(((present + late) / totalStudents) * 100) : 0

    return { present, absent, late, excused, attendanceRate }
  }, [statuses, totalStudents])

  // Filtered roster for search and status tabs
  const filteredStudents = useMemo(() => {
    if (!roster.data) return []
    return roster.data.filter(s => {
      const currentStatus = statuses[s.id] ?? 'absent'
      if (statusFilter !== 'all' && currentStatus !== statusFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        s.name.toLowerCase().includes(q) ||
        s.cne?.toLowerCase().includes(q) ||
        s.apogee?.toLowerCase().includes(q)
      )
    })
  }, [roster.data, statuses, statusFilter, searchQuery])

  // Course title & badge info
  const courseTitle = sessionData?.title || selectedSchedule?.moduleName || 'Séance Pédagogique'
  const groupLabel = sessionData?.group || selectedSchedule?.groupName || 'Section ENCG'
  const roomLabel = sessionData?.room || sessionData?.location || selectedSchedule?.roomName || 'Salle'
  const timeLabel = sessionData?.time || selectedSchedule?.timeSlot || 'Créneau officiel'

  return (
    <Modal
      open={isOpen}
      onClose={handleCloseModal}
      size="xl"
      hideCloseButton={false}
      preventBackdropClose={!!activeId || busy}
      preventEscapeClose={busy}
    >
      <div className="space-y-5 -mt-2">
        
        {/* ── Top Institutional Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#001A4B] to-[#0a327d] text-white flex items-center justify-center shadow-md shadow-blue-950/20 shrink-0">
              <Users className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Feuille d'Appel & Émargement
                </h2>
                {activeId ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Session #{activeId} en cours
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Configuration
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                ENCG Fès • Pointage instantané des présences (1-Clic, RFID, CNE)
              </p>
            </div>
          </div>

          {/* Course, Date, Room & Time Badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold border border-amber-200 dark:border-amber-900/60 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{formatFrenchCompactDate(sessionDate)}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900/60">
              <GraduationCap className="w-3.5 h-3.5" /> {groupLabel}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> {roomLabel}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
              <Clock className="w-3 h-3 text-amber-500" /> {timeLabel}
            </span>
          </div>
        </div>

        {/* ── Global Error Alert ── */}
        {error && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError('')}
              className="text-rose-500 hover:text-rose-700 font-bold text-sm px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Step 1: Pre-Session Configuration (Clean Course Card) ── */}
        {!activeId ? (
          <div className="space-y-5 py-2">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Séance Sélectionnée
                  </span>
                  <h3 className="text-lg font-black text-[#001A4B] dark:text-white mt-1">
                    {courseTitle}
                  </h3>
                  
                  {/* Detailed Badges with Day & Date */}
                  <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 font-bold text-xs border border-amber-300/80 dark:border-amber-800 shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{formatFrenchFullDate(sessionDate)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                      Groupe : {groupLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                      Salle : {roomLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                      Horaires : {timeLabel}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-amber-100/70 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shrink-0 border border-amber-200 dark:border-amber-900/60 shadow-xs">
                  <Calendar className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>
              </div>

              {/* Date Picker & Schedule Options */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  <label htmlFor="session-date-input" className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>Date effective de l'appel :</span>
                  </label>
                  <input
                    id="session-date-input"
                    type="date"
                    value={sessionDate}
                    onChange={e => setSessionDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  {selectedSchedule?.day && (
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      Créneau d'emploi du temps : <strong className="text-slate-800 dark:text-slate-200 capitalize">{selectedSchedule.day}</strong>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowSchedulePicker(!showSchedulePicker)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <span>{showSchedulePicker ? 'Masquer la liste des séances' : 'Changer de cours ou de groupe...'}</span>
                </button>
              </div>

              {showSchedulePicker && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Toutes mes séances programmées :
                  </label>
                  {context.isPending ? (
                    <p className="text-xs text-slate-400">Chargement de votre planning officiel...</p>
                  ) : context.isError ? (
                    <p className="text-xs text-rose-500">Erreur de chargement. <button onClick={() => context.refetch()} className="underline font-bold">Réessayer</button></p>
                  ) : (
                    <select
                      aria-label="Sélectionner une séance officielle"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={scheduleId}
                      onChange={e => {
                        const newId = e.target.value
                        setScheduleId(newId)
                        const found = context.data?.find(s => s.id === newId)
                        if (found) {
                          setSessionDate(getDateForScheduleDay(found.day_of_week ?? found.day))
                        }
                      }}
                    >
                      <option value="">Sélectionner une autre séance...</option>
                      {context.data
                        ?.filter(s => s.groupId)
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.moduleName} • {s.groupName} • {s.day} {s.timeSlot} ({s.roomName})
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Launch button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-400">
                ⚡ Le démarrage de la session permet le pointage rapide par liste nominative ou douchette RFID.
              </p>
              <Button
                onClick={handleStartSession}
                disabled={!selectedSchedule?.groupId || busy}
                isLoading={busy}
                className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-[#001A4B] to-[#09296b] hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-950/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Démarrer l'Appel de la Séance</span>
              </Button>
            </div>
          </div>
        ) : (
          /* ── Step 2: Active Roll Call Dashboard (Ergonomic & Fast) ── */
          <div className="space-y-4">
            
            {/* Active Session Date & Course Recap Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 font-black text-amber-950 dark:text-amber-200">
                  <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {formatFrenchFullDate(sessionDate)}
                </span>
                <span className="text-amber-800/80 dark:text-amber-300/80 font-mono">• {timeLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                <span>Groupe : <strong className="text-slate-900 dark:text-white">{groupLabel}</strong></span>
                <span>• Salle : <strong className="text-slate-900 dark:text-white">{roomLabel}</strong></span>
              </div>
            </div>

            {/* 1. Real-Time KPI Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total</div>
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {totalStudents} <span className="text-[11px] font-normal text-slate-400">inscrits</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Présents</div>
                  <div className="text-base font-black text-emerald-800 dark:text-emerald-300">
                    {statsSummary.present}{' '}
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      ({statsSummary.attendanceRate}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">Absents</div>
                  <div className="text-base font-black text-rose-800 dark:text-rose-300">
                    {statsSummary.absent}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">Retards</div>
                  <div className="text-base font-black text-amber-800 dark:text-amber-300">
                    {statsSummary.late}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 flex items-center gap-2.5 col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-400">Justifiés</div>
                  <div className="text-base font-black text-sky-800 dark:text-sky-300">
                    {statsSummary.excused}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Fast Scan Bar (Barcode / RFID / CNE) */}
            <form
              onSubmit={handleScanSubmit}
              className="relative flex items-center gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                <Barcode className="w-4 h-4" />
              </div>
              <input
                ref={scanInputRef}
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Scanner carte étudiante / Douchette USB / Taper CNE..."
                className="flex-1 bg-transparent border-0 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-0 text-slate-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={busy || !code.trim()}
                className="px-4 py-2 bg-[#001A4B] hover:bg-[#082663] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Pointer</span>
              </button>
            </form>

            {/* Scan feedback alert if student was just recognized */}
            {lastScannedStudent && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 font-bold" />
                  <span>
                    Dernier pointage : <strong>{lastScannedStudent.name}</strong> marqué(e) <strong>Présent(e)</strong>
                  </span>
                </div>
                {lastScannedStudent.warning && (
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                    ⚠️ {lastScannedStudent.warning}
                  </span>
                )}
              </div>
            )}

            {/* 3. Fast Action Ribbon & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              {/* Batch Actions (The #1 time saver) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll('present')}
                  disabled={busy || !roster.data?.length}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>Tout marquer Présent</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('absent')}
                  disabled={busy || !roster.data?.length}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Tout Absent</span>
                </button>
              </div>

              {/* Search & Filter pills */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Chercher étudiant..."
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Status Filter Dropdown or Chips */}
                <select
                  aria-label="Filtrer par statut de présence"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as 'all' | Status)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">Tous ({totalStudents})</option>
                  <option value="present">Présents ({statsSummary.present})</option>
                  <option value="absent">Absents ({statsSummary.absent})</option>
                  <option value="late">Retards ({statsSummary.late})</option>
                  <option value="excused">Justifiés ({statsSummary.excused})</option>
                </select>
              </div>
            </div>

            {/* 4. Student Roster (Instant 1-Click Status Buttons) */}
            {roster.isPending ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                <p>Chargement des étudiants inscrits...</p>
              </div>
            ) : roster.isError ? (
              <div className="p-6 text-center text-rose-500 text-xs">
                <p>Impossible de charger la liste des étudiants.</p>
                <button
                  type="button"
                  onClick={() => roster.refetch()}
                  className="mt-2 text-blue-600 underline font-bold"
                >
                  Réessayer
                </button>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-10 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500">Aucun étudiant ne correspond aux critères.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Vérifiez vos filtres de recherche.</p>
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredStudents.map(student => {
                  const currentStatus = statuses[student.id] ?? 'absent'

                  // Compute initials
                  const initials = student.name
                    .split(' ')
                    .map(p => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()

                  return (
                    <div
                      key={student.id}
                      className="pt-2 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                    >
                      {/* Student Identity */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            currentStatus === 'present'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : currentStatus === 'late'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : currentStatus === 'excused'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {initials || 'ET'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {student.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                            <span>{student.cne}</span>
                            {student.apogee && (
                              <span className="text-slate-300 dark:text-slate-600">• {student.apogee}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 4 Direct 1-Click Status Pill Buttons */}
                      <div className="flex items-center gap-1 self-end sm:self-center shrink-0 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                        {/* Présent */}
                        <button
                          type="button"
                          onClick={() => markLocal(student.id, 'present')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Présent</span>
                        </button>

                        {/* Absent */}
                        <button
                          type="button"
                          onClick={() => markLocal(student.id, 'absent')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Absent</span>
                        </button>

                        {/* Retard */}
                        <button
                          type="button"
                          onClick={() => markLocal(student.id, 'late')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            currentStatus === 'late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-500 dark:text-slate-400 hover:text-amber-600 hover:bg-white dark:hover:bg-slate-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Retard</span>
                        </button>

                        {/* Justifié */}
                        <button
                          type="button"
                          onClick={() => markLocal(student.id, 'excused')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            currentStatus === 'excused'
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'text-slate-500 dark:text-slate-400 hover:text-sky-600 hover:bg-white dark:hover:bg-slate-700'
                          }`}
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Justifié</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 5. Sticky Footer Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Taux d'assiduité :
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {statsSummary.attendanceRate}% ({statsSummary.present}/{totalStudents})
                </span>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={busy}
                  className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Fermer
                </button>
                <Button
                  onClick={handleSaveSession}
                  isLoading={busy}
                  disabled={!roster.data?.length}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer & Clôturer l'Appel</span>
                </Button>
              </div>
            </div>

          </div>
        )}

      </div>
    </Modal>
  )
}