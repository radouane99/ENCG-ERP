import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Building2, CalendarCheck, DoorOpen, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'

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

type RoomRow = {
  id: string
  name: string
  code: string
  type: string
  capacity: number
  is_amphitheater: boolean
  reason: string | null
}

type Availability = {
  available: RoomRow[]
  occupied: RoomRow[]
  available_count: number
}

export default function AdminRoomAvailabilityPage() {
  const isProfessor = useLocation().pathname.startsWith('/professor')
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [slot, setSlot] = useState(0)
  const [headcount, setHeadcount] = useState('35')
  const [kind, setKind] = useState<'all' | 'td' | 'amphi'>('all')
  const [motif, setMotif] = useState('extra')
  const [note, setNote] = useState('')
  const [enabled, setEnabled] = useState(false)

  const start = SLOTS[slot].start
  const end = SLOTS[slot].end

  const query = useQuery({
    queryKey: ['available-rooms', date, start, end, headcount, kind],
    enabled,
    queryFn: async () => {
      const res = await api.get('/room-bookings/available-rooms', {
        params: {
          date,
          start_time: start,
          end_time: end,
          headcount: Number(headcount) || undefined,
          kind,
        },
      })
      return (res.data.data || {}) as Availability
    },
  })

  const bookMutation = useMutation({
    mutationFn: async (room: RoomRow) => {
      const purpose = `[${MOTIFS.find((m) => m.id === motif)?.label}] ${note || 'Séance ponctuelle ENCG Fès'}`
      const payload = {
        room_id: room.id,
        room_name: room.name,
        purpose,
        start_time: `${date} ${start}:00`,
        end_time: `${date} ${end}:00`,
        ...(isProfessor ? {} : { status: 'approved' }),
      }
      const url = isProfessor ? '/professor-portal/reservations' : '/room-bookings'
      await api.post(url, payload)
    },
    onSuccess: () => {
      toast.success(isProfessor ? 'Demande envoyée. La salle est bloquée en attente de validation.' : 'Salle attribuée et réservée.')
      query.refetch()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Impossible de réserver cette salle')
    },
  })

  const available = query.data?.available ?? []
  const occupied = query.data?.occupied ?? []
  const weekday = useMemo(() => {
    const d = new Date(`${date}T12:00:00`)
    return d.toLocaleDateString('fr-FR', { weekday: 'long' })
  }, [date])

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto animate-in fade-in">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <CalendarCheck className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">OCA / CSA / Enseignants</p>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Salles libres — extra & rattrapage</h1>
              <p className="text-sm text-blue-100/90 mt-1 max-w-xl">
                Choisissez la date et le créneau ENCG : seules les salles vraiment libres (EDT + réservations) s’affichent.
              </p>
            </div>
          </div>
          {!isProfessor && (
            <Link
              to="/admin/reservations"
              className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-xs font-black uppercase tracking-wide hover:bg-white/20"
            >
              Historique des réservations
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold"
            />
            <span className="text-xs text-slate-400 capitalize">{weekday}</span>
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Créneau</span>
            <select
              value={slot}
              onChange={(e) => setSlot(Number(e.target.value))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold"
            >
              {SLOTS.map((s, i) => (
                <option key={s.start} value={i}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Effectif</span>
            <input
              type="number"
              min={1}
              value={headcount}
              onChange={(e) => setHeadcount(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Type de salle</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as 'all' | 'td' | 'amphi')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold"
            >
              <option value="all">Toutes (adaptées à l’effectif)</option>
              <option value="td">Salle TD / TP</option>
              <option value="amphi">Amphithéâtre</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Motif</span>
            <select
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold"
            >
              {MOTIFS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Précision (module, groupe…)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex. Rattrapage Macroéconomie — GFC S5 G1"
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => { setEnabled(true); query.refetch() }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#0f2863] text-white text-xs font-black uppercase tracking-wider"
        >
          {query.isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Voir les salles disponibles
        </button>
      </div>

      {enabled && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-3xl border border-emerald-200 p-5 space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wide text-emerald-800 flex items-center gap-2">
              <DoorOpen className="w-4 h-4" /> Libres ({available.length})
            </h2>
            {query.isFetching && available.length === 0 ? (
              <p className="text-sm text-slate-500">Recherche…</p>
            ) : available.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune salle libre pour ce créneau et cet effectif.</p>
            ) : (
              available.map((room) => (
                <div key={room.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-black text-slate-900">{room.name}</p>
                    <p className="text-xs text-slate-500">
                      {room.code} · {room.capacity} places · {room.is_amphitheater ? 'Amphi' : room.type}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={bookMutation.isPending}
                    onClick={() => bookMutation.mutate(room)}
                    className="shrink-0 px-3 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wide"
                  >
                    {isProfessor ? 'Demander' : 'Attribuer'}
                  </button>
                </div>
              ))
            )}
          </section>

          <section className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-600 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Indisponibles ({occupied.length})
            </h2>
            {occupied.slice(0, 12).map((room) => (
              <div key={room.id} className={cn('rounded-2xl border px-4 py-3', 'border-slate-100 bg-slate-50')}>
                <p className="font-bold text-slate-800">{room.name}</p>
                <p className="text-xs text-slate-500">{room.reason}</p>
              </div>
            ))}
            {occupied.length > 12 && (
              <p className="text-xs text-slate-400">+ {occupied.length - 12} autres</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
