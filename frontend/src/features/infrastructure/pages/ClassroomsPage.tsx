import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, Monitor, Thermometer, Building, CheckCircle } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import ExcelActions from '@shared/components/ui/ExcelActions'

interface Room {
  id: number; name: string; code: string; type: string;
  capacity: number; has_projector: boolean; has_ac: boolean; is_available: boolean;
}
interface Stats { total: number; available: number; amphitheatres: number; total_capacity: number; }

const TYPE_LABELS: Record<string, string> = { classroom: 'Salle', amphitheatre: 'Amphithéâtre', lab: 'Laboratoire', seminar: 'Salle de séminaire', admin: 'Bureau Admin' }
const TYPE_COLORS: Record<string, string> = { classroom: 'bg-primary/10 text-primary border-primary/20', amphitheatre: 'bg-purple-500/10 text-purple-600 border-purple-500/20', lab: 'bg-green-500/10 text-green-600 border-green-500/20', seminar: 'bg-amber-500/10 text-amber-600 border-amber-500/20', admin: 'bg-muted text-muted-foreground border-border' }

const EMPTY = { name: '', code: '', type: 'classroom', capacity: 30, has_projector: true, has_ac: false, is_available: true }

export default function ClassroomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, available: 0, amphitheatres: 0, total_capacity: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY })

  const fetchData = async () => {
    try { setLoading(true); const r = await api.get('/rooms', { params: { search, type: typeFilter } }); setRooms(r.data.data || []); setStats(r.data.stats || {}) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [search, typeFilter])

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY }); setShowModal(true) }
  const openEdit = (r: Room) => {
    setEditingId(r.id)
    setForm({ name: r.name, code: r.code, type: r.type, capacity: r.capacity, has_projector: r.has_projector, has_ac: r.has_ac, is_available: r.is_available })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      editingId ? await api.put(`/rooms/${editingId}`, form) : await api.post('/rooms', form)
      toast.success(editingId ? 'Salle mise à jour !' : 'Salle créée !')
      setShowModal(false); fetchData()
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Erreur.') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette salle ?')) return
    try { await api.delete(`/rooms/${id}`); toast.success('Salle supprimée.'); fetchData() }
    catch { toast.error('Erreur.') }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.type === 'number' ? +e.target.value : e.target.value }))

  const inputCls = "w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
  const labelCls = "block text-xs font-bold text-muted-foreground uppercase mb-1"

  return (
    <div className="space-y-6 animate-in p-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Salles & Infrastructure</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gérez les salles de cours, amphithéâtres et laboratoires.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExcelActions model="rooms" label="Salles" onImportSuccess={fetchData} />
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 text-sm">
            <Plus className="w-4 h-4" /> Nouvelle Salle
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Salles', value: stats.total, icon: <Building className="w-5 h-5" />, color: 'bg-primary/10 text-primary' },
          { label: 'Disponibles', value: stats.available, icon: <CheckCircle className="w-5 h-5" />, color: 'bg-green-500/10 text-green-600' },
          { label: 'Amphithéâtres', value: stats.amphitheatres, icon: <Building className="w-5 h-5" />, color: 'bg-purple-500/10 text-purple-600' },
          { label: 'Capacité totale', value: stats.total_capacity, icon: <Building className="w-5 h-5" />, color: 'bg-muted text-foreground' },
        ].map((c, i) => (
          <div key={i} className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
            <div><p className="text-sm font-medium text-muted-foreground mb-1">{c.label}</p>
              <p className="text-2xl font-bold text-foreground">{c.value}</p></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${c.color}`}>{c.icon}</div>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Rechercher une salle..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none">
            <option value="">Tous les types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto min-h-[250px]">
          {loading ? <div className="flex justify-center items-center p-12 text-muted-foreground">Chargement...</div> : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 font-semibold">Salle / Code</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold text-center">Capacité</th>
                  <th className="px-6 py-3 font-semibold text-center">Équipements</th>
                  <th className="px-6 py-3 font-semibold text-center">Disponibilité</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rooms.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">
                    Aucune salle. <button onClick={openCreate} className="text-primary hover:underline">Créer la première →</button>
                  </td></tr>
                ) : rooms.map(r => (
                  <tr key={r.id} className="hover:bg-muted/50 group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.code}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border", TYPE_COLORS[r.type])}>
                        {TYPE_LABELS[r.type] || r.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold">{r.capacity}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {r.has_projector && <span title="Projecteur" className="p-1 rounded bg-blue-500/10 text-blue-500"><Monitor className="w-3.5 h-3.5" /></span>}
                        {r.has_ac && <span title="Climatisation" className="p-1 rounded bg-cyan-500/10 text-cyan-600"><Thermometer className="w-3.5 h-3.5" /></span>}
                        {!r.has_projector && !r.has_ac && <span className="text-muted-foreground text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                        r.is_available ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20")}>
                        {r.is_available ? 'Disponible' : 'Occupée'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(r)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <h3 className="font-bold text-lg">{editingId ? 'Modifier la salle' : 'Nouvelle Salle'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:bg-muted rounded-md"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Nom *</label><input required value={form.name} onChange={set('name')} className={inputCls} placeholder="Amphi A" /></div>
                <div><label className={labelCls}>Code *</label><input required value={form.code} onChange={set('code')} className={inputCls} placeholder="AMPH-A" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Type *</label>
                  <select value={form.type} onChange={set('type')} className={inputCls}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Capacité *</label><input required type="number" min="1" value={form.capacity} onChange={set('capacity')} className={inputCls} /></div>
              </div>
              <div className="flex flex-col gap-2">
                {[['has_projector', 'Projecteur disponible'], ['has_ac', 'Climatisation'], ['is_available', 'Salle disponible']].map(([k, label]) => (
                  <div key={k} className="flex items-center gap-3">
                    <input type="checkbox" id={k} checked={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.checked }))} className="w-4 h-4 accent-primary rounded" />
                    <label htmlFor={k} className="text-sm text-foreground">{label}</label>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm">{editingId ? 'Mettre à jour' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
