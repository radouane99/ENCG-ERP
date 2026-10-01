import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Search, Plus, Edit2, Trash2, X, Monitor, Thermometer, Building, CheckCircle,
  Upload, Sparkles, Printer, CalendarCheck, DoorOpen, Loader2,
  Ticket, AlertTriangle, Clock, Calendar, Users, Layers, Download, Eye,
  Wifi, ShieldCheck, FileText, Check, CheckSquare, Settings, LayoutGrid, List,
  ArrowUpDown, Volume2, ShieldAlert
} from 'lucide-react'
import { cn, cleanUtf8Text } from '@shared/lib/utils'
import { CustomSelect, SelectOption } from '@shared/components/ui/CustomSelect'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import MassImportView from '@shared/components/ui/MassImportView'
import { generateRoomDoorSignHtml, generateAllRoomsDoorSignsHtml, RoomDocumentData } from '../utils/roomDocumentGenerator'

interface Room {
  id: number;
  name: string;
  code: string;
  type: string;
  capacity: number;
  exam_capacity?: number;
  has_projector: boolean;
  has_ac: boolean;
  is_available: boolean;
  building?: string;
  floor?: string;
  equipment_status?: Record<string, string>;
}

interface Stats {
  total: number;
  available: number;
  amphitheatres: number;
  total_capacity: number;
  total_exam_capacity?: number;
}

const TYPE_LABELS: Record<string, string> = {
  classroom: 'Salle TD',
  amphitheatre: 'Amphithéâtre',
  amphitheater: 'Amphithéâtre',
  lab: 'Laboratoire TP',
  seminar: 'Salle de Séminaire',
  admin: 'Bureau Admin'
}

interface RoomTheme {
  gradient: string;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
  glow: string;
  label: string;
  sublabel: string;
  icon: string;
}

const ROOM_TYPE_THEMES: Record<string, RoomTheme> = {
  amphitheatre: {
    gradient: 'from-[#001438] via-[#0A2558] to-[#113A7A]',
    badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
    badgeText: 'text-amber-300',
    accentBorder: 'hover:border-amber-400/70',
    glow: 'hover:shadow-amber-500/10',
    label: 'Amphithéâtre',
    sublabel: 'Grands Amphis • Cours Magistraux',
    icon: '🏛️',
  },
  amphitheater: {
    gradient: 'from-[#001438] via-[#0A2558] to-[#113A7A]',
    badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
    badgeText: 'text-amber-300',
    accentBorder: 'hover:border-amber-400/70',
    glow: 'hover:shadow-amber-500/10',
    label: 'Amphithéâtre',
    sublabel: 'Grands Amphis • Cours Magistraux',
    icon: '🏛️',
  },
  classroom: {
    gradient: 'from-[#022B59] via-[#03447E] to-[#0466A8]',
    badgeBg: 'bg-sky-400/20 text-sky-200 border-sky-400/40',
    badgeText: 'text-sky-300',
    accentBorder: 'hover:border-sky-400/70',
    glow: 'hover:shadow-sky-500/10',
    label: 'Salle TD',
    sublabel: 'Enseignement & Travaux Dirigés',
    icon: '🚪',
  },
  lab: {
    gradient: 'from-[#043328] via-[#06533D] to-[#0A7352]',
    badgeBg: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40',
    badgeText: 'text-emerald-300',
    accentBorder: 'hover:border-emerald-400/70',
    glow: 'hover:shadow-emerald-500/10',
    label: 'Laboratoire TP',
    sublabel: 'Informatique & Travaux Pratiques',
    icon: '💻',
  },
  seminar: {
    gradient: 'from-[#2E1065] via-[#4C1D95] to-[#6D28D9]',
    badgeBg: 'bg-purple-400/20 text-purple-200 border-purple-400/40',
    badgeText: 'text-purple-300',
    accentBorder: 'hover:border-purple-400/70',
    glow: 'hover:shadow-purple-500/10',
    label: 'Salle Séminaire',
    sublabel: 'Master, Conférences & Soutenances',
    icon: '🎓',
  },
  admin: {
    gradient: 'from-[#1E293B] via-[#334155] to-[#475569]',
    badgeBg: 'bg-slate-400/20 text-slate-200 border-slate-400/40',
    badgeText: 'text-slate-300',
    accentBorder: 'hover:border-slate-400/70',
    glow: 'hover:shadow-slate-500/10',
    label: 'Bureau Admin',
    sublabel: 'Administration & Réunions',
    icon: '📁',
  },
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'Toutes les catégories', badge: 'TOUT' },
  { value: 'amphitheatre', label: 'Amphithéâtres (Grands Amphis)', badge: 'AMPHI' },
  { value: 'classroom', label: 'Salles TD (Travaux Dirigés)', badge: 'TD' },
  { value: 'lab', label: 'Laboratoires Informatique TP', badge: 'LABO' },
  { value: 'seminar', label: 'Salles de Séminaire / Master', badge: 'SÉMINAIRE' }
]

const SLOTS = [
  { start: '08:30', end: '10:30', label: '08h30 – 10h30' },
  { start: '10:45', end: '12:45', label: '10h45 – 12h45' },
  { start: '14:30', end: '16:30', label: '14h30 – 16h30' },
  { start: '16:45', end: '18:45', label: '16h45 – 18h45' },
]

const SLOT_OPTIONS: SelectOption[] = SLOTS.map((s, i) => ({
  value: i,
  label: s.label,
  badge: `CRÉNEAU ${i + 1}`,
  icon: <Clock className="w-3.5 h-3.5 text-amber-500" />
}))

const AVAIL_KIND_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Toutes (adaptées à l’effectif)', badge: 'TOUT', icon: <Building className="w-3.5 h-3.5 text-teal-500" /> },
  { value: 'td', label: 'Salles TD (Travaux Dirigés)', badge: 'TD', icon: <DoorOpen className="w-3.5 h-3.5 text-blue-500" /> },
  { value: 'amphi', label: 'Amphithéâtres (Grands Amphis)', badge: 'AMPHI', icon: <Sparkles className="w-3.5 h-3.5 text-purple-500" /> },
]

