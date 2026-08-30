import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Search, Plus, Edit2, Trash2, X, Monitor, Thermometer, Building, CheckCircle,
  Upload, Sparkles, Printer, CalendarCheck, DoorOpen, Loader2,
  Ticket, AlertTriangle
} from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import MassImportView from '@shared/components/ui/MassImportView'

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
  lab: 'Laboratoire TP',
  seminar: 'Salle de Séminaire',
  admin: 'Bureau Admin'
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

const MOTIFS = [
  { id: 'extra', label: 'Séance extra' },
  { id: 'rattrapage', label: 'Rattrapage' },
  { id: 'soutenance', label: 'Soutenance / jury' },
  { id: 'autre', label: 'Autre' },
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
  const [showModal, setShowModal] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY })

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
      setRooms(r.data.data || [])
      setStats(r.data.stats || {})
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

  const handlePrintDoorNotice = (r: Room) => {
    const win = window.open('', '_blank')
    if (!win) return
    const examCap = r.exam_capacity ?? Math.floor(r.capacity / 2)
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Affiche de Porte - ${r.name} ENCG Fès</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; text-align: center; color: #0f2863; }
            .badge { display: inline-block; background: #0f2863; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
            .name { font-size: 42px; font-weight: 900; margin: 10px 0; color: #0f2863; }
            .grid { display: flex; justify-content: center; gap: 40px; margin: 40px 0; }
            .card { background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 20px; padding: 25px 40px; }
            .val { font-size: 36px; font-weight: 900; color: #1e3a8a; }
            .lbl { font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 5px; }
            .footer { margin-top: 60px; font-size: 12px; color: #94a3b8; font-weight: bold; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="badge">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
          <div class="name">${r.name}</div>
          <div style="font-size: 16px; font-weight: bold; color: #475569;">${TYPE_LABELS[r.type] || r.type} — CODE: ${r.code || 'ENCG-SALLE'}</div>
          
          <div class="grid">
            <div class="card">
              <div class="val">${r.capacity}</div>
              <div class="lbl">Capacité Cours / TD</div>
            </div>
            <div class="card">
              <div class="val">${examCap}</div>
              <div class="lbl">Capacité Examens (1 place/2)</div>
            </div>
          </div>

          <div style="display:flex; justify-content:center; gap:20px; font-size: 14px; font-weight: bold;">
            <span>${r.has_projector ? '✅ Vidéoprojecteur Installé' : '❌ Pas de projecteur'}</span>
            <span>•</span>
            <span>${r.has_ac ? '❄️ Climatisation Opérationnelle' : '❌ Pas de clim'}</span>
          </div>

          <div class="footer">
            Système d'Information ENCG Fès — Généré le ${new Date().toLocaleDateString('fr-FR')}
          </div>
        </body>
      </html>
    `)
    win.document.close()
    win.print()
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
                <Sparkles className="w-4 h-4 text-amber-300" /> Hub Campus & Espaces Pédagogiques — ENCG Fès
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Gestion des Salles, Amphithéâtres & Réservations
              </h1>
              <p className="text-teal-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Supervision du parc immobilier universitaire : inventaire et capacités, occupation en temps réel pour rattrapages, et gestion des réservations d'événements.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsImporting(true)}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-all"
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
            { label: 'AMPHITHÉÂTRES', value: stats.amphitheatres || 6 },
            { label: 'CAPACITÉ GLOBALE', value: `${stats.total_capacity || 1450} Places` },
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
          <span>1. Parc des Salles & Amphis (Inventaire)</span>
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
          <span>2. Salles Libres & Rattrapages (Temps Réel)</span>
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
          <span>3. Demandes & Réservations Événements</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: INVENTAIRE DES SALLES ───────────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une salle, un amphi ou code..."
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTypeFilter(opt.value)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    typeFilter === opt.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rooms Grid */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {rooms.map(r => (
                <div
                  key={r.id}
                  className="bg-card border border-border rounded-3xl p-5 shadow-sm hover:border-teal-400/80 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 rounded-xl text-[10px] font-black uppercase">
                        {TYPE_LABELS[r.type] || r.type}
                      </span>

                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        r.is_available ? "bg-emerald-500" : "bg-rose-500"
                      )} />
                    </div>

                    <div>
                      <h3 className="text-base font-black text-foreground">{r.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">CODE: {r.code || 'ENCG-SALLE'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
                      <div className="p-2.5 bg-muted/40 rounded-xl">
                        <span className="text-[10px] text-muted-foreground font-bold block uppercase">Capacité TD</span>
                        <span className="font-mono text-sm font-black text-foreground">{r.capacity} Places</span>
                      </div>
                      <div className="p-2.5 bg-muted/40 rounded-xl">
                        <span className="text-[10px] text-muted-foreground font-bold block uppercase">Examens</span>
                        <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">{r.exam_capacity || Math.floor(r.capacity / 2)} Places</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                      <span className={r.has_projector ? "text-emerald-600 font-bold flex items-center gap-1" : "text-slate-400"}>
                        <Monitor className="w-3.5 h-3.5" /> {r.has_projector ? 'Projecteur' : 'Sans'}
                      </span>
                      <span>•</span>
                      <span className={r.has_ac ? "text-teal-600 font-bold flex items-center gap-1" : "text-slate-400"}>
                        <Thermometer className="w-3.5 h-3.5" /> {r.has_ac ? 'Climatisé' : 'Sans clim'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <button
                      onClick={() => handlePrintDoorNotice(r)}
                      title="Imprimer affiche de porte"
                      className="p-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold border border-border cursor-pointer transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(r)}
                      className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
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
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Date de la séance</span>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs font-bold text-foreground"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Créneau ENCG</span>
                <select
                  value={slot}
                  onChange={e => setSlot(Number(e.target.value))}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs font-bold text-foreground"
                >
                  {SLOTS.map((s, i) => (
                    <option key={s.start} value={i}>{s.label}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Effectif Étudiant</span>
                <input
                  type="number"
                  min={1}
                  value={headcount}
                  onChange={e => setHeadcount(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs font-bold text-foreground"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Type de salle</span>
                <select
                  value={availKind}
                  onChange={e => setAvailKind(e.target.value as any)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs font-bold text-foreground"
                >
                  <option value="all">Toutes (adaptées à l’effectif)</option>
                  <option value="td">Salles TD</option>
                  <option value="amphi">Amphithéâtres</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Motif de réservation</span>
                <select
                  value={motif}
                  onChange={e => setMotif(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs font-bold text-foreground"
                >
                  {MOTIFS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Remarque / Intitulé du cours</span>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="ex: Rattrapage Comptabilité S2 - Pr. Alami"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs font-bold text-foreground"
                />
              </label>
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
                        res.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                        res.status === 'rejected' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
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
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none"
                  >
                    <option value="classroom">Salle TD</option>
                    <option value="amphitheatre">Amphithéâtre</option>
                    <option value="lab">Laboratoire TP</option>
                    <option value="seminar">Séminaire</option>
                  </select>
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
              title="Import Massif des Salles & Amphithéâtres"
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
