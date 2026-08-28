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
  BellRing
} from 'lucide-react'
import api from '@/shared/lib/api'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const TIME_BLOCKS = [
  { start: '08:30', end: '10:30', label: '08:30 – 10:30 (Matin 1)' },
  { start: '10:45', end: '12:45', label: '10:45 – 12:45 (Matin 2)' },
  { start: '14:30', end: '16:30', label: '14:30 – 16:30 (Après-midi 1)' },
  { start: '16:45', end: '18:45', label: '16:45 – 18:45 (Après-midi 2)' },
]

export default function RoomAvailabilityHubPage() {
  const [activeTab, setActiveTab] = useState<'finder' | 'matrix' | 'room_schedule' | 'bookings'>('finder')
  const [isExamMode, setIsExamMode] = useState<boolean>(false)

  // --- Common Data ---
  const [rooms, setRooms] = useState<any[]>([])
  const [filieres, setFilieres] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)

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

  // --- Matrix State ---
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

  // Load Matrix Data
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
  const handleOpenBooking = (room: any) => {
    setBookingRoom(room)
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
      handleRunSmartFind()
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
      link.setAttribute('download', `Affiche_Porte_Salle_${selectedScheduleRoomId}.pdf`)
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

  // Helper for capacity in exam vs normal mode
  const getDisplayCapacity = (r: any) => {
    if (isExamMode) {
      return r.exam_capacity ?? Math.floor(r.capacity / 2)
    }
    return r.capacity
  }

  const selectClass = "h-10 w-full px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"

  return (
    <div className="max-w-[1700px] mx-auto p-4 md:p-6 space-y-5 font-sans pb-28">

      {/* ══════════════════════════════════════════════════════
          HERO HEADER — Deep ENCG Navy with Mode Toggle
      ══════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #001A4B 0%, #003087 50%, #001A4B 100%)' }}>
        <div className="absolute top-0 right-0 w-80 h-80 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 opacity-8 pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />

        <div className="relative z-10 p-6 md:p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300/90 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Infrastructure & Gestion du Campus · ENCG Fès
              </span>
              {isExamMode && (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-xs animate-pulse">
                  🛡️ Mode Capacité Examen (1 place sur 2)
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Occupation des Salles & Moteur de Rattrapage
            </h1>
            <p className="text-xs md:text-sm text-blue-200/70 font-medium max-w-2xl">
              Vérification instantanée de disponibilité, assistant intelligent pour séances de rattrapage / cours extras, et matrice d'occupation temps réel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Examen Switch */}
            <button
              type="button"
              onClick={() => {
                setIsExamMode(!isExamMode)
                toast.info(!isExamMode ? 'Mode Examen activé : les jauges sont basculées à 50% (Anti-fraude).' : 'Mode Enseignement standard rétabli.')
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-sm",
                isExamMode
                  ? "bg-rose-600 text-white border-rose-400 ring-2 ring-rose-300/30"
                  : "bg-white/10 hover:bg-white/20 text-white border-white/20"
              )}
            >
              <ShieldCheck className="w-4 h-4" />
              {isExamMode ? 'Jauge Examen : 1 place sur 2 (Active)' : 'Activer Jauge Examen (Anti-fraude)'}
            </button>

            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md">
              <DoorOpen className="w-5 h-5 text-indigo-300" />
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-200/70">Total Salles</p>
                <p className="text-sm font-black text-white">{rooms.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md">
              <Building2 className="w-5 h-5 text-emerald-300" />
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-200/70">Places {isExamMode ? 'Examen' : 'Enseignement'}</p>
                <p className="text-sm font-black text-white">
                  {rooms.reduce((acc, r) => acc + getDisplayCapacity(r), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)' }} />
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB NAVIGATION
      ══════════════════════════════════════════════════════ */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full md:w-fit overflow-x-auto">
        {[
          { id: 'finder' as const, label: 'Assistant Rattrapage & Smart Finder', icon: Sparkles },
          { id: 'matrix' as const, label: 'Matrice d\'Occupation Globale (Heatmap)', icon: Layers },
          { id: 'room_schedule' as const, label: 'Planning & Panneau de Porte PDF', icon: Calendar },
          { id: 'bookings' as const, label: 'Registre des Réservations', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab.id
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1: SMART ROOM FINDER & RATTRAPAGE
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
              {/* Date */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Date Souhaitée</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className={selectClass}
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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Type de Séance</label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className={selectClass}
                >
                  <option value="cm">Cours Magistral (CM) — Amphi requis</option>
                  <option value="td">Travaux Dirigés (TD) — Salle standard</option>
                  <option value="rattrapage">Séance de Rattrapage</option>
                  <option value="seminar">Séminaire / Master</option>
                  <option value="exam">Examen / Épreuve de contrôle (Jauge 50%)</option>
                </select>
              </div>

              {/* Filiere & Groups */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Filière</label>
                  <select
                    value={selectedFiliereId}
                    onChange={(e) => setSelectedFiliereId(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Sélectionner une filière</option>
                    {filieres.map(f => (
                      <option key={f.id} value={f.id}>{f.code} — {f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Effectif Personnalisé</label>
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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Salle Spécifique Souhaitée <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <select
                  value={preferredRoomId}
                  onChange={(e) => setPreferredRoomId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Aucune préférence (Trouver la meilleure salle)</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type === 'amphitheatre' ? 'Amphi' : 'Salle'} · {getDisplayCapacity(r)} places {isExamMode ? 'exam' : ''})
                    </option>
                  ))}
                </select>
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
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{room.type === 'amphitheatre' ? 'Amphithéâtre' : 'Salle TD'}</p>
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
          TAB 2: GLOBAL OCCUPANCY MATRIX (HEATMAP)
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'matrix' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                Matrice d'Occupation des Salles
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Vue synoptique de toutes les salles pour la journée du {matrixData?.day_name || matrixDate}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={matrixDate}
                onChange={(e) => setMatrixDate(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
              <select
                value={matrixTypeFilter}
                onChange={(e) => setMatrixTypeFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">Tous les types</option>
                <option value="amphitheatre">Amphithéâtres</option>
                <option value="classroom">Salles TD</option>
                <option value="lab">Laboratoires TP</option>
              </select>
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
                          {r.type === 'amphitheatre' ? 'Amphi' : 'Salle TD'} · {getDisplayCapacity(r)} pl. {isExamMode ? '(exam)' : ''}
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
          TAB 3: SINGLE ROOM SCHEDULE & DOOR SIGN PDF
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'room_schedule' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Planning Détaillé & Panneau de Porte PDF
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Consultez toutes les séances, exportez le panneau de porte A4 avec QR Code ou synchronisez votre agenda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-64">
                <select
                  value={selectedScheduleRoomId}
                  onChange={(e) => setSelectedScheduleRoomId(e.target.value)}
                  className={selectClass}
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type === 'amphitheatre' ? 'Amphi' : 'Salle'} · {getDisplayCapacity(r)} pl.)
                    </option>
                  ))}
                </select>
              </div>

              {/* PDF Door Sign Export */}
              <button
                type="button"
                onClick={handleDownloadDoorSign}
                disabled={exportingPdf}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-60"
              >
                {exportingPdf ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
                Affiche de Porte PDF (A4)
              </button>

              {/* iCal Export */}
              <button
                type="button"
                onClick={handleExportIcs}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <CalendarPlus size={13} className="text-indigo-600" />
                Sync Agenda (.ics)
              </button>
            </div>
          </div>

          {roomScheduleLoading ? (
            <div className="py-20 flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Chargement du planning…</span>
            </div>
          ) : roomScheduleEvents.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              Aucune séance programmée pour cette salle sur la période courante.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {roomScheduleEvents.map((evt: any, i: number) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                    <span>{evt.start ? format(new Date(evt.start), 'EEEE', { locale: fr }) : 'Jour'}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 font-mono">
                      {evt.start ? format(new Date(evt.start), 'HH:mm') : ''} – {evt.end ? format(new Date(evt.end), 'HH:mm') : ''}
                    </span>
                  </div>
                  <p className="font-black text-sm text-slate-900 dark:text-slate-100">{evt.title}</p>
                  <p className="text-xs text-slate-400 font-medium">
                    {evt.extendedProps?.professor} · {evt.extendedProps?.group}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 4: BOOKINGS LEDGER
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
                Créneau : {targetDate} · {TIME_BLOCKS[selectedSlotIndex].label}
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
                <p><strong>Date & Heure :</strong> {targetDate} ({TIME_BLOCKS[selectedSlotIndex].label})</p>
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