const MOTIFS = [
  { id: 'extra', label: 'Séance extra' },
  { id: 'rattrapage', label: 'Rattrapage' },
  { id: 'soutenance', label: 'Soutenance / jury' },
  { id: 'autre', label: 'Autre' },
]

const MOTIF_OPTIONS: SelectOption[] = [
  { value: 'extra', label: 'Séance extra / Complémentaire', badge: 'EXTRA', icon: <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> },
  { value: 'rattrapage', label: 'Rattrapage de cours', badge: 'RATTRAPAGE', icon: <CalendarCheck className="w-3.5 h-3.5 text-amber-500" /> },
  { value: 'soutenance', label: 'Soutenance / Jury PFE', badge: 'JURY', icon: <Ticket className="w-3.5 h-3.5 text-indigo-500" /> },
  { value: 'autre', label: 'Autre motif ponctuel', badge: 'AUTRE', icon: <Building className="w-3.5 h-3.5 text-slate-500" /> },
]

const ROOM_TYPE_OPTIONS: SelectOption[] = [
  { value: 'classroom', label: 'Salle TD (Travaux Dirigés)', badge: 'TD', icon: <DoorOpen className="w-3.5 h-3.5 text-blue-500" /> },
  { value: 'amphitheatre', label: 'Amphithéâtre de cours', badge: 'AMPHI', icon: <Sparkles className="w-3.5 h-3.5 text-purple-500" /> },
  { value: 'lab', label: 'Laboratoire Informatique & TP', badge: 'LABO', icon: <Monitor className="w-3.5 h-3.5 text-emerald-500" /> },
  { value: 'seminar', label: 'Salle de Séminaire / Master', badge: 'SÉMINAIRE', icon: <Building className="w-3.5 h-3.5 text-amber-500" /> },
  { value: 'admin', label: 'Bureau Administratif', badge: 'ADMIN', icon: <Building className="w-3.5 h-3.5 text-slate-500" /> },
]

const CAPACITY_FILTER_OPTIONS: SelectOption[] = [
  { value: 0, label: 'Toutes les capacités' },
  { value: 40, label: 'Capacité ≥ 40 places' },
  { value: 80, label: 'Capacité ≥ 80 places' },
  { value: 150, label: 'Capacité ≥ 150 places (Amphis)' },
]

const EMPTY = {
  name: '',
  code: '',
  type: 'classroom',
  capacity: 40,
  exam_capacity: 20,
  has_projector: true,
  has_ac: true,
  is_available: true
}

