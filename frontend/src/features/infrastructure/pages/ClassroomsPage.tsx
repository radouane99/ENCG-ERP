import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, Monitor, Thermometer, Building, CheckCircle } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import MassImportView from '@shared/components/ui/MassImportView'
import { Upload } from 'lucide-react'

interface Room {
  id: number; name: string; code: string; type: string;
  capacity: number; exam_capacity?: number; has_projector: boolean; has_ac: boolean; is_available: boolean;
}
interface Stats { total: number; available: number; amphitheatres: number; total_capacity: number; total_exam_capacity?: number; }

const TYPE_LABELS: Record<string, string> = { classroom: 'Salle', amphitheatre: 'Amphithéâtre', lab: 'Laboratoire', seminar: 'Salle de séminaire', admin: 'Bureau Admin' }
const TYPE_COLORS: Record<string, string> = { classroom: 'bg-primary/10 text-primary border-primary/20', amphitheatre: 'bg-purple-500/10 text-purple-600 border-purple-500/20', lab: 'bg-green-500/10 text-green-600 border-green-500/20', seminar: 'bg-amber-500/10 text-amber-600 border-amber-500/20', admin: 'bg-muted text-muted-foreground border-border' }

const EMPTY = { name: '', code: '', type: 'classroom', capacity: 30, exam_capacity: 15, has_projector: true, has_ac: false, is_available: true }

export default function ClassroomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, available: 0, amphitheatres: 0, total_capacity: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
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
    setForm({ name: r.name, code: r.code, type: r.type, capacity: r.capacity, exam_capacity: r.exam_capacity || Math.floor(r.capacity / 2), has_projector: r.has_projector, has_ac: r.has_ac, is_available: r.is_available })
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

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.type === 'number' ? +e.target.value : e.target.value;
    setForm(p => {
      const next = { ...p, [k]: val };
      if (k === 'capacity' && typeof val === 'number') {
        next.exam_capacity = Math.floor(val / 2);
      }
      return next;
    });
  }

  const inputCls = "w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
  const labelCls = "block text-xs font-bold text-muted-foreground uppercase mb-1"

  if (isImporting) {
    return (
      <MassImportView
        title="Importation Massive de Salles (Excel/CSV)"
        bannerTitle="Importateur de Locaux & Salles de Cours"
        bannerSubtitle="Gérez l'infrastructure physique de l'UPF en ajoutant des dizaines d'amphis, salles de TD ou laboratoires TP instantanément."
        modelName="Salles"
        templateName="Fichier Modèle d'Infrastructure"
        templateDesc={
          <>Téléchargez et remplissez le gabarit pré-formaté. Il contient les colonnes requises : <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">name</span> (nom de la salle), <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">capacity</span> (places cours), et <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">type</span> (catégorie de salle).</>
        }
        instructions={<>Les types de salles autorisés sont : <strong>course</strong> (Amphithéâtre / Cours magistral), <strong>TD</strong> (Travaux Dirigés), et <strong>TP</strong> (Laboratoire informatique ou technique).</>}
        apiModel="rooms"
        onBack={() => setIsImporting(false)}
        onSuccess={() => {
          fetchData()
        }}
      />
    )
  }

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2863] italic">Infrastructures &amp; Salles</h1>
            <p className="text-slate-500 mt-1 text-sm">Gestion complète des amphis, salles de cours TD et laboratoires TP avec capacités cours &amp; examen.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setIsImporting(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold shadow-sm hover:bg-slate-50 transition-colors text-sm uppercase tracking-wide">
            <Upload className="w-4 h-4" /> Importer CSV/Excel
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-[#0f2863] hover:bg-[#1a387e] text-white rounded-lg font-bold shadow-sm text-sm uppercase tracking-wide transition-colors">
            <Plus className="w-4 h-4" /> Ajouter Salle
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col mt-8">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f2863]"></div>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-white border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 font-bold tracking-wider">Nom de la salle</th>
                <th className="px-6 py-5 font-bold tracking-wider text-center">Catégorie</th>
                <th className="px-6 py-5 font-bold tracking-wider text-center">Capacité Cours</th>
                <th className="px-6 py-5 font-bold tracking-wider text-center">Capacité Examen</th>
                <th className="px-8 py-5 font-bold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">Aucune salle trouvée.</td>
                </tr>
              ) : rooms.map(r => {
                let badgeClass = "bg-slate-100 text-slate-600";
                let displayType = TYPE_LABELS[r.type] || r.type;
                if (r.type === 'amphitheatre') {
                  badgeClass = "bg-blue-50 text-blue-700";
                  displayType = "COURS (AMPHI)";
                } else if (r.type === 'classroom') {
                  badgeClass = "bg-white border border-blue-200 text-blue-700";
                  displayType = "SALLE TD";
                } else if (r.type === 'lab') {
                  badgeClass = "bg-emerald-50 text-emerald-700";
                  displayType = "LABO TP";
                }
                
                const examCap = r.exam_capacity ?? Math.floor(r.capacity / 2);

                return (
                  <tr key={r.id} className="bg-white hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-800">{r.name}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={cn("inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider", badgeClass)}>
                        {displayType}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="font-bold text-slate-600 text-xs tracking-wider">{r.capacity} SIÈGES</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full text-xs tracking-wider border border-purple-200/60">
                        {examCap} PLACES
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(r)} className="text-amber-500 hover:text-amber-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Modifier la salle' : 'Nouvelle Salle'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nom *</label>
                  <input required value={form.name} onChange={set('name')} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Amphi Ibn Khaldoun" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Code *</label>
                  <input required value={form.code} onChange={set('code')} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="AMPH-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type *</label>
                  <select value={form.type} onChange={set('type')} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Capacité Cours *</label>
                  <input required type="number" min="1" value={form.capacity} onChange={set('capacity')} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Capacité Examen (Espacement Anti-Triche)</label>
                <input type="number" min="1" value={form.exam_capacity} onChange={set('exam_capacity')} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="50% de la capacité par défaut" />
                <p className="text-[11px] text-slate-400 mt-1">Par défaut : 50% de la capacité cours (laisse une place vide entre chaque étudiant).</p>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">ANNULER</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold bg-[#0f2863] text-white hover:bg-[#1a387e] rounded-xl shadow-sm transition-colors">{editingId ? 'METTRE À JOUR' : 'ENREGISTRER'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
