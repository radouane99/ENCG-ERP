import React, { useState, useEffect, useMemo } from 'react'
import {
  Sparkles,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  RotateCcw,
  Check,
  X,
  Layers,
  DoorOpen,
  Monitor,
  Thermometer,
  FileText,
  ChevronRight,
  PlusCircle,
  Building2,
  ShieldCheck,
  Printer,
  Download,
  CalendarPlus,
  BellRing,
  Table,
  Grid,
  FileSpreadsheet,
  RefreshCw,
  GraduationCap,
  QrCode,
  Eye,
  Wifi,
  LayoutList,
  CalendarDays
} from 'lucide-react'
import api from '@/shared/lib/api'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import { CustomSelect } from '@/shared/components/ui/CustomSelect'
import { DatePicker } from '@/shared/components/ui/DatePicker'
import { format, startOfWeek, addDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const TIME_BLOCKS = [
  { start: '08:30', end: '10:30', label: '08:30 – 10:30 (Matin 1)' },
  { start: '10:45', end: '12:45', label: '10:45 – 12:45 (Matin 2)' },
  { start: '14:30', end: '16:30', label: '14:30 – 16:30 (Après-midi 1)' },
  { start: '16:45', end: '18:45', label: '16:45 – 18:45 (Après-midi 2)' },
]

export default function RoomAvailabilityHubPage() {
  const [activeTab, setActiveTab] = useState<'master_matrix' | 'finder' | 'matrix' | 'room_schedule' | 'bookings'>('master_matrix')
  const [isExamMode, setIsExamMode] = useState<boolean>(false)

  // --- Common Data ---
  const [rooms, setRooms] = useState<any[]>([])
  const [filieres, setFilieres] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)

  // --- Master Weekly Matrix State ---
  const [masterStartDate, setMasterStartDate] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'))
  const [masterSemester, setMasterSemester] = useState<string>('')
  const [masterTypeFilter, setMasterTypeFilter] = useState<string>('all')
  const [masterSearch, setMasterSearch] = useState<string>('')
  const [masterLoading, setMasterLoading] = useState(false)
  const [masterMatrixData, setMasterMatrixData] = useState<any>(null)

  // --- Smart Finder State ---
  const [targetDate, setTargetDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0)
  const [sessionType, setSessionType] = useState<string>('cm')
  const [selectedFiliereId, setSelectedFiliereId] = useState<string>('')
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([])
  const [preferredRoomId, setPreferredRoomId] = useState<string>('')
  const [customHeadcount, setCustomHeadcount] = useState<string>('')
  const [searching, setSearching] = useState(false)
  const [finderResult, setFinderResult] = useState<any>(null)

  // --- Matrix Daily Heatmap State ---
  const [matrixDate, setMatrixDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [matrixTypeFilter, setMatrixTypeFilter] = useState<string>('all')
  const [matrixSearch, setMatrixSearch] = useState<string>('')
  const [matrixLoading, setMatrixLoading] = useState(false)
  const [matrixData, setMatrixData] = useState<any>(null)

  // --- Single Room Schedule State ---
  const [selectedScheduleRoomId, setSelectedScheduleRoomId] = useState<string>('')
  const [roomScheduleEvents, setRoomScheduleEvents] = useState<any[]>([])
  const [roomScheduleLoading, setRoomScheduleLoading] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [scheduleViewMode, setScheduleViewMode] = useState<'timeline' | 'preview_a4' | 'matrix'>('timeline')
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<number>(0) // 0 = All days, 1 = Mon, ..., 6 = Sat
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState<string>('')

  // --- Bookings State ---
  const [bookings, setBookings] = useState<any[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [bookingRoom, setBookingRoom] = useState<any>(null)
  const [bookingPurpose, setBookingPurpose] = useState('')
  const [notifyStudents, setNotifyStudents] = useState(true)
  const [submittingBooking, setSubmittingBooking] = useState(false)

  // Initial Load
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true)
        const [roomsRes, filieresRes] = await Promise.all([
          api.get('/rooms').catch(() => ({ data: { data: [] } })),
          api.get('/filieres').catch(() => ({ data: { data: [] } })),
        ])
        const roomList = roomsRes.data.data || roomsRes.data || []
        setRooms(roomList)
        setFilieres(filieresRes.data.data || filieresRes.data || [])

        if (roomList.length > 0) {
          setSelectedScheduleRoomId(String(roomList[0].id))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingInitial(false)
      }
    }
    loadData()
  }, [])

  // Load Master Matrix Data
  const loadMasterMatrix = async () => {
    try {
      setMasterLoading(true)
      const res = await api.get('/rooms/weekly-master-matrix', {
        params: {
          start_date: masterStartDate,
          semester: masterSemester || undefined,
          type: masterTypeFilter !== 'all' ? masterTypeFilter : undefined,
          search: masterSearch || undefined,
        }
      })
      setMasterMatrixData(res.data.data)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors du chargement de la matrice hebdomadaire')
    } finally {
      setMasterLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'master_matrix') {
      loadMasterMatrix()
    }
  }, [activeTab, masterStartDate, masterSemester, masterTypeFilter])

  // When filiere changes, load groups
  useEffect(() => {
    if (selectedFiliereId) {
      api.get('/groups', { params: { filiere_id: selectedFiliereId } })
        .then(res => {
          const grps = res.data.data || res.data || []
          setGroups(grps)
          setSelectedGroupIds(grps.map((g: any) => g.id))
        })
        .catch(() => setGroups([]))
    } else {
      setGroups([])
      setSelectedGroupIds([])
    }
  }, [selectedFiliereId])

  // Calculated headcount
  const calculatedHeadcount = useMemo(() => {
    if (customHeadcount && Number(customHeadcount) > 0) {
      return Number(customHeadcount)
    }
    if (selectedGroupIds.length > 0) {
      return selectedGroupIds.length * 35
    }
    return sessionType === 'cm' ? 70 : 35
  }, [customHeadcount, selectedGroupIds, sessionType])

  // Run Smart Find
  const handleRunSmartFind = async () => {
    try {
      setSearching(true)
      const slot = TIME_BLOCKS[selectedSlotIndex]
      const res = await api.post('/rooms/smart-find', {
        date: targetDate,
        start_time: slot.start,
        end_time: slot.end,
        session_type: sessionType,
        headcount: calculatedHeadcount,
        preferred_room_id: preferredRoomId ? Number(preferredRoomId) : null,
        filiere_id: selectedFiliereId ? Number(selectedFiliereId) : null,
        group_ids: selectedGroupIds,
      })

      setFinderResult(res.data)
      if (res.data.preferred_room && !res.data.preferred_room.is_available) {
        toast.warning(`La salle demandée (${res.data.preferred_room.room_name}) est occupée. Des alternatives libres sont proposées.`)
      } else {
        toast.success(`${res.data.available_rooms_count} salle(s) libre(s) trouvée(s).`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la recherche de salle')
    } finally {
      setSearching(false)
    }
  }

  // Load Daily Matrix Data
  const loadOccupancyMatrix = async () => {
    try {
      setMatrixLoading(true)
      const res = await api.get('/rooms/occupancy-matrix', {
        params: {
          date: matrixDate,
          type: matrixTypeFilter !== 'all' ? matrixTypeFilter : undefined,
          search: matrixSearch || undefined,
        }
      })
      setMatrixData(res.data.data)
    } catch (err: any) {
      console.error(err)
      toast.error('Erreur lors du chargement de la matrice')
    } finally {
      setMatrixLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'matrix') {
      loadOccupancyMatrix()
    }
  }, [activeTab, matrixDate, matrixTypeFilter])

  // Load Single Room Schedule
  const loadRoomSchedule = async (roomId: string) => {
    if (!roomId) return
    try {
      setRoomScheduleLoading(true)
      const res = await api.get(`/timetable/export/room/${roomId}`)
      setRoomScheduleEvents(res.data.data || res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setRoomScheduleLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'room_schedule' && selectedScheduleRoomId) {
      loadRoomSchedule(selectedScheduleRoomId)
    }
  }, [activeTab, selectedScheduleRoomId])

  // Current room details for Tab 4
  const currentScheduleRoom = useMemo(() => {
    return rooms.find((r: any) => String(r.id) === String(selectedScheduleRoomId)) || null
  }, [rooms, selectedScheduleRoomId])

  // Standard Moroccan academic days
  const DAYS_LIST = useMemo(() => [
    { index: 1, label: 'Lundi', short: 'Lun' },
    { index: 2, label: 'Mardi', short: 'Mar' },
    { index: 3, label: 'Mercredi', short: 'Mer' },
    { index: 4, label: 'Jeudi', short: 'Jeu' },
    { index: 5, label: 'Vendredi', short: 'Ven' },
    { index: 6, label: 'Samedi', short: 'Sam' },
  ], [])

  // Filtered room schedule events based on search query
  const filteredScheduleEvents = useMemo(() => {
    if (!scheduleSearchQuery) return roomScheduleEvents
    const q = scheduleSearchQuery.toLowerCase()
    return roomScheduleEvents.filter((evt: any) => {
      const title = (evt.title || '').toLowerCase()
      const prof = (evt.extendedProps?.professor || '').toLowerCase()
      const code = (evt.extendedProps?.module_code || '').toLowerCase()
      const grp = (evt.extendedProps?.group || '').toLowerCase()
      return title.includes(q) || prof.includes(q) || code.includes(q) || grp.includes(q)
    })
  }, [roomScheduleEvents, scheduleSearchQuery])

  // Count events per day (1 = Mon, ..., 6 = Sat)
  const eventsCountByDay = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    roomScheduleEvents.forEach((evt: any) => {
      if (evt.start) {
        const d = new Date(evt.start).getDay()
        if (counts[d] !== undefined) counts[d]++
      }
    })
    return counts
  }, [roomScheduleEvents])

  // Load Bookings
  const loadBookings = async () => {
    try {
      setBookingsLoading(true)
      const res = await api.get('/room-bookings')
      setBookings(res.data.data || res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setBookingsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'bookings') {
      loadBookings()
    }
  }, [activeTab])

  // Open booking modal
  const handleOpenBooking = (room: any, initialDate?: string, slotIdx?: number) => {
    setBookingRoom(room)
    if (initialDate) setTargetDate(initialDate)
    if (slotIdx !== undefined && slotIdx >= 0) setSelectedSlotIndex(slotIdx)
    setBookingPurpose(`Séance de rattrapage — ${sessionType.toUpperCase()}`)
    setNotifyStudents(true)
    setBookingModalOpen(true)
  }

  // Submit Booking
  const handleConfirmBooking = async () => {
    if (!bookingRoom || !bookingPurpose) {
      toast.error('Veuillez renseigner le motif de la réservation.')
      return
    }

    const slot = TIME_BLOCKS[selectedSlotIndex]
    try {
      setSubmittingBooking(true)
      await api.post('/room-bookings', {
        room_id: bookingRoom.id,
        room_name: bookingRoom.name,
        purpose: bookingPurpose,
        start_time: `${targetDate} ${slot.start}:00`,
        end_time: `${targetDate} ${slot.end}:00`,
        status: 'approved',
        group_ids: selectedGroupIds,
        notify_students: notifyStudents,
      })

      toast.success(`Réservation confirmée pour ${bookingRoom.name} ! ${notifyStudents ? 'Notifications et emails envoyés.' : ''}`)
      setBookingModalOpen(false)
      if (activeTab === 'master_matrix') loadMasterMatrix()
      if (activeTab === 'matrix') loadOccupancyMatrix()
      if (activeTab === 'bookings') loadBookings()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la réservation')
    } finally {
      setSubmittingBooking(false)
    }
  }

  // Update Booking Status
  const handleUpdateBookingStatus = async (bookingId: number, status: string) => {
    try {
      await api.put(`/room-bookings/${bookingId}`, { status })
      toast.success(`Statut mis à jour : ${status}`)
      loadBookings()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action impossible')
    }
  }

  // Download Door Sign PDF
  const handleDownloadDoorSign = async () => {
    if (!selectedScheduleRoomId) return
    const currentRoom = rooms.find((r: any) => String(r.id) === String(selectedScheduleRoomId))
    const roomFileSuffix = currentRoom?.name ? currentRoom.name.replace(/\s+/g, '_') : `Salle_${selectedScheduleRoomId}`
    try {
      setExportingPdf(true)
      toast.info('Génération du panneau de porte PDF A4 officiel avec QR Code…')
      const response = await api.get(`/rooms/${selectedScheduleRoomId}/door-sign-pdf`, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Affiche_Porte_${roomFileSuffix}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Panneau de porte PDF téléchargé avec succès !')
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors du téléchargement du PDF de porte')
    } finally {
      setExportingPdf(false)
    }
  }

  // Export iCal .ics
  const handleExportIcs = () => {
    if (!selectedScheduleRoomId) return
    window.open(`${api.defaults.baseURL}/timetable/export/room/${selectedScheduleRoomId}/ics`, '_blank')
    toast.success('Téléchargement du calendrier .ics (Google / Outlook / Apple) lancé !')
  }

  // Export Master Matrix CSV
  const handleExportMasterCsv = () => {
    if (!masterMatrixData?.rooms) return

    const daysHeaders = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    let csv = "Salle,Code,Capacite,Creneau," + daysHeaders.join(",") + "\n"

    masterMatrixData.rooms.forEach((r: any) => {
      r.slots.forEach((s: any) => {
        const row = [
          `"${r.name}"`,
          `"${r.code}"`,
          r.capacity,
          `"${s.time_label}"`,
          `"${s.days[1]?.badge_label || 'Libre'}"`,
          `"${s.days[2]?.badge_label || 'Libre'}"`,
          `"${s.days[3]?.badge_label || 'Libre'}"`,
          `"${s.days[4]?.badge_label || 'Libre'}"`,
          `"${s.days[5]?.badge_label || 'Libre'}"`,
          `"${s.days[6]?.badge_label || 'Libre'}"`,
        ]
        csv += row.join(",") + "\n"
      })
    })

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Matrice_Occupation_Salles_ENCG_${masterStartDate}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    toast.success('Export CSV généré avec succès !')
  }

  // Helper for capacity in exam vs normal mode
  const getDisplayCapacity = (r: any) => {
    if (isExamMode) {
      return r.exam_capacity ?? Math.floor(r.capacity / 2)
    }
    return r.capacity
  }

  // Filière theme colors
  const getThemeClasses = (theme: string, isOccupied: boolean) => {
    if (!isOccupied) {
      return "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60"
    }
    switch (theme) {
      case 'indigo': // TC
        return "bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200"
      case 'emerald': // GFC
        return "bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200"
      case 'amber': // MCM / MAC
        return "bg-amber-50/90 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200"
      case 'purple': // ACG
        return "bg-purple-50/90 dark:bg-purple-950/50 border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-200"
      case 'rose': // MRH
        return "bg-rose-50/90 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-200"
      case 'cyan': // Rattrapage
        return "bg-cyan-50/90 dark:bg-cyan-950/50 border-cyan-300 dark:border-cyan-700 text-cyan-950 dark:text-cyan-200"
      default:
        return "bg-blue-50/90 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200"
    }
  }

  const selectClass = "h-10 w-full px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"

  return (
    <div className="max-w-[1700px] mx-auto p-4 md:p-6 space-y-5 font-sans pb-28">

      {/* ══════════════════════════════════════════════════════
          HERO HEADER — Executive Campus Infrastructure Hub
      ══════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#060D1E] via-[#0A1A38] to-[#041026] text-white p-6 md:p-8 shadow-2xl shadow-indigo-950/25">
        {/* Subtle Ambient Glow Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))] pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/15 text-blue-300 border border-blue-400/25 inline-flex items-center gap-1.5 shadow-2xs backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-amber-400" /> Infrastructure & Gestion des Espaces · ENCG Fès
              </span>
              {isExamMode && (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30 shadow-xs animate-pulse inline-flex items-center gap-1">
                  🛡️ Mode Capacité Examen (1 place sur 2)
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Occupation des Salles & Moteur de Rattrapage
            </h1>
            <p className="text-xs md:text-sm text-slate-300/80 font-medium leading-relaxed">
              Matrice de répartition hebdomadaire des amphithéâtres et salles TD, diagnostic de collision en temps réel et assistant intelligent pour les réservations de rattrapage.
            </p>
          </div>

          {/* Quick Metrics & Mode Examen Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Examen Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setIsExamMode(!isExamMode)
                toast.info(!isExamMode ? 'Mode Examen activé : les jauges sont basculées à 50% (Anti-fraude).' : 'Mode Enseignement standard rétabli.')
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border shadow-md backdrop-blur-md active:scale-95",
                isExamMode
                  ? "bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/30 shadow-rose-900/30"
                  : "bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border-white/15"
              )}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{isExamMode ? 'Jauge Examen : Active (50%)' : 'Activer Jauge Examen'}</span>
            </button>

            {/* Total Salles KPI */}
            <div className="flex items-center gap-3.5 px-4.5 py-2.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.1] border border-white/15 backdrop-blur-md transition-all shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 flex items-center justify-center shrink-0">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Salles</p>
                <p className="text-base font-black text-white">{rooms.length}</p>
              </div>
            </div>

            {/* Places Enseignement KPI */}
            <div className="flex items-center gap-3.5 px-4.5 py-2.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.1] border border-white/15 backdrop-blur-md transition-all shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Places {isExamMode ? 'Examen' : 'Enseignement'}
                </p>
                <p className="text-base font-black text-white">
                  {rooms.reduce((acc, r) => acc + getDisplayCapacity(r), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          NAVIGATION DES MODULES — Grille Executive Structurée
      ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {[
          {
            id: 'master_matrix' as const,
            title: 'Matrice Hebdomadaire',
            subtitle: 'Vue globale par salle & créneau',
            badge: 'EDT Officiel',
            icon: Table,
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/80',
            activeBorder: 'border-indigo-500 dark:border-indigo-400',
            activeRing: 'ring-indigo-500/20',
            accentBar: 'bg-indigo-600',
          },
          {
            id: 'finder' as const,
            title: 'Assistant Rattrapage',
            subtitle: 'Diagnostic & Smart Finder',
            badge: 'Anti-collision',
            icon: Sparkles,
            iconColor: 'text-amber-600 dark:text-amber-400',
            iconBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80',
            activeBorder: 'border-amber-500 dark:border-amber-400',
            activeRing: 'ring-amber-500/20',
            accentBar: 'bg-amber-500',
          },
          {
            id: 'matrix' as const,
            title: 'Vue Journalière',
            subtitle: 'Heatmap de disponibilité',
            badge: 'Temps réel',
            icon: Layers,
            iconColor: 'text-sky-600 dark:text-sky-400',
            iconBg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800/80',
            activeBorder: 'border-sky-500 dark:border-sky-400',
            activeRing: 'ring-sky-500/20',
            accentBar: 'bg-sky-500',
          },
          {
            id: 'room_schedule' as const,
            title: 'Panneaux de Porte',
            subtitle: 'Affiches PDF A4 & Export iCal',
            badge: 'Export PDF',
            icon: Calendar,
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80',
            activeBorder: 'border-emerald-500 dark:border-emerald-400',
            activeRing: 'ring-emerald-500/20',
            accentBar: 'bg-emerald-500',
          },
          {
            id: 'bookings' as const,
            title: 'Mes Réservations',
            subtitle: 'Registre & suivi des séances',
            badge: bookings.length > 0 ? `${bookings.length} Réservation${bookings.length > 1 ? 's' : ''}` : 'Registre',
            icon: FileText,
            iconColor: 'text-purple-600 dark:text-purple-400',
            iconBg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800/80',
            activeBorder: 'border-purple-500 dark:border-purple-400',
            activeRing: 'ring-purple-500/20',
            accentBar: 'bg-purple-600',
          },
        ].map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "group relative p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer border select-none flex flex-col justify-between gap-3 overflow-hidden",
                isActive
                  ? cn("bg-white dark:bg-slate-900 shadow-md ring-2", tab.activeBorder, tab.activeRing)
                  : "bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs"
              )}
            >
              {/* Top Accent line when active */}
              {isActive && (
                <div className={cn("absolute top-0 left-0 right-0 h-1", tab.accentBar)} />
              )}

              {/* Icon & Badge Row */}
              <div className="flex items-center justify-between gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-200 group-hover:scale-105 shrink-0 shadow-2xs",
                  isActive ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-700" : tab.iconBg
                )}>
                  <tab.icon size={15} className={isActive ? "text-amber-400" : tab.iconColor} />
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                  isActive
                    ? "bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-200"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}>
                  {tab.badge}
                </span>
              </div>

              {/* Title & Subtitle */}
              <div>
                <p className={cn(
                  "text-xs font-black tracking-tight transition-colors line-clamp-1",
                  isActive ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
                )}>
                  {tab.title}
                </p>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                  {tab.subtitle}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1 (PRIMARY): MASTER WEEKLY ROOM ALLOCATION MATRIX
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'master_matrix' && (
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 space-y-4.5 shadow-sm">
          
          {/* Top Controls & Filters */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4.5">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 shadow-2xs">
                  Vue Synthétique ENCG Fès
                </span>
                <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Capacité, Répartition & Disponibilité des Salles (Semaine)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {masterMatrixData?.week_label || 'Planning hebdomadaire officiel par salle et par créneau'}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Semester Filter */}
              <CustomSelect
                value={masterSemester}
                onChange={(v) => setMasterSemester(String(v))}
                icon={<GraduationCap size={14} className="text-indigo-500" />}
                options={[
                  { value: '', label: 'Tous les semestres' },
                  { value: '1', label: 'Semestre 1 (S1)', badge: 'S1' },
                  { value: '2', label: 'Semestre 2 (S2)', badge: 'S2' },
                  { value: '3', label: 'Semestre 3 (S3)', badge: 'S3' },
                  { value: '4', label: 'Semestre 4 (S4)', badge: 'S4' },
                  { value: '5', label: 'Semestre 5 (S5)', badge: 'S5' },
                  { value: '6', label: 'Semestre 6 (S6)', badge: 'S6' },
                  { value: '7', label: 'Semestre 7 (S7)', badge: 'S7' },
                  { value: '8', label: 'Semestre 8 (S8)', badge: 'S8' },
                ]}
                placeholder="Tous les semestres"
                className="w-56 min-w-0"
              />

              {/* Room Type Filter */}
              <CustomSelect
                value={masterTypeFilter}
                onChange={(v) => setMasterTypeFilter(String(v))}
                icon={<Building2 size={14} className="text-amber-500" />}
                options={[
                  { value: 'all', label: 'Tous les espaces' },
                  { value: 'amphitheater', label: 'Amphithéâtres (CM)', badge: 'Amphi' },
                  { value: 'classroom', label: 'Salles de Cours / TD', badge: 'TD' },
                  { value: 'lab', label: 'Laboratoires TP / Info', badge: 'Labo' },
                ]}
                placeholder="Tous les espaces"
                className="w-56 min-w-0"
              />

              {/* Week Date Picker in JJ/MM/AAAA format */}
              <DatePicker
                value={masterStartDate}
                onChange={setMasterStartDate}
                placeholder="JJ/MM/AAAA"
                inputClassName="h-10"
                ariaLabel="Sélectionner la date de début de semaine"
              />

              {/* Export CSV / Excel */}
              <button
                type="button"
                onClick={handleExportMasterCsv}
                className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm shadow-emerald-600/25"
              >
                <FileSpreadsheet size={13} />
                <span>Exporter Excel</span>
              </button>

              {/* Refresh */}
              <button
                type="button"
                onClick={loadMasterMatrix}
                disabled={masterLoading}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                title="Actualiser la matrice"
              >
                <RefreshCw size={14} className={cn(masterLoading && "animate-spin text-indigo-500")} />
              </button>
            </div>
          </div>

          {/* Filiere Color Legend Bar */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-[10px] font-bold">
            <span className="text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Layers size={11} className="text-slate-400" /> Légende des Filières :
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span> TC (Tronc Commun)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span> GFC (Finance & Comptabilité)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> MCM / MAC (Marketing & Commerce)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span> ACG (Audit & Contrôle de Gestion)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800">
              <span className="w-2 h-2 rounded-full bg-cyan-600"></span> Rattrapage / Extra
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-dashed border-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Libre (Clic pour réserver)
            </span>
          </div>

          {/* Master Table */}
          {masterLoading ? (
            <div className="py-24 flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-sm font-medium">Génération de la matrice hebdomadaire ENCG…</span>
            </div>
          ) : !masterMatrixData?.rooms?.length ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              Aucune salle trouvée avec ces critères.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-md">
              <table className="w-full min-w-[1150px] border-collapse text-xs">
                <thead>
                  {/* Top Institutional Header Row */}
                  <tr className="bg-gradient-to-r from-[#001438] via-[#00225A] to-[#001438] text-white border-b border-indigo-900/60">
                    <th colSpan={9} className="py-3 px-5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[10px] uppercase font-mono text-indigo-200/90 font-semibold tracking-widest flex items-center gap-2">
                          <Building2 size={13} className="text-amber-400" />
                          ENCG FÈS · DIRECTION DES ÉTUDES & GESTION DES ESPACES
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          Grille Hebdomadaire d'Occupation des Espaces Pédagogiques
                        </span>
                        <span className="text-[10px] font-mono text-indigo-300 font-semibold bg-white/10 px-2 py-0.5 rounded-md">
                          {masterMatrixData?.week_label || 'Semaine en cours'}
                        </span>
                      </div>
                    </th>
                  </tr>

                  {/* Executive Columns Header */}
                  <tr className="bg-slate-900 dark:bg-slate-950 text-slate-100 font-black uppercase text-[10px] tracking-wider border-b-2 border-indigo-500/50 shadow-xs">
                    <th className="py-3 px-3.5 text-left w-44 border-r border-slate-800">
                      <span className="flex items-center gap-1.5">
                        <DoorOpen size={12} className="text-amber-400" /> Salle & Type
                      </span>
                    </th>
                    <th className="py-3 px-2.5 text-center w-28 border-r border-slate-800">
                      <span className="flex items-center justify-center gap-1">
                        <Users size={12} className="text-blue-400" /> Capacité
                      </span>
                    </th>
                    <th className="py-3 px-3 text-center w-36 border-r border-slate-800">
                      <span className="flex items-center justify-center gap-1">
                        <Clock size={12} className="text-amber-400" /> Créneau
                      </span>
                    </th>
                    <th className="py-3 px-2 text-center w-40 border-r border-slate-800">Lundi</th>
                    <th className="py-3 px-2 text-center w-40 border-r border-slate-800">Mardi</th>
                    <th className="py-3 px-2 text-center w-40 border-r border-slate-800">Mercredi</th>
                    <th className="py-3 px-2 text-center w-40 border-r border-slate-800">Jeudi</th>
                    <th className="py-3 px-2 text-center w-40 border-r border-slate-800">Vendredi</th>
                    <th className="py-3 px-2 text-center w-40">Samedi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {masterMatrixData.rooms.map((room: any) => (
                    <React.Fragment key={room.room_id}>
                      {room.slots.map((slot: any, sIdx: number) => {
                        const isFirstSlot = sIdx === 0
                        return (
                          <tr
                            key={`${room.room_id}-${slot.slot_index}`}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors divide-x divide-slate-100 dark:divide-slate-800/70"
                          >
                            {/* Room Name (RowSpan = 4) */}
                            {isFirstSlot && (
                              <td
                                rowSpan={room.slots.length}
                                className="py-3.5 px-3.5 bg-slate-50/70 dark:bg-slate-900/60 font-black text-slate-900 dark:text-slate-100 text-left align-middle border-r border-slate-200 dark:border-slate-800 shadow-2xs"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                                    <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{room.name}</p>
                                  </div>
                                  <div>
                                    <span className={cn(
                                      "inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border",
                                      room.type === 'amphitheater'
                                        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                                        : room.type === 'lab'
                                        ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                                        : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                    )}>
                                      {room.type === 'amphitheater' ? '🏛️ Amphithéâtre' : (room.type === 'lab' ? '💻 Labo Info' : '📖 Salle TD')}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                                    <MapPin size={10} className="text-slate-400 shrink-0" /> {room.building || 'Campus Principal'}
                                  </p>
                                </div>
                              </td>
                            )}

                            {/* Capacity (RowSpan = 4) */}
                            {isFirstSlot && (
                              <td
                                rowSpan={room.slots.length}
                                className="py-3 px-2 bg-slate-50/50 dark:bg-slate-900/40 text-center align-middle border-r border-slate-200 dark:border-slate-800"
                              >
                                <div className="flex flex-col items-center justify-center">
                                  <span className="text-base font-black text-slate-900 dark:text-slate-100 leading-none">
                                    {getDisplayCapacity(room)}
                                  </span>
                                  <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Places</span>
                                  {isExamMode && (
                                    <span className="mt-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                                      Exam 50%
                                    </span>
                                  )}
                                </div>
                              </td>
                            )}

                            {/* Time Slot Label */}
                            <td className="py-2.5 px-2 bg-slate-100/40 dark:bg-slate-800/30 text-center border-r border-slate-200 dark:border-slate-800">
                              <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200/80 dark:border-slate-700 shadow-2xs inline-block">
                                {slot.time_label}
                              </span>
                            </td>

                            {/* Days 1 to 6 (Lundi to Samedi) */}
                            {[1, 2, 3, 4, 5, 6].map(dayIdx => {
                              const cell = slot.days[dayIdx]
                              const isOccupied = cell?.status === 'occupied'

                              return (
                                <td
                                  key={dayIdx}
                                  className="p-1 text-center align-middle"
                                >
                                  {isOccupied ? (
                                    <div
                                      className={cn(
                                        "p-2.5 rounded-xl border text-left transition-all shadow-2xs hover:shadow-xs group relative cursor-default",
                                        getThemeClasses(cell.color_theme, true)
                                      )}
                                      title={`${cell.module_name} — ${cell.professor_name}`}
                                    >
                                      {/* Promo / Group Badge */}
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className="font-black text-[10px] uppercase tracking-wide truncate">
                                          {cell.badge_label}
                                        </span>
                                        <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-mono">
                                          {cell.session_type === 'cm' ? 'CM' : (cell.session_type === 'td' ? 'TD' : 'TP')}
                                        </span>
                                      </div>

                                      {/* Module Title */}
                                      <p className="text-[10px] font-black truncate leading-snug" title={cell.module_name}>
                                        {cell.module_name}
                                      </p>

                                      {/* Professor Name */}
                                      <p className="text-[9px] opacity-80 truncate mt-1 flex items-center gap-1 font-medium">
                                        <Users size={10} className="shrink-0 opacity-70" />
                                        <span>{cell.professor_name}</span>
                                      </p>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenBooking(room, cell?.date, slot.slot_index - 1)}
                                      className="w-full h-full min-h-[56px] p-2 rounded-xl border border-dashed border-emerald-300/70 dark:border-emerald-800/60 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.09] text-center transition-all flex flex-col items-center justify-center cursor-pointer group hover:border-emerald-500 shadow-2xs"
                                      title="Créneau libre — Cliquer pour réserver un rattrapage"
                                    >
                                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 group-hover:hidden flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        Libre
                                      </span>
                                      <span className="hidden group-hover:inline-flex items-center gap-1 text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                                        <PlusCircle size={12} /> Réserver
                                      </span>
                                    </button>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2: SMART ROOM FINDER & RATTRAPAGE
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'finder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Form: Search Parameters */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-indigo-500" />
                Paramètres de la Séance
              </h2>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full">
                Effectif : {calculatedHeadcount} étudiants
              </span>
            </div>

            <div className="space-y-3">
              {/* Date in JJ/MM/AAAA format */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Date Souhaitée (JJ/MM/AAAA)</label>
                <DatePicker
                  value={targetDate}
                  onChange={setTargetDate}
                  placeholder="JJ/MM/AAAA"
                  className="w-full"
                  inputClassName="h-10 w-full"
                  ariaLabel="Sélectionner la date souhaitée"
                />
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Créneau Horaire</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TIME_BLOCKS.map((block, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSlotIndex(idx)}
                      className={cn(
                        "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                        selectedSlotIndex === idx
                          ? "bg-[#001A4B] text-white border-[#001A4B] shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                      )}
                    >
                      {block.start} – {block.end}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type of Session */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Type de Séance</label>
                <CustomSelect
                  value={sessionType}
                  onChange={(val) => setSessionType(String(val))}
                  options={[
                    { value: 'cm', label: 'Cours Magistral (CM)', badge: 'Amphi requis' },
                    { value: 'td', label: 'Travaux Dirigés (TD)', badge: 'Salle standard' },
                    { value: 'rattrapage', label: 'Séance de Rattrapage', badge: 'Rattrapage' },
                    { value: 'seminar', label: 'Séminaire / Master', badge: 'Master' },
                    { value: 'exam', label: 'Examen / Épreuve de contrôle', badge: 'Jauge 50%' },
                  ]}
                  className="w-full min-w-0"
                />
              </div>

              {/* Filiere & Groups */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Filière</label>
                  <CustomSelect
                    value={selectedFiliereId}
                    onChange={(val) => setSelectedFiliereId(String(val))}
                    options={[
                      { value: '', label: 'Toutes les filières (Aucune)' },
                      ...filieres.map(f => ({
                        value: String(f.id),
                        label: `${f.code || f.label} — ${f.name || f.label}`,
                        badge: f.code
                      }))
                    ]}
                    searchable
                    placeholder="Sélectionner une filière"
                    className="w-full min-w-0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Effectif Personnalisé</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    placeholder={`Auto (${calculatedHeadcount})`}
                    value={customHeadcount}
                    onChange={(e) => setCustomHeadcount(e.target.value)}
                    className={selectClass}
                  />
                </div>
              </div>

              {/* Group checkboxes if filiere selected */}
              {groups.length > 0 && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Groupes concernés</label>
                  <div className="flex flex-wrap gap-1.5">
                    {groups.map((g: any) => {
                      const isChecked = selectedGroupIds.includes(g.id)
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedGroupIds(selectedGroupIds.filter(id => id !== g.id))
                            } else {
                              setSelectedGroupIds([...selectedGroupIds, g.id])
                            }
                          }}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                            isChecked
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          )}
                        >
                          {g.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Target Room (Optional) */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Salle Spécifique Souhaitée <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <CustomSelect
                  value={preferredRoomId}
                  onChange={(val) => setPreferredRoomId(String(val))}
                  options={[
                    { value: '', label: 'Aucune préférence (Trouver la meilleure salle)' },
                    ...rooms.map(r => ({
                      value: String(r.id),
                      label: `${r.name} (${r.type === 'amphitheater' ? 'Amphi' : 'Salle TD'} · ${getDisplayCapacity(r)} places)`,
                      badge: `${getDisplayCapacity(r)} pl.`
                    }))
                  ]}
                  searchable
                  placeholder="Aucune préférence"
                  className="w-full min-w-0"
                />
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleRunSmartFind}
                disabled={searching}
                className="w-full flex items-center justify-center gap-2 h-11 px-5 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all active:scale-95 disabled:opacity-60 cursor-pointer shadow-md mt-2"
                style={{ background: 'linear-gradient(135deg, #001A4B, #003087)' }}
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
                Vérifier Disponibilité & Trouver une Salle
              </button>
            </div>
          </div>

          {/* Right Results: Diagnostic & Suggestions */}
          <div className="lg:col-span-7 space-y-4">
            {!finderResult ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center bg-white/50 dark:bg-slate-900/50">
                <DoorOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">Prêt pour la recherche</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Sélectionnez la date, le créneau et les groupes, puis cliquez sur « Vérifier Disponibilité ». Le système détectera les conflits et proposera les meilleures salles.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Preferred Room Status Card */}
                {finderResult.preferred_room && (
                  <div className={cn(
                    "rounded-2xl p-5 border transition-all",
                    finderResult.preferred_room.is_available
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                      : "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200"
                  )}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs",
                          finderResult.preferred_room.is_available ? "bg-emerald-600" : "bg-amber-500"
                        )}>
                          {finderResult.preferred_room.is_available ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                              {finderResult.preferred_room.room_name}
                            </h3>
                            <span className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                              finderResult.preferred_room.is_available ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                            )}>
                              {finderResult.preferred_room.is_available ? 'Salle Libre' : 'Salle Occupée'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            {finderResult.preferred_room.is_available
                              ? `Disponible pour le créneau ${finderResult.query.start_time}–${finderResult.query.end_time} (${finderResult.preferred_room.capacity} places).`
                              : finderResult.preferred_room.conflict_reason}
                          </p>
                        </div>
                      </div>

                      {finderResult.preferred_room.is_available && (
                        <button
                          type="button"
                          onClick={() => handleOpenBooking(finderResult.preferred_room)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
                        >
                          <PlusCircle size={14} /> Réserver cette salle
                        </button>
                      )}
                    </div>

                    {/* Alternative slots for the same room if occupied */}
                    {!finderResult.preferred_room.is_available && finderResult.alternative_slots?.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-800/60">
                        <p className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-2">
                          Créneaux alternatifs libres pour {finderResult.preferred_room.room_name} :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {finderResult.alternative_slots.map((altSlot: any, i: number) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setTargetDate(altSlot.date)
                                const idx = TIME_BLOCKS.findIndex(b => b.start === altSlot.start_time)
                                if (idx >= 0) setSelectedSlotIndex(idx)
                                toast.info(`Créneau basculé sur ${altSlot.label}`)
                              }}
                              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-amber-100 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Clock size={12} className="text-amber-600" />
                              {altSlot.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Available Alternative Rooms List */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <DoorOpen className="w-3.5 h-3.5 text-indigo-500" />
                      Salles Libres Disponibles ({finderResult.available_rooms_count})
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">
                      Classées par pertinence & capacité {isExamMode ? '(Jauge 50%)' : ''}
                    </span>
                  </div>

                  {finderResult.available_rooms.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-400 font-medium">
                      Aucune salle libre trouvée pour cet effectif sur ce créneau. Essayez un autre créneau horaire.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-1">
                      {finderResult.available_rooms.map((room: any) => (
                        <div
                          key={room.id}
                          className={cn(
                            "rounded-xl p-4 border transition-all hover:border-indigo-300 dark:hover:border-indigo-700 space-y-2.5",
                            room.is_perfect_fit
                              ? "bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                              : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-black text-slate-900 dark:text-slate-100">{room.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{room.type === 'amphitheater' ? 'Amphithéâtre' : 'Salle TD'}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {getDisplayCapacity(room)} places {isExamMode ? 'exam' : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                            {room.has_projector && <span className="flex items-center gap-1"><Monitor size={11} /> Projecteur</span>}
                            {room.has_ac && <span className="flex items-center gap-1"><Thermometer size={11} /> Climatisation</span>}
                            <span className="flex items-center gap-1"><MapPin size={11} /> {room.building}</span>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleOpenBooking(room)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all active:scale-95 cursor-pointer"
                              style={{ background: 'linear-gradient(135deg, #001A4B, #003087)' }}
                            >
                              <PlusCircle size={12} /> Réserver
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3: DAILY MATRIX (HEATMAP)
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'matrix' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                Matrice Journalière d'Occupation des Salles
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Vue synoptique de toutes les salles pour la journée du{' '}
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {matrixDate ? format(parseISO(matrixDate), 'EEEE d MMMM yyyy', { locale: fr }) : ''}
                </span>{' '}
                ({matrixDate ? format(parseISO(matrixDate), 'dd/MM/yyyy') : ''}).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Date Picker strictly in JJ/MM/AAAA format */}
              <DatePicker
                value={matrixDate}
                onChange={setMatrixDate}
                placeholder="JJ/MM/AAAA"
                ariaLabel="Sélectionner la date de la matrice journalière"
              />

              {/* Room Type Filter */}
              <CustomSelect
                value={matrixTypeFilter}
                onChange={(val) => setMatrixTypeFilter(String(val))}
                options={[
                  { value: 'all', label: 'Tous les types de salles', badge: 'Tous' },
                  { value: 'amphitheater', label: 'Amphithéâtres de Cours', badge: 'Amphi' },
                  { value: 'classroom', label: 'Salles de TD standard', badge: 'TD' },
                  { value: 'lab', label: 'Laboratoires TP & Info', badge: 'Labo' },
                ]}
                placeholder="Filtrer par type"
                className="w-48 min-w-0"
              />
            </div>
          </div>

          {/* Stats pills */}
          {matrixData?.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-bold uppercase text-slate-400">Total Créneaux</p>
                <p className="text-lg font-black text-slate-800 dark:text-slate-100">{matrixData.stats.total_slots}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
                <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Créneaux Libres</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{matrixData.stats.free_slots}</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900">
                <p className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">Créneaux Occupés</p>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{matrixData.stats.occupied_slots}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
                <p className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Taux d'Occupation</p>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400">{matrixData.stats.global_occupancy_rate}%</p>
              </div>
            </div>
          )}

          {/* Matrix Grid */}
          {matrixLoading ? (
            <div className="py-20 flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Chargement de la matrice…</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[800px] text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
                    <th className="px-4 py-3 text-left w-52">Salle</th>
                    {TIME_BLOCKS.map(block => (
                      <th key={block.start} className="px-3 py-3 text-center">
                        {block.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {matrixData?.rooms?.map((r: any) => (
                    <tr key={r.room_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-black text-slate-900 dark:text-slate-100">{r.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {r.type === 'amphitheater' ? 'Amphi' : 'Salle TD'} · {getDisplayCapacity(r)} pl. {isExamMode ? '(exam)' : ''}
                        </p>
                      </td>
                      {r.slots?.map((slot: any, idx: number) => {
                        const isFree = slot.status === 'free'
                        const isClass = slot.status === 'class'
                        return (
                          <td key={idx} className="p-1.5 text-center">
                            <div className={cn(
                              "p-2 rounded-xl border transition-all text-left min-h-[58px] flex flex-col justify-between",
                              isFree
                                ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300"
                                : isClass
                                ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200"
                                : "bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
                            )}>
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  "text-[8px] font-black uppercase px-1.5 py-0.2 rounded",
                                  isFree ? "bg-emerald-600 text-white" : isClass ? "bg-indigo-600 text-white" : "bg-amber-600 text-white"
                                )}>
                                  {isFree ? 'Libre' : isClass ? 'Cours EDT' : 'Réservé'}
                                </span>
                              </div>
                              <p className="text-[10px] font-bold truncate mt-0.5" title={slot.title}>
                                {slot.title}
                              </p>
                              {slot.professor && (
                                <p className="text-[9px] opacity-75 truncate">{slot.professor} · {slot.group}</p>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 4: SINGLE ROOM SCHEDULE & DOOR SIGN PDF
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'room_schedule' && (
        <div className="space-y-5">
          {/* 1. Selected Room Showcase Banner */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/95 p-6 shadow-xs backdrop-blur-sm space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              {/* Room Identity */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs">
                  {currentScheduleRoom?.type === 'amphitheater' ? (
                    <Building2 size={28} />
                  ) : currentScheduleRoom?.type === 'lab' ? (
                    <Monitor size={28} />
                  ) : (
                    <DoorOpen size={28} />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {currentScheduleRoom?.name || 'Sélectionner une salle'}
                    </h2>
                    {currentScheduleRoom && (
                      <>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {currentScheduleRoom.type === 'amphitheater' ? 'Amphithéâtre' : currentScheduleRoom.type === 'lab' ? 'Laboratoire TP' : 'Salle TD'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Code: {currentScheduleRoom.code}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          Opérationnelle
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <span>Emploi du temps officiel par salle</span>
                    <span>•</span>
                    <span>Affichage de porte A4 avec QR Code dynamique</span>
                    <span>•</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{filteredScheduleEvents.length} séances planifiées</span>
                  </p>
                </div>
              </div>

              {/* Action Controls & Room Dropdown */}
              <div className="flex flex-wrap items-center gap-2.5">
                <CustomSelect
                  value={selectedScheduleRoomId}
                  onChange={(val) => setSelectedScheduleRoomId(String(val))}
                  icon={<Building2 size={14} className="text-indigo-500" />}
                  options={rooms.map((r: any) => ({
                    value: String(r.id),
                    label: `${r.name} (${r.type === 'amphitheater' ? 'Amphi' : 'Salle TD'} · ${getDisplayCapacity(r)} pl.)`,
                    badge: `${getDisplayCapacity(r)} pl.`
                  }))}
                  searchable
                  placeholder="Rechercher une salle..."
                  className="w-72 min-w-0"
                />

                {/* PDF Door Sign Export */}
                <button
                  type="button"
                  onClick={handleDownloadDoorSign}
                  disabled={exportingPdf || !selectedScheduleRoomId}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-800 hover:from-blue-950 hover:to-indigo-900 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
                  title="Télécharger l'affiche officielle A4 prête pour impression"
                >
                  {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                  <span>Affiche de Porte PDF (A4)</span>
                </button>

                {/* iCal Export */}
                <button
                  type="button"
                  onClick={handleExportIcs}
                  disabled={!selectedScheduleRoomId}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                  title="Exporter au format .ics pour Google Calendar, Outlook, Apple Calendar"
                >
                  <CalendarPlus size={14} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Sync (.ics)</span>
                </button>

                {/* Direct Booking Shortcut */}
                {currentScheduleRoom && (
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(currentScheduleRoom)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all active:scale-95 cursor-pointer border border-indigo-200/80 dark:border-indigo-800/80"
                    title="Réserver une séance de rattrapage dans cette salle"
                  >
                    <PlusCircle size={14} />
                    <span>Réserver</span>
                  </button>
                )}
              </div>
            </div>

            {/* Room Features & KPIs */}
            {currentScheduleRoom && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Capacité Cours</p>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">{currentScheduleRoom.capacity} places</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Capacité Examen</p>
                    <p className="text-sm font-black text-amber-600 dark:text-amber-400">
                      {currentScheduleRoom.exam_capacity ?? Math.floor(currentScheduleRoom.capacity / 2)} places (Anti-fraude)
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Monitor size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vidéoprojecteur</p>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {currentScheduleRoom.has_projector ? '✅ Installé & Connecté' : '❌ Non équipé'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <Thermometer size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Climatisation</p>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {currentScheduleRoom.has_ac ? '✅ Équipée (Réversible)' : '❌ Non équipée'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Mode Switcher & Filters Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            {/* View Mode Buttons */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <button
                type="button"
                onClick={() => setScheduleViewMode('timeline')}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  scheduleViewMode === 'timeline'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <LayoutList size={13} />
                <span>Planning par Jour</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleViewMode('preview_a4')}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  scheduleViewMode === 'preview_a4'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <Eye size={13} />
                <span>Aperçu Affiche A4</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleViewMode('matrix')}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  scheduleViewMode === 'matrix'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <Table size={13} />
                <span>Matrice Hebdo</span>
              </button>
            </div>

            {/* Day Filter Pills (shown in timeline view) */}
            {scheduleViewMode === 'timeline' && (
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedScheduleDay(0)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5',
                    selectedScheduleDay === 0
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  )}
                >
                  <span>Tous</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-extrabold">
                    {roomScheduleEvents.length}
                  </span>
                </button>

                {DAYS_LIST.map((d) => (
                  <button
                    key={d.index}
                    type="button"
                    onClick={() => setSelectedScheduleDay(d.index)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5',
                      selectedScheduleDay === d.index
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    )}
                  >
                    <span>{d.label}</span>
                    <span className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                      eventsCountByDay[d.index] > 0
                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    )}>
                      {eventsCountByDay[d.index]}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Search filter inside sessions */}
            <div className="relative shrink-0">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={scheduleSearchQuery}
                onChange={(e) => setScheduleSearchQuery(e.target.value)}
                placeholder="Filtrer prof, module, grp…"
                className="w-full sm:w-56 pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              {scheduleSearchQuery && (
                <button
                  type="button"
                  onClick={() => setScheduleSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* 3. Main Views Content */}
          {roomScheduleLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-sm font-semibold">Chargement des séances de la salle…</span>
            </div>
          ) : (
            <>
              {/* VIEW 1: STRUCTURED TIMELINE BY DAY */}
              {scheduleViewMode === 'timeline' && (
                <div className="space-y-4">
                  {DAYS_LIST
                    .filter((d) => selectedScheduleDay === 0 || selectedScheduleDay === d.index)
                    .map((dayItem) => {
                      // Get all events scheduled on this day
                      const dayEvents = filteredScheduleEvents.filter((evt: any) => {
                        if (!evt.start) return false
                        const dayNum = new Date(evt.start).getDay()
                        return dayNum === dayItem.index
                      })

                      return (
                        <div
                          key={dayItem.index}
                          className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-4"
                        >
                          {/* Day Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60">
                                {dayItem.short}
                              </span>
                              <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                                  {dayItem.label}
                                </h3>
                                <p className="text-[11px] text-slate-400 font-medium">
                                  {dayEvents.length === 0
                                    ? 'Aucune séance programmée — Salle entièrement libre'
                                    : `${dayEvents.length} séance(s) programmée(s)`}
                                </p>
                              </div>
                            </div>

                            <span className={cn(
                              'px-3 py-1 rounded-full text-xs font-bold border',
                              dayEvents.length > 0
                                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            )}>
                              {dayEvents.length > 0 ? `${dayEvents.length} occupée(s)` : '100% Disponible'}
                            </span>
                          </div>

                          {/* 4 Standard Time Blocks */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {TIME_BLOCKS.map((slot, slotIdx) => {
                              // Find sessions in this slot
                              const slotEvents = dayEvents.filter((evt: any) => {
                                if (!evt.start) return false
                                const timeStr = format(new Date(evt.start), 'HH:mm')
                                if (slot.start === '08:30') return timeStr.startsWith('08:') || timeStr.startsWith('09:')
                                if (slot.start === '10:45') return timeStr.startsWith('10:') || timeStr.startsWith('11:') || timeStr.startsWith('12:')
                                if (slot.start === '14:30') return timeStr.startsWith('14:') || timeStr.startsWith('15:')
                                if (slot.start === '16:45') return timeStr.startsWith('16:') || timeStr.startsWith('17:') || timeStr.startsWith('18:')
                                return false
                              })

                              const isOccupied = slotEvents.length > 0

                              return (
                                <div
                                  key={slotIdx}
                                  className={cn(
                                    'p-4 rounded-2xl border transition-all flex flex-col justify-between min-h-[140px]',
                                    isOccupied
                                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/80 shadow-2xs'
                                      : 'bg-slate-50/60 dark:bg-slate-800/30 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                  )}
                                >
                                  {/* Slot Header */}
                                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                                    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                      <Clock size={11} className={isOccupied ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                                      {slot.start} – {slot.end}
                                    </span>
                                    <span className={cn(
                                      'px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider',
                                      isOccupied
                                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                    )}>
                                      {isOccupied ? 'Occupé' : 'Libre'}
                                    </span>
                                  </div>

                                  {/* Content */}
                                  {isOccupied ? (
                                    <div className="py-2.5 space-y-2">
                                      {slotEvents.map((evt: any, evIdx: number) => (
                                        <div key={evIdx} className="space-y-1">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-indigo-600 text-white">
                                              {evt.extendedProps?.type || 'CM'}
                                            </span>
                                            {evt.extendedProps?.module_code && (
                                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                {evt.extendedProps.module_code}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs font-black text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                                            {evt.title}
                                          </p>
                                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate flex items-center gap-1">
                                            <span>👤</span>
                                            <span>{evt.extendedProps?.professor || 'Enseignant'}</span>
                                          </p>
                                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                                            👥 {evt.extendedProps?.group || 'Groupe'}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="py-4 text-center space-y-2">
                                      <p className="text-xs text-slate-400 font-medium">
                                        Salle disponible
                                      </p>
                                      {currentScheduleRoom && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenBooking(currentScheduleRoom, undefined, slotIdx)}
                                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold transition-all border border-emerald-200 dark:border-emerald-800 cursor-pointer shadow-2xs"
                                        >
                                          <PlusCircle size={11} />
                                          <span>Réserver ce créneau</span>
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {/* Slot Footer */}
                                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-medium flex justify-between items-center">
                                    <span>{slot.label.split('(')[1]?.replace(')', '') || ''}</span>
                                    {isOccupied && (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                                        <Check size={10} /> Validé
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}

              {/* VIEW 2: REALISTIC A4 DOOR SIGN PREVIEW */}
              {scheduleViewMode === 'preview_a4' && (
                <div className="space-y-4">
                  {/* Action Bar for Preview */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      <Eye size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Aperçu fidèle du panneau de porte A4 officiel qui sera imprimé et affiché à l'entrée de la salle</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadDoorSign}
                        disabled={exportingPdf}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-60"
                      >
                        {exportingPdf ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
                        <span>Télécharger PDF A4 Officiel</span>
                      </button>
                    </div>
                  </div>

                  {/* A4 Sheet Container */}
                  <div className="max-w-4xl mx-auto bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 sm:p-12 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-xl space-y-6 font-sans">
                    {/* Official Institutional Header */}
                    <div className="text-center pb-4 border-b-2 border-[#001A4B] space-y-1">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        Royaume du Maroc • Université Sidi Mohamed Ben Abdellah
                      </p>
                      <h1 className="text-base sm:text-lg font-black text-[#001A4B] dark:text-blue-400 uppercase tracking-wide">
                        École Nationale de Commerce et de Gestion — ENCG Fès
                      </h1>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        Direction Académique & des Affaires Pédagogiques • Emploi du Temps Officiel
                      </p>
                    </div>

                    {/* Room Hero Navy Box */}
                    <div className="bg-[#001A4B] text-white p-6 rounded-2xl text-center space-y-1 shadow-md">
                      <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">
                        {currentScheduleRoom?.name || 'SALLE DE COURS'}
                      </h2>
                      <p className="text-xs font-bold text-blue-200 tracking-wide">
                        {currentScheduleRoom?.type === 'amphitheater'
                          ? 'AMPHITHÉÂTRE DE COURS MAGISTRAUX'
                          : currentScheduleRoom?.type === 'lab'
                          ? 'LABORATOIRE INFORMATIQUE & TP'
                          : 'SALLE DE TRAVAUX DIRIGÉS (TD)'}{' '}
                        • CODE : {currentScheduleRoom?.code || 'S-XXX'}
                      </p>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Capacité Cours</p>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">{currentScheduleRoom?.capacity || 40} places</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Capacité Examen</p>
                        <p className="text-sm font-black text-rose-600 dark:text-rose-400">
                          {currentScheduleRoom?.exam_capacity ?? Math.floor((currentScheduleRoom?.capacity || 40) / 2)} places
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Vidéoprojecteur</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {currentScheduleRoom?.has_projector ? '✅ Installé' : '❌ Non'}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Climatisation</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {currentScheduleRoom?.has_ac ? '✅ Équipée' : '❌ Non'}
                        </p>
                      </div>
                    </div>

                    {/* Official Timetable Matrix Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#001A4B] text-white text-[10px] font-bold uppercase tracking-wider">
                            <th className="p-2.5 border-r border-blue-900 w-24 text-center">Jour</th>
                            <th className="p-2.5 border-r border-blue-900 text-center">08:30 – 10:30</th>
                            <th className="p-2.5 border-r border-blue-900 text-center">10:45 – 12:45</th>
                            <th className="p-2.5 border-r border-blue-900 text-center">14:30 – 16:30</th>
                            <th className="p-2.5 text-center">16:45 – 18:45</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                          {DAYS_LIST.map((dayItem) => {
                            const dayEvents = roomScheduleEvents.filter((evt: any) => {
                              if (!evt.start) return false
                              return new Date(evt.start).getDay() === dayItem.index
                            })

                            return (
                              <tr key={dayItem.index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-100/70 dark:bg-slate-900/70 text-center border-r border-slate-200 dark:border-slate-800">
                                  {dayItem.label}
                                </td>
                                {TIME_BLOCKS.map((slot, slotIdx) => {
                                  const matching = dayEvents.filter((evt: any) => {
                                    if (!evt.start) return false
                                    const timeStr = format(new Date(evt.start), 'HH:mm')
                                    if (slot.start === '08:30') return timeStr.startsWith('08:') || timeStr.startsWith('09:')
                                    if (slot.start === '10:45') return timeStr.startsWith('10:') || timeStr.startsWith('11:') || timeStr.startsWith('12:')
                                    if (slot.start === '14:30') return timeStr.startsWith('14:') || timeStr.startsWith('15:')
                                    if (slot.start === '16:45') return timeStr.startsWith('16:') || timeStr.startsWith('17:') || timeStr.startsWith('18:')
                                    return false
                                  })

                                  return (
                                    <td
                                      key={slotIdx}
                                      className={cn(
                                        'p-2 border-r last:border-r-0 border-slate-200 dark:border-slate-800 align-top',
                                        matching.length > 0 ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                                      )}
                                    >
                                      {matching.length > 0 ? (
                                        matching.map((evt: any, idx: number) => (
                                          <div
                                            key={idx}
                                            className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[10px] space-y-1 mb-1 last:mb-0"
                                          >
                                            <p className="font-bold text-blue-900 dark:text-blue-200 leading-tight">
                                              {evt.title}
                                            </p>
                                            <p className="text-[9px] text-slate-500 font-mono">
                                              {evt.extendedProps?.module_code} • {evt.extendedProps?.group}
                                            </p>
                                            <p className="text-[9px] text-slate-700 dark:text-slate-300 font-medium">
                                              Pr. {evt.extendedProps?.professor}
                                            </p>
                                          </div>
                                        ))
                                      ) : (
                                        <span className="text-[10px] text-slate-300 dark:text-slate-700 italic block text-center py-2">
                                          Libre
                                        </span>
                                      )}
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Official Sign Footer with Live QR Preview */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center sm:text-left">
                        <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100">
                          Direction des Études & de la Planification • ENCG Fès
                        </p>
                        <p className="text-[9px] text-slate-400">
                          Document officiel certifié. Toute modification ou cours de rattrapage est répercuté automatiquement en direct.
                        </p>
                      </div>

                      {/* Live QR Box */}
                      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                        <div className="w-14 h-14 bg-white p-1 rounded-xl border border-slate-200 flex items-center justify-center shadow-2xs">
                          <QrCode size={46} className="text-slate-900" />
                        </div>
                        <div className="text-left text-[9px] space-y-0.5">
                          <span className="font-black text-indigo-600 uppercase tracking-wider block">QR Code Sécurisé</span>
                          <span className="text-slate-500 block">Scanner pour vérifier</span>
                          <span className="text-slate-500 block font-semibold">le statut en direct</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 3: COMPACT WEEKLY MATRIX */}
              {scheduleViewMode === 'matrix' && (
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Table size={15} className="text-indigo-500" />
                      <span>Matrice Hebdomadaire Synthétique — {currentScheduleRoom?.name}</span>
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                      Synthèse de tous les créneaux
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                          <th className="p-3 w-32 border-b border-slate-200 dark:border-slate-700">Jour</th>
                          {TIME_BLOCKS.map((tb, idx) => (
                            <th key={idx} className="p-3 border-b border-slate-200 dark:border-slate-700 text-center">
                              {tb.start} – {tb.end}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {DAYS_LIST.map((dayItem) => {
                          const dayEvents = roomScheduleEvents.filter((evt: any) => {
                            if (!evt.start) return false
                            return new Date(evt.start).getDay() === dayItem.index
                          })

                          return (
                            <tr key={dayItem.index} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800/30">
                                {dayItem.label}
                              </td>
                              {TIME_BLOCKS.map((slot, slotIdx) => {
                                const matching = dayEvents.filter((evt: any) => {
                                  if (!evt.start) return false
                                  const timeStr = format(new Date(evt.start), 'HH:mm')
                                  if (slot.start === '08:30') return timeStr.startsWith('08:') || timeStr.startsWith('09:')
                                  if (slot.start === '10:45') return timeStr.startsWith('10:') || timeStr.startsWith('11:') || timeStr.startsWith('12:')
                                  if (slot.start === '14:30') return timeStr.startsWith('14:') || timeStr.startsWith('15:')
                                  if (slot.start === '16:45') return timeStr.startsWith('16:') || timeStr.startsWith('17:') || timeStr.startsWith('18:')
                                  return false
                                })

                                return (
                                  <td key={slotIdx} className="p-2.5 text-center">
                                    {matching.length > 0 ? (
                                      <div className="space-y-1">
                                        {matching.map((m: any, mIdx: number) => (
                                          <div
                                            key={mIdx}
                                            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold"
                                          >
                                            <p className="truncate">{m.title}</p>
                                            <p className="text-[9px] text-slate-500 font-normal">
                                              Pr. {m.extendedProps?.professor} ({m.extendedProps?.group})
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                                        Libre
                                      </span>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 5: BOOKINGS LEDGER
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'bookings' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Registre des Réservations & Rattrapages
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Historique et suivi des demandes de réservation de salles.
              </p>
            </div>
          </div>

          {bookingsLoading ? (
            <div className="py-20 flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Chargement des réservations…</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              Aucune réservation enregistrée.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[700px] text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
                    <th className="px-4 py-3 text-left">Salle</th>
                    <th className="px-4 py-3 text-left">Date & Heure</th>
                    <th className="px-4 py-3 text-left">Motif</th>
                    <th className="px-4 py-3 text-left">Demandeur</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bookings.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                        {b.room?.name || b.room_name}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                        {b.start_time ? format(new Date(b.start_time), 'dd/MM/yyyy HH:mm') : '-'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {b.purpose}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {b.booker ? `${b.booker.first_name} ${b.booker.last_name}` : 'Admin'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase",
                          b.status === 'approved' ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                            : b.status === 'rejected' ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
                            : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                        )}>
                          {b.status === 'approved' ? 'Validée' : b.status === 'rejected' ? 'Rejetée' : 'En attente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        {b.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(b.id, 'approved')}
                              className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold"
                            >
                              Approuver
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(b.id, 'rejected')}
                              className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold"
                            >
                              Rejeter
                            </button>
                          </>
                        )}
                        {b.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                            className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold"
                          >
                            Annuler
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          CONFIRMATION MODAL FOR BOOKING WITH AUTO-NOTIFICATION
      ══════════════════════════════════════════════════════ */}
      {bookingModalOpen && bookingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 space-y-5">
            
            <div className="p-6 text-white relative" style={{ background: 'linear-gradient(135deg, #001A4B 0%, #003087 50%, #001A4B 100%)' }}>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Confirmation de Réservation
              </span>
              <h3 className="font-black text-xl tracking-tight">Réserver {bookingRoom.name}</h3>
              <p className="text-xs text-blue-200/80 font-medium mt-1">
                Créneau : {targetDate ? format(parseISO(targetDate), 'dd/MM/yyyy') : ''} · {TIME_BLOCKS[selectedSlotIndex]?.label || 'Créneau sélectionné'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Motif / Intitulé de la Séance *
                </label>
                <input
                  type="text"
                  value={bookingPurpose}
                  onChange={(e) => setBookingPurpose(e.target.value)}
                  placeholder="Ex: Séance de rattrapage — Marketing Approfondi"
                  className={selectClass}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p><strong>Salle :</strong> {bookingRoom.name} ({getDisplayCapacity(bookingRoom)} places {isExamMode ? 'exam' : ''})</p>
                <p><strong>Effectif prévu :</strong> {calculatedHeadcount} étudiants</p>
                <p><strong>Date & Heure :</strong> {targetDate ? format(parseISO(targetDate), 'dd/MM/yyyy') : ''} ({TIME_BLOCKS[selectedSlotIndex]?.label})</p>
              </div>

              {/* Notification Toggle */}
              {selectedGroupIds.length > 0 && (
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyStudents}
                    onChange={(e) => setNotifyStudents(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <BellRing size={13} className="text-indigo-600" />
                      Notifier automatiquement les étudiants
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Envoie une notification Push in-app + Email officiel aux étudiants des groupes sélectionnés.
                    </p>
                  </div>
                </label>
              )}

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-4 py-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={submittingBooking}
                  className="flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #001A4B, #003087)' }}
                >
                  {submittingBooking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Confirmer la Réservation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