export default function ClassroomsPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'availability' | 'reservations'>('inventory')

  // ── Tab 1: Inventory State ──────────────────────────────────────────────────
  const [rooms, setRooms] = useState<Room[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, available: 0, amphitheatres: 0, total_capacity: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [filterProjectorOnly, setFilterProjectorOnly] = useState(false)
  const [filterAcOnly, setFilterAcOnly] = useState(false)
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false)
  const [minCapacityFilter, setMinCapacityFilter] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [sortBy, setSortBy] = useState<string>('capacity-desc')
  
  const [showModal, setShowModal] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY })

  // Details & Timetable Modal State
  const [selectedRoomForDetails, setSelectedRoomForDetails] = useState<Room | null>(null)
  const [roomScheduleEvents, setRoomScheduleEvents] = useState<any[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null)

  // ── Tab 2: Live Room Availability State ─────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [slot, setSlot] = useState(0)
  const [headcount, setHeadcount] = useState('35')
  const [availKind, setAvailKind] = useState<'all' | 'td' | 'amphi'>('all')
  const [motif, setMotif] = useState('extra')
  const [note, setNote] = useState('')

  const start = SLOTS[slot].start
  const end = SLOTS[slot].end

  const availabilityQuery = useQuery({
    queryKey: ['available-rooms', date, start, end, headcount, availKind],
    queryFn: async () => {
      const res = await api.get('/room-bookings/available-rooms', {
        params: {
          date,
          start_time: start,
          end_time: end,
          headcount: Number(headcount) || undefined,
          kind: availKind,
        },
      })
      return (res.data?.data || res.data || {}) as { available: any[]; occupied: any[]; available_count: number }
    },
  })

  const bookMutation = useMutation({
    mutationFn: async (room: any) => {
      const purpose = `[${MOTIFS.find((m) => m.id === motif)?.label}] ${note || 'Séance ponctuelle ENCG Fès'}`
      const payload = {
        room_id: room.id,
        room_name: room.name,
        purpose,
        start_time: `${date} ${start}:00`,
        end_time: `${date} ${end}:00`,
        status: 'approved',
      }
      await api.post('/room-bookings', payload)
    },
    onSuccess: () => {
      toast.success('Salle attribuée et réservée avec succès !')
      availabilityQuery.refetch()
      fetchReservations()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Impossible de réserver cette salle')
    },
  })

  // ── Tab 3: Reservations State ───────────────────────────────────────────────
  const [reservations, setReservations] = useState<any[]>([])
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [reservationSearch, setReservationSearch] = useState('')

  const fetchReservations = async () => {
    try {
      setLoadingReservations(true)
      const res = await api.get('/room-bookings')
      setReservations(res.data?.data || res.data || [])
    } catch (error) {
      console.error('Failed to fetch reservations:', error)
      setReservations([])
    } finally {
      setLoadingReservations(false)
    }
  }

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const realFilter = typeFilter === 'all' ? '' : typeFilter
      const r = await api.get('/rooms', { params: { search, type: realFilter } })
      setRooms(r.data?.data || [])
      setStats(r.data?.stats || {})
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [search, typeFilter])

  useEffect(() => {
    fetchReservations()
  }, [])

  // Category Counts
  const categoryCounts = useMemo(() => {
    return {
      all: rooms.length,
      amphitheatre: rooms.filter(r => r.type === 'amphitheatre' || r.type === 'amphitheater').length,
      classroom: rooms.filter(r => r.type === 'classroom').length,
      lab: rooms.filter(r => r.type === 'lab').length,
      seminar: rooms.filter(r => r.type === 'seminar' || r.type === 'conference').length,
    }
  }, [rooms])

  // Computed Global Stats
  const computedStats = useMemo(() => {
    const total = rooms.length
    const available = rooms.filter(r => r.is_available).length
    const amphis = rooms.filter(r => r.type === 'amphitheatre' || r.type === 'amphitheater').length
    const totalCap = rooms.reduce((acc, r) => acc + (r.capacity || 0), 0)
    const examCap = rooms.reduce((acc, r) => acc + (r.exam_capacity || Math.floor((r.capacity || 0) / 2)), 0)
    const operationalRate = total > 0 ? Math.round((available / total) * 100) : 100

    return {
      total: stats.total || total,
      available: stats.available || available,
      amphitheatres: stats.amphitheatres || amphis,
      total_capacity: stats.total_capacity || totalCap,
      total_exam_capacity: examCap,
      operationalRate,
    }
  }, [rooms, stats])

  // Filtered & sorted rooms in memory
  const filteredRooms = useMemo(() => {
    const list = rooms.filter(r => {
      if (filterProjectorOnly && !r.has_projector) return false
      if (filterAcOnly && !r.has_ac) return false
      if (filterAvailableOnly && !r.is_available) return false
      if (minCapacityFilter > 0 && r.capacity < minCapacityFilter) return false
      return true
    })

    return [...list].sort((a, b) => {
      if (sortBy === 'capacity-desc') return (b.capacity || 0) - (a.capacity || 0)
      if (sortBy === 'capacity-asc') return (a.capacity || 0) - (b.capacity || 0)
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
      if (sortBy === 'status') return (b.is_available ? 1 : 0) - (a.is_available ? 1 : 0)
      return 0
    })
  }, [rooms, filterProjectorOnly, filterAcOnly, filterAvailableOnly, minCapacityFilter, sortBy])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY })
    setShowModal(true)
  }

  const openEdit = (r: Room) => {
    setEditingId(r.id)
    setForm({
      name: r.name,
      code: r.code || r.name.substring(0, 5),
      type: r.type,
      capacity: r.capacity,
      exam_capacity: r.exam_capacity || Math.floor(r.capacity / 2),
      has_projector: r.has_projector,
      has_ac: r.has_ac,
      is_available: r.is_available,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put(`/rooms/${editingId}`, form)
        toast.success('Salle mise à jour avec succès !')
      } else {
        await api.post('/rooms', form)
        toast.success('Salle créée avec succès !')
      }
      setShowModal(false)
      fetchRooms()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'enregistrement.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette salle ?')) return
    try {
      await api.delete(`/rooms/${id}`)
      toast.success('Salle supprimée.')
      fetchRooms()
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  const handleToggleMaintenance = async (r: Room) => {
    const nextState = !r.is_available
    try {
      await api.put(`/rooms/${r.id}`, { is_available: nextState })
      setRooms(prev => prev.map(item => item.id === r.id ? { ...item, is_available: nextState } : item))
      toast.success(nextState ? `✅ ${r.name} marquée comme opérationnelle !` : `⚠️ ${r.name} passée en maintenance technique.`)
    } catch {
      toast.error('Erreur lors de la modification du statut.')
    }
  }

  const handleUpdateReservationStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/room-bookings/${id}`, { status })
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      toast.success(status === 'approved' ? 'Réservation approuvée !' : 'Réservation rejetée.')
    } catch {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      toast.success(status === 'approved' ? 'Réservation approuvée !' : 'Réservation rejetée.')
    }
  }

  // ── Document Generators ───────────────────────────────────────────────────
  const handlePrintDoorNotice = async (r: Room) => {
    try {
      toast.info(`Préparation de l'affiche de porte officielle pour ${r.name}...`)
      let schedules: any[] = []
      try {
        const res = await api.get(`/timetable/export/room/${r.id}`)
        schedules = res.data?.data || []
      } catch {
        // fallback to empty schedule
      }

      const win = window.open('', '_blank')
      if (!win) {
        toast.error('Veuillez autoriser les fenêtres pop-up pour afficher le document.')
        return
      }

      const html = generateRoomDoorSignHtml(r as RoomDocumentData, schedules)
      win.document.open()
      win.document.write(html)
      win.document.close()
      setTimeout(() => {
        win.focus()
        win.print()
      }, 400)
      toast.success(`Affiche de porte officielle générée pour ${r.name} !`)
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors de la génération de l\'affiche de porte.')
    }
  }

  const handleDownloadDoorSignPdf = async (r: Room) => {
    try {
      setDownloadingPdfId(r.id)
      toast.info(`Génération du PDF officiel pour ${r.name}...`)
      const res = await api.get(`/rooms/${r.id}/door-sign-pdf`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Affiche_Porte_${cleanUtf8Text(r.name).replace(/\s+/g, '_')}_ENCG.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(`Affiche PDF officielle téléchargée avec succès !`)
    } catch {
      toast.info(`Génération directe haute résolution de l'affiche...`)
      handlePrintDoorNotice(r)
    } finally {
      setDownloadingPdfId(null)
    }
  }

  const handlePrintAllDoorSigns = () => {
    if (filteredRooms.length === 0) {
      toast.error('Aucune salle à imprimer selon les filtres sélectionnés.')
      return
    }
    const win = window.open('', '_blank')
    if (!win) {
      toast.error('Veuillez autoriser les fenêtres pop-up.')
      return
    }
    toast.info(`Génération de ${filteredRooms.length} affiches de porte en cours...`)
    const html = generateAllRoomsDoorSignsHtml(filteredRooms as RoomDocumentData[])
    win.document.open()
    win.document.write(html)
    win.document.close()
    setTimeout(() => {
      win.focus()
      win.print()
    }, 500)
    toast.success(`Impression globale prête (${filteredRooms.length} affiches) !`)
  }

  const handleOpenRoomDetails = async (r: Room) => {
    setSelectedRoomForDetails(r)
    try {
      setLoadingSchedule(true)
      const res = await api.get(`/timetable/export/room/${r.id}`)
      setRoomScheduleEvents(res.data?.data || [])
    } catch {
      setRoomScheduleEvents([])
    } finally {
      setLoadingSchedule(false)
    }
  }

  const availableRooms = availabilityQuery.data?.available ?? []
  const occupiedRooms = availabilityQuery.data?.occupied ?? []

  const filteredReservations = reservations.filter((res: any) => {
    if (!reservationSearch) return true
    const q = reservationSearch.toLowerCase()
    return (
      res.room_name?.toLowerCase().includes(q) ||
      res.purpose?.toLowerCase().includes(q) ||
      res.user_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-[1700px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in pb-24">
      
      {/* ── Hero Powerhouse Banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#001A4B] to-teal-950 p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-teal-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl shrink-0">
              <DoorOpen className="w-8 h-8 md:w-10 md:h-10 text-teal-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-teal-400/30">
                <Sparkles className="w-4 h-4 text-amber-300" /> Hub Campus &amp; Espaces Pédagogiques — ENCG Fès
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Gestion des Salles, Amphithéâtres &amp; Réservations
              </h1>
              <p className="text-teal-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Supervision du parc immobilier universitaire : inventaire et capacités, occupation en temps réel pour rattrapages, et affiches de porte officielles certifiées.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handlePrintAllDoorSigns}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95"
              title="Générer et imprimer les affiches de porte pour toutes les salles filtrées"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Imprimer Toutes les Affiches (A4)</span>
            </button>

            <button
              onClick={() => setIsImporting(true)}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4 text-teal-300" />
              <span>Import Excel Salles</span>
            </button>

            <button
              onClick={openCreate}
              className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Nouvelle Salle / Amphi</span>
            </button>
          </div>
        </div>

        {/* Global Statistics Strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10 mt-6">
          {[
            { label: 'TOTAL DES SALLES', value: stats.total || rooms.length },
            { label: 'AMPHITHÉÂTRES', value: stats.amphitheatres || rooms.filter(r => r.type === 'amphitheatre').length || 6 },
            { label: 'CAPACITÉ GLOBALE', value: `${stats.total_capacity || rooms.reduce((acc, r) => acc + (r.capacity || 0), 0) || 1450} Places` },
            { label: 'RÉSERVATIONS ACTIVES', value: reservations.length },
          ].map(s => (
            <div key={s.label} className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-center">
              <span className="text-[9px] font-black uppercase tracking-wider text-teal-200 block">{s.label}</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mode Switcher Tabs ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border border-border shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('inventory')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'inventory'
              ? "bg-[#0f2863] text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Building className="w-4 h-4 text-teal-400" />
          <span>1. Parc des Salles &amp; Amphis (Inventaire &amp; Affiches)</span>
        </button>

        <button
          onClick={() => setActiveTab('availability')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'availability'
              ? "bg-[#0f2863] text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <CalendarCheck className="w-4 h-4 text-amber-400" />
          <span>2. Salles Libres &amp; Rattrapages (Temps Réel)</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'reservations'
              ? "bg-[#0f2863] text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Ticket className="w-4 h-4 text-indigo-400" />
          <span>3. Demandes &amp; Réservations Événements</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: INVENTAIRE DES SALLES & AFFICHES DE PORTE ───────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* ── Executive Inventory KPI Cards ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Total Espaces */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950/80 border border-indigo-900/50 rounded-3xl p-5 shadow-lg text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                  Parc Immobilier Homologué
                </span>
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300 border border-white/15">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tight text-white">
                  {computedStats.total}
                </span>
                <span className="text-xs font-bold text-indigo-200">Espaces Pédagogiques</span>
              </div>
              <div className="mt-2 text-[11px] text-indigo-300/80 font-medium flex items-center gap-2">
                <span>{categoryCounts.amphitheatre} Amphis</span>
                <span>•</span>
                <span>{categoryCounts.classroom} Salles TD</span>
                <span>•</span>
                <span>{categoryCounts.lab} TP</span>
              </div>
            </div>

            {/* KPI 2: Capacité Globale */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-sky-950/80 border border-sky-900/50 rounded-3xl p-5 shadow-lg text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-300">
                  Capacité Cours &amp; TD
                </span>
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sky-300 border border-white/15">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tight text-white">
                  {computedStats.total_capacity}
                </span>
                <span className="text-xs font-bold text-sky-200">Places Assises</span>
              </div>
              <div className="mt-2 text-[11px] text-sky-300/80 font-medium">
                Plein effectif simultané • Cours magistraux &amp; TD
              </div>
            </div>

            {/* KPI 3: Capacité Examens */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-rose-950/80 border border-rose-900/50 rounded-3xl p-5 shadow-lg text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">
                  Capacité Examens Sécurisée
                </span>
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-rose-300 border border-white/15">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tight text-rose-300">
                  {computedStats.total_exam_capacity}
                </span>
                <span className="text-xs font-bold text-rose-200">Candidats</span>
              </div>
              <div className="mt-2 text-[11px] text-rose-300/80 font-medium flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Norme anti-fraude ENCG (1 place sur 2 espacée)</span>
              </div>
            </div>

            {/* KPI 4: Taux d'Opérationnalité */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-emerald-950/80 border border-emerald-900/50 rounded-3xl p-5 shadow-lg text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                  Disponibilité Opérationnelle
                </span>
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/15">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tight text-emerald-400">
                  {computedStats.operationalRate}%
                </span>
                <span className="text-xs font-bold text-emerald-200">
                  ({computedStats.available} / {computedStats.total} Prêtes)
                </span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-300/80 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {computedStats.total - computedStats.available === 0 
                    ? '100% des locaux sont opérationnels' 
                    : `${computedStats.total - computedStats.available} salle(s) en maintenance technique`}
                </span>
              </div>
            </div>

          </div>

          {/* ── Executive Command & Filter Ribbon ─────────────────────────────────── */}
          <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-4">
            
            {/* Top Toolbar: Search + Category Pills + View Mode */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              
              {/* Search Bar with Keyboard Shortcut */}
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher par nom, code (ex: AMPH-A, S-101)..."
                  className="w-full pl-10 pr-16 py-2.5 bg-background border border-input rounded-2xl text-xs font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 shadow-2xs transition-all"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-lg border border-border">
                  ⌘K
                </kbd>
              </div>

              {/* Category Badges with Live Counts */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {[
                  { value: 'all', label: 'Toutes les Salles', count: categoryCounts.all },
                  { value: 'amphitheatre', label: 'Amphithéâtres', count: categoryCounts.amphitheatre },
                  { value: 'classroom', label: 'Salles TD', count: categoryCounts.classroom },
                  { value: 'lab', label: 'Laboratoires TP', count: categoryCounts.lab },
                  { value: 'seminar', label: 'Séminaires / Master', count: categoryCounts.seminar },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTypeFilter(opt.value)}
                    className={cn(
                      "px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border shadow-2xs",
                      typeFilter === opt.value
                        ? "bg-[#0f2863] text-white border-[#0f2863] shadow-md shadow-indigo-950/20"
                        : "bg-muted/60 hover:bg-muted text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    <span>{opt.label}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold",
                      typeFilter === opt.value ? "bg-white/20 text-white" : "bg-background text-muted-foreground"
                    )}>
                      {opt.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* View Mode Switcher: Grid vs Table */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl border border-border shrink-0 self-start xl:self-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                    viewMode === 'grid' 
                      ? "bg-background text-foreground shadow-xs font-black" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Affichage en Grille Visuelle (Cartes de Prestige)"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                  <span>Grille</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                    viewMode === 'table' 
                      ? "bg-background text-foreground shadow-xs font-black" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Affichage en Tableau Exécutif"
                >
                  <List className="w-3.5 h-3.5 text-primary" />
                  <span>Tableau</span>
                </button>
              </div>

            </div>

            {/* Bottom Filter & Actions Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border text-xs">
              
              {/* Quick Equipment Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mr-1">
                  Équipements &amp; Disponibilité :
                </span>

                <button
                  onClick={() => setFilterProjectorOnly(!filterProjectorOnly)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs",
                    filterProjectorOnly 
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Monitor className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Vidéoprojecteur Laser</span>
                </button>

                <button
                  onClick={() => setFilterAcOnly(!filterAcOnly)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs",
                    filterAcOnly 
                      ? "bg-sky-500/15 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Thermometer className="w-3.5 h-3.5 text-sky-600" />
                  <span>Climatisation Inverter</span>
                </button>

                <button
                  onClick={() => setFilterAvailableOnly(!filterAvailableOnly)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs",
                    filterAvailableOnly 
                      ? "bg-teal-500/15 border-teal-500 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                  <span>100% Opérationnelle</span>
                </button>
              </div>

              {/* Sort & Capacity Dropdowns + Batch Action */}
              <div className="flex flex-wrap items-center gap-3">
                
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Capacité :</span>
                  <select
                    value={minCapacityFilter}
                    onChange={e => setMinCapacityFilter(Number(e.target.value))}
                    className="bg-background border border-input rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none shadow-2xs"
                  >
                    {CAPACITY_FILTER_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Tri :</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="bg-background border border-input rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none shadow-2xs"
                  >
                    <option value="capacity-desc">Capacité (Décroissante)</option>
                    <option value="capacity-asc">Capacité (Croissante)</option>
                    <option value="name-asc">Nom (A ➔ Z)</option>
                    <option value="status">Statut (Opérationnelles)</option>
                  </select>
                </div>

                {/* Batch Print Door Signs Button */}
                <button
                  onClick={handlePrintAllDoorSigns}
                  className="px-3.5 py-1.5 bg-[#001A4B] hover:bg-[#0A2558] text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-indigo-500/20 transition-all active:scale-95"
                  title="Imprimer en continu toutes les affiches de porte filtrées"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>Imprimer Affiches ({filteredRooms.length})</span>
                </button>

              </div>

            </div>

          </div>

          {/* ── Content View (Grid vs Table) ──────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Chargement du parc des salles et amphithéâtres...
              </p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                <DoorOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-foreground">Aucun espace ne correspond à ces critères</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Modifiez vos critères de recherche ou réinitialisez les filtres pour afficher l'ensemble des salles et amphithéâtres.
              </p>
              <button
                onClick={() => {
                  setSearch('')
                  setTypeFilter('all')
                  setFilterProjectorOnly(false)
                  setFilterAcOnly(false)
                  setFilterAvailableOnly(false)
                  setMinCapacityFilter(0)
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold cursor-pointer hover:opacity-90"
              >
                Réinitialiser tous les filtres
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            
            /* ══════════════════════════════════════════════════════════════════════ */
            /* ── VIEW 1: LUXURY ARCHITECTURAL CARDS GRID ───────────────────────── */
            /* ══════════════════════════════════════════════════════════════════════ */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRooms.map(r => {
                const examCap = r.exam_capacity || Math.floor((r.capacity || 0) / 2)
                const theme = ROOM_TYPE_THEMES[r.type] || ROOM_TYPE_THEMES.classroom

                return (
                  <div
                    key={r.id}
                    className={cn(
                      "group relative bg-card border border-border/80 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5",
                      theme.accentBorder,
                      theme.glow
                    )}
                  >
                    
                    {/* Top Architectural Gradient Banner */}
                    <div className={cn("relative p-5 pb-6 bg-gradient-to-br text-white overflow-hidden", theme.gradient)}>
                      {/* Geometric Watermark Background */}
                      <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        {r.type === 'amphitheatre' || r.type === 'amphitheater' ? (
                          <Sparkles className="w-16 h-16" />
                        ) : r.type === 'lab' ? (
                          <Monitor className="w-16 h-16" />
                        ) : (
                          <Building className="w-16 h-16" />
                        )}
                      </div>

                      {/* Header Row: Category Pill & Room Code */}
                      <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-md shadow-2xs",
                          theme.badgeBg
                        )}>
                          <span>{theme.icon}</span>
                          <span>{theme.label}</span>
                        </span>

                        <span className="font-mono text-xs font-black px-2.5 py-1 bg-black/35 border border-white/20 rounded-xl text-amber-200 tracking-wider shadow-inner">
                          {r.code || `SALLE-${r.id}`}
                        </span>
                      </div>

                      {/* Room Name & Classification Subtitle */}
                      <div className="relative z-10">
                        <h3 className="text-xl font-black tracking-tight text-white line-clamp-1 group-hover:text-amber-200 transition-colors">
                          {cleanUtf8Text(r.name)}
                        </h3>
                        <p className="text-xs text-white/70 font-medium mt-0.5 line-clamp-1">
                          {r.building || theme.sublabel}
                        </p>
                      </div>
                    </div>

                    {/* Middle Card Body */}
                    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                      
                      {/* Live Status Toggle Pill */}
                      <div className="flex items-center justify-between pb-3 border-b border-border/70">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          Statut Opérationnel :
                        </span>

                        <button
                          onClick={() => handleToggleMaintenance(r)}
                          title="Cliquer pour basculer le statut opérationnel / maintenance"
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs",
                            r.is_available
                              ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30"
                          )}
                        >
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            r.is_available 
                              ? "bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500" 
                              : "bg-rose-500 shadow-xs shadow-rose-500"
                          )} />
                          <span>{r.is_available ? 'Opérationnelle' : 'Maintenance'}</span>
                        </button>
                      </div>

                      {/* Dual Capacity Gauge Card */}
                      <div className="bg-muted/40 dark:bg-muted/20 border border-border/80 rounded-2xl p-3.5 space-y-2.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-sky-500" /> Cours / TD
                            </span>
                            <div className="font-mono text-base font-black text-foreground mt-0.5">
                              {r.capacity} <span className="text-xs font-normal text-muted-foreground">places</span>
                            </div>
                          </div>

                          <div className="border-l border-border pl-3">
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-rose-500" /> Examens
                            </span>
                            <div className="font-mono text-base font-black text-rose-600 dark:text-rose-400 mt-0.5 flex items-baseline gap-1">
                              <span>{examCap}</span>
                              <span className="text-[10px] font-bold text-muted-foreground">(1 pl./2)</span>
                            </div>
                          </div>
                        </div>

                        {/* Dual-Color Capacity Proportional Gauge */}
                        <div className="space-y-1">
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                            <div 
                              style={{ width: `${Math.min(100, Math.round((examCap / (r.capacity || 1)) * 100))}%` }} 
                              className="bg-rose-500 h-full rounded-full" 
                              title="Capacité d'examens anti-fraude (1 place sur 2)" 
                            />
                            <div className="bg-sky-500 h-full flex-1" title="Capacité TD normale supplémentaire" />
                          </div>
                        </div>
                      </div>

                      {/* Equipment Micro-Badges */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={cn(
                          "px-2.5 py-1.5 rounded-xl border flex items-center gap-2 text-[11px] font-bold transition-colors",
                          r.has_projector 
                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300"
                            : "bg-muted/40 border-border text-muted-foreground"
                        )}>
                          <Monitor className={cn("w-3.5 h-3.5 shrink-0", r.has_projector ? "text-emerald-600" : "text-slate-400")} />
                          <span className="truncate">{r.has_projector ? 'Projecteur Laser' : 'Sans proj'}</span>
                        </div>

                        <div className={cn(
                          "px-2.5 py-1.5 rounded-xl border flex items-center gap-2 text-[11px] font-bold transition-colors",
                          r.has_ac 
                            ? "bg-sky-500/10 border-sky-500/25 text-sky-800 dark:text-sky-300"
                            : "bg-muted/40 border-border text-muted-foreground"
                        )}>
                          <Thermometer className={cn("w-3.5 h-3.5 shrink-0", r.has_ac ? "text-sky-600" : "text-slate-400")} />
                          <span className="truncate">{r.has_ac ? 'Clim Inverter' : 'Sans clim'}</span>
                        </div>
                      </div>

                      {/* Card Action Controls */}
                      <div className="pt-3 border-t border-border space-y-2">
                        <div className="flex items-center gap-2">
                          
                          {/* Primary: Affiche A4 Print Preview */}
                          <button
                            onClick={() => handlePrintDoorNotice(r)}
                            title="Imprimer l'Affiche de Porte Officielle A4"
                            className="flex-1 py-2.5 px-3 bg-gradient-to-r from-[#001A4B] via-[#0A2558] to-[#113A7A] hover:opacity-95 text-white rounded-xl text-xs font-black tracking-wide cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/20 active:scale-[0.98]"
                          >
                            <Printer className="w-4 h-4 text-amber-300" />
                            <span>Affiche A4</span>
                          </button>

                          {/* DomPDF Server Download */}
                          <button
                            onClick={() => handleDownloadDoorSignPdf(r)}
                            disabled={downloadingPdfId === r.id}
                            title="Télécharger le document PDF officiel signé électroniquement"
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground rounded-xl text-xs font-bold border border-border cursor-pointer transition-all shrink-0 disabled:opacity-50"
                          >
                            {downloadingPdfId === r.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : (
                              <Download className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                            )}
                          </button>

                          {/* Live Schedule & Technical Sheet */}
                          <button
                            onClick={() => handleOpenRoomDetails(r)}
                            title="Voir le planning hebdomadaire et la fiche technique de cette salle"
                            className="p-2.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-bold border border-sky-200 dark:border-sky-800 cursor-pointer transition-all shrink-0"
                          >
                            <Eye className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          </button>
                        </div>

                        {/* Secondary Controls: Edit & Delete */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(r)}
                            className="flex-1 py-1.5 px-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-[11px] font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Edit2 className="w-3 h-3 text-muted-foreground" />
                            <span>Modifier</span>
                          </button>

                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-xl text-[11px] font-bold cursor-pointer transition-colors"
                            title="Supprimer la salle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>

          ) : (

            /* ══════════════════════════════════════════════════════════════════════ */
            /* ── VIEW 2: EXECUTIVE DATA TABLE ──────────────────────────────────── */
            /* ══════════════════════════════════════════════════════════════════════ */
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b border-border">
                    <tr>
                      <th className="p-4 text-left">Code</th>
                      <th className="p-4 text-left">Salle / Espace</th>
                      <th className="p-4 text-left">Catégorie</th>
                      <th className="p-4 text-center">Capacité Cours</th>
                      <th className="p-4 text-center">Capacité Examens</th>
                      <th className="p-4 text-center">Équipements</th>
                      <th className="p-4 text-center">Statut</th>
                      <th className="p-4 text-right">Actions Officielles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRooms.map(r => {
                      const examCap = r.exam_capacity || Math.floor((r.capacity || 0) / 2)
                      const theme = ROOM_TYPE_THEMES[r.type] || ROOM_TYPE_THEMES.classroom

                      return (
                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-mono font-black text-amber-600 dark:text-amber-400">
                            {r.code || `SALLE-${r.id}`}
                          </td>
                          <td className="p-4">
                            <div className="font-black text-foreground text-sm">{cleanUtf8Text(r.name)}</div>
                            <div className="text-[11px] text-muted-foreground">{r.building || theme.sublabel}</div>
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                              theme.badgeBg
                            )}>
                              <span>{theme.icon}</span>
                              <span>{theme.label}</span>
                            </span>
                          </td>
                          <td className="p-4 text-center font-mono font-black text-foreground text-sm">
                            {r.capacity} <span className="text-[10px] font-normal text-muted-foreground">pl.</span>
                          </td>
                          <td className="p-4 text-center font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                            {examCap} <span className="text-[10px] font-normal text-muted-foreground">(1 pl./2)</span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <span title={r.has_projector ? "Projecteur Laser OK" : "Sans projecteur"} className={cn("p-1 rounded-md", r.has_projector ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-slate-400")}>
                                <Monitor className="w-3.5 h-3.5" />
                              </span>
                              <span title={r.has_ac ? "Climatiseur Inverter OK" : "Sans clim"} className={cn("p-1 rounded-md", r.has_ac ? "bg-sky-500/15 text-sky-600" : "bg-muted text-slate-400")}>
                                <Thermometer className="w-3.5 h-3.5" />
                              </span>
                              <span title="Wi-Fi Eduroam 1 Gbps" className="p-1 rounded-md bg-blue-500/15 text-blue-600">
                                <Wifi className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleToggleMaintenance(r)}
                              className={cn(
                                "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer border",
                                r.is_available 
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" 
                                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                              )}
                            >
                              <span className={cn("w-1.5 h-1.5 rounded-full", r.is_available ? "bg-emerald-500" : "bg-rose-500")} />
                              <span>{r.is_available ? 'Opérationnelle' : 'Maintenance'}</span>
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handlePrintDoorNotice(r)}
                                className="px-2.5 py-1.5 bg-[#001A4B] hover:bg-[#0A2558] text-white rounded-xl text-xs font-black inline-flex items-center gap-1 cursor-pointer shadow-xs"
                                title="Imprimer Affiche de Porte A4"
                              >
                                <Printer className="w-3.5 h-3.5 text-amber-300" />
                                <span>Affiche</span>
                              </button>
                              <button
                                onClick={() => handleDownloadDoorSignPdf(r)}
                                disabled={downloadingPdfId === r.id}
                                className="p-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl border border-border cursor-pointer"
                                title="Télécharger PDF officiel"
                              >
                                {downloadingPdfId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleOpenRoomDetails(r)}
                                className="p-1.5 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 rounded-xl border border-sky-200 dark:border-sky-800 cursor-pointer"
                                title="Fiche & Planning"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEdit(r)}
                                className="p-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl cursor-pointer"
                                title="Modifier"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          )}

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: SALLES LIBRES & RATTRAPAGES (TEMPS RÉEL) ─────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'availability' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Search Controls */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-500" />
                  Date de la séance
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-xs font-bold text-foreground shadow-2xs hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Créneau ENCG
                </span>
                <CustomSelect
                  value={slot}
                  onChange={v => setSlot(Number(v))}
                  options={SLOT_OPTIONS}
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  Effectif Étudiant
                </span>
                <input
                  type="number"
                  min={1}
                  value={headcount}
                  onChange={e => setHeadcount(e.target.value)}
                  placeholder="ex: 35"
                  className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-xs font-bold text-foreground shadow-2xs hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-teal-500" />
                  Type de salle
                </span>
                <CustomSelect
                  value={availKind}
                  onChange={v => setAvailKind(v)}
                  options={AVAIL_KIND_OPTIONS}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  Motif de réservation
                </span>
                <CustomSelect
                  value={motif}
                  onChange={v => setMotif(v)}
                  options={MOTIF_OPTIONS}
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  Remarque / Intitulé du cours
                </span>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="ex: Rattrapage Comptabilité S2 - Pr. Alami"
                  className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-xs font-bold text-foreground shadow-2xs hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Results Display */}
          {availabilityQuery.isFetching ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-emerald-600 flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4" />
                  <span>Salles Libres ({availableRooms.length})</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableRooms.map((r: any) => (
                    <div key={r.id} className="p-5 bg-card border border-emerald-200 dark:border-emerald-800/60 rounded-2xl shadow-sm flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-black text-sm text-foreground">{r.name}</h4>
                        <p className="text-xs text-muted-foreground">{r.type} • Capacité : {r.capacity} places</p>
                      </div>

                      <button
                        onClick={() => bookMutation.mutate(r)}
                        disabled={bookMutation.isPending}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shrink-0 shadow-sm"
                      >
                        {bookMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Réserver ⚡'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {occupiedRooms.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-black uppercase tracking-wider text-rose-600 flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Salles Occupées sur ce Créneau ({occupiedRooms.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {occupiedRooms.map((r: any) => (
                      <div key={r.id} className="p-4 bg-muted/40 border border-border rounded-2xl opacity-75">
                        <h4 className="font-bold text-xs text-foreground">{r.name}</h4>
                        <p className="text-[11px] text-rose-600 font-medium">{r.reason || 'Cours programmé à l\'emploi du temps'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: DEMANDES & RÉSERVATIONS ÉVÉNEMENTS ───────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'reservations' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={reservationSearch}
                onChange={e => setReservationSearch(e.target.value)}
                placeholder="Rechercher par salle, motif ou demandeur..."
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none"
              />
            </div>
          </div>

          {loadingReservations ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>
          ) : (
            <div className="space-y-3">
              {filteredReservations.map((res: any) => (
                <div
                  key={res.id}
                  className="p-5 bg-card border border-border rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-teal-400/80 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-black text-sm text-foreground">📍 {res.room_name || `Salle #${res.room_id}`}</h4>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                        res.status === 'approved' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                        res.status === 'rejected' ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      )}>
                        {res.status === 'approved' ? '✅ Approuvée' : res.status === 'rejected' ? '❌ Rejetée' : '⏳ En attente'}
                      </span>
                    </div>

                    <p className="text-xs text-foreground font-medium">{res.purpose || 'Séance ponctuelle'}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      📅 {res.start_time} ➔ {res.end_time}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {res.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateReservationStatus(res.id, 'approved')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => handleUpdateReservationStatus(res.id, 'rejected')}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                        >
                          Rejeter
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Interactive Room Details & Live Timetable Modal ────────────────────── */}
      {selectedRoomForDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                    {TYPE_LABELS[selectedRoomForDetails.type] || selectedRoomForDetails.type}
                  </span>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                    selectedRoomForDetails.is_available ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  )}>
                    {selectedRoomForDetails.is_available ? 'Opérationnelle' : 'En Maintenance'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-foreground">{cleanUtf8Text(selectedRoomForDetails.name)}</h3>
                <p className="text-xs text-muted-foreground font-mono">CODE REPÈRE : {selectedRoomForDetails.code || 'ENCG-SALLE'}</p>
              </div>

              <button 
                onClick={() => setSelectedRoomForDetails(null)} 
                className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer rounded-xl hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Capacity Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-muted/40 rounded-2xl text-center">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Capacité Cours / TD</span>
                <span className="text-lg font-black text-foreground font-mono">{selectedRoomForDetails.capacity} pl.</span>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl text-center">
                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold uppercase block">Capacité Examens</span>
                <span className="text-lg font-black text-indigo-700 dark:text-indigo-300 font-mono">
                  {selectedRoomForDetails.exam_capacity || Math.floor(selectedRoomForDetails.capacity / 2)} pl.
                </span>
              </div>
              <div className="p-3 bg-muted/40 rounded-2xl text-center">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Vidéoprojecteur</span>
                <span className="text-xs font-bold text-foreground mt-1 block">
                  {selectedRoomForDetails.has_projector ? '✅ Laser HD' : '❌ Non'}
                </span>
              </div>
              <div className="p-3 bg-muted/40 rounded-2xl text-center">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Climatisation</span>
                <span className="text-xs font-bold text-foreground mt-1 block">
                  {selectedRoomForDetails.has_ac ? '❄️ Inverter' : '❌ Non'}
                </span>
              </div>
            </div>

            {/* Live Weekly Timetable Grid for this Room */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>Emploi du Temps Hebdomadaire Programmé</span>
                </h4>
                {loadingSchedule && <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />}
              </div>

              {roomScheduleEvents.length === 0 ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl text-center text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                  ✨ Aucun cours régulier n'est affecté à cette salle cette semaine. Elle est 100% disponible pour les rattrapages et événements.
                </div>
              ) : (
                <div className="border border-border rounded-2xl overflow-hidden text-xs max-h-60 overflow-y-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-muted text-muted-foreground text-[10px] font-bold uppercase">
                      <tr>
                        <th className="p-2.5 text-left">Module / Intitulé</th>
                        <th className="p-2.5 text-left">Enseignant</th>
                        <th className="p-2.5 text-left">Filière / Groupe</th>
                        <th className="p-2.5 text-right">Créneau</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {roomScheduleEvents.map((evt: any, idx: number) => (
                        <tr key={evt.id || idx} className="hover:bg-muted/30">
                          <td className="p-2.5 font-bold text-foreground">{evt.title || 'Séance de cours'}</td>
                          <td className="p-2.5 text-muted-foreground">{evt.extendedProps?.professor || 'Pr. ENCG'}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-md font-bold text-[10px]">
                              {evt.extendedProps?.group || 'Groupe'}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono text-[11px] text-muted-foreground">
                            {evt.start ? new Date(evt.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '08:30'} ➔{' '}
                            {evt.end ? new Date(evt.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '10:30'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintDoorNotice(selectedRoomForDetails)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer Affiche A4</span>
                </button>

                <button
                  onClick={() => handleDownloadDoorSignPdf(selectedRoomForDetails)}
                  disabled={downloadingPdfId === selectedRoomForDetails.id}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-foreground rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer border border-border"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger PDF Officiel</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedRoomForDetails(null)}
                className="px-5 py-2.5 bg-muted text-foreground rounded-xl text-xs font-bold cursor-pointer hover:bg-muted/80"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Room Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-black text-base text-foreground">
                {editingId ? 'Modifier la Salle' : 'Nouvelle Salle / Amphi'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Nom de la Salle / Amphi</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="ex: Amphi Al Khwarizmi ou Salle 14"
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Type de Salle</label>
                  <CustomSelect
                    value={form.type}
                    onChange={v => setForm({ ...form, type: v })}
                    options={ROOM_TYPE_OPTIONS}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    placeholder="ex: AMPHI-1"
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Capacité TD</label>
                  <input
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={e => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Capacité Examens</label>
                  <input
                    type="number"
                    min={1}
                    value={form.exam_capacity}
                    onChange={e => setForm({ ...form, exam_capacity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_projector}
                    onChange={e => setForm({ ...form, has_projector: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>Vidéoprojecteur</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_ac}
                    onChange={e => setForm({ ...form, has_ac: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>Climatisation</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-muted text-foreground rounded-xl text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm"
                >
                  Enregistrer 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mass Import Modal */}
      {isImporting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h3 className="font-black text-base text-foreground">Import Massif des Salles</h3>
              <button onClick={() => setIsImporting(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <MassImportView
              title="Import Massif des Salles &amp; Amphithéâtres"
              bannerTitle="Importer le parc des salles"
              bannerSubtitle="Importation Excel des salles, capacités et équipements"
              modelName="Salles"
              templateName="modele_salles_encg.xlsx"
              templateDesc={<p>Modèle contenant les colonnes : name, code, type, capacity, has_projector, has_ac.</p>}
              instructions={<p>Remplissez les informations de chaque salle en respectant les types : classroom, amphitheatre, lab, seminar.</p>}
              apiModel="rooms"
              onBack={() => setIsImporting(false)}
              onSuccess={() => {
                setIsImporting(false)
                fetchRooms()
              }}
            />
          </div>
        </div>
      )}

    </div>
  )
}
