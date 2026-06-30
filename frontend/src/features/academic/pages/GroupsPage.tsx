import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, Users, Layers, BookOpen } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import ExcelActions from '@shared/components/ui/ExcelActions'

interface Group {
  id: number; name: string; filiere: string; filiere_id: number | null;
  filiere_name: string; semester_number: number;
  capacity: number; current_count: number; academic_year: string; academic_year_id: number | null;
}
interface Filiere { id: number; code: string; name: string; }
interface AcademicYear { id: number; label: string; is_current: boolean; }

const EMPTY = { name: '', filiere_id: '', academic_year_id: '', semester_number: 1, capacity: 30 }

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [gRes, fRes, yRes] = await Promise.all([
        api.get('/groups'), api.get('/filieres'), api.get('/academic-years')
      ])
      setGroups(gRes.data.data || [])
      setFilieres(fRes.data.data || [])
      setYears(yRes.data.data || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY }); setShowModal(true) }
  const openEdit = (g: Group) => {
    setEditingId(g.id)
    setForm({ name: g.name, filiere_id: g.filiere_id?.toString() ?? '', academic_year_id: g.academic_year_id?.toString() ?? '', semester_number: g.semester_number, capacity: g.capacity })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...form, filiere_id: form.filiere_id ? +form.filiere_id : null, academic_year_id: form.academic_year_id ? +form.academic_year_id : null }
      editingId ? await api.put(`/groups/${editingId}`, payload) : await api.post('/groups', payload)
      toast.success(editingId ? 'Groupe mis à jour !' : 'Groupe créé !')
      setShowModal(false); fetchData()
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Erreur.') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce groupe ?')) return
    try { await api.delete(`/groups/${id}`); toast.success('Supprimé.'); fetchData() }
    catch { toast.error('Erreur.') }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const filtered = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.filiere.toLowerCase().includes(search.toLowerCase()))
  const inputCls = "w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
  const labelCls = "block text-xs font-bold text-muted-foreground uppercase mb-1"

  return (
    <div className="space-y-6 animate-in p-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Groupes & Sections</h1>
          <p className="text-muted-foreground mt-1 text-sm">Organisez les étudiants en groupes par filière et semestre.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExcelActions model="groups" label="Groupes" onImportSuccess={fetchData} />
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 text-sm">
            <Plus className="w-4 h-4" /> Nouveau Groupe
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Groupes', value: groups.length, icon: <Layers className="w-5 h-5" />, color: 'bg-primary/10 text-primary' },
          { label: 'Capacité totale', value: groups.reduce((s, g) => s + g.capacity, 0), icon: <Users className="w-5 h-5" />, color: 'bg-secondary/10 text-secondary' },
          { label: 'Filières couvertes', value: new Set(groups.map(g => g.filiere_id).filter(Boolean)).size, icon: <BookOpen className="w-5 h-5" />, color: 'bg-muted text-foreground' },
        ].map((c, i) => (
          <div key={i} className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
            <div><p className="text-sm font-medium text-muted-foreground mb-1">{c.label}</p>
              <p className="text-2xl font-bold text-foreground">{c.value}</p></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${c.color}`}>{c.icon}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Rechercher un groupe..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="overflow-x-auto min-h-[250px]">
          {loading ? <div className="flex justify-center items-center p-12 text-muted-foreground">Chargement...</div> : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 font-semibold">Nom du groupe</th>
                  <th className="px-6 py-3 font-semibold">Filière</th>
                  <th className="px-6 py-3 font-semibold text-center">Semestre</th>
                  <th className="px-6 py-3 font-semibold text-center">Effectif / Capacité</th>
                  <th className="px-6 py-3 font-semibold">Année académique</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">
                    Aucun groupe. <button onClick={openCreate} className="text-primary hover:underline">Créer le premier groupe →</button>
                  </td></tr>
                ) : filtered.map(g => {
                  const fill = g.capacity > 0 ? Math.min((g.current_count / g.capacity) * 100, 100) : 0
                  return (
                    <tr key={g.id} className="hover:bg-muted/50 group">
                      <td className="px-6 py-4 font-bold text-foreground">{g.name}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">{g.filiere}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{g.filiere_name}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border bg-blue-500/10 text-blue-600 border-blue-500/20">S{g.semester_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-center">
                          <span className="text-sm font-medium">{g.current_count} / {g.capacity}</span>
                          <div className="w-24 bg-muted rounded-full h-1.5">
                            <div className={cn("h-1.5 rounded-full", fill >= 90 ? "bg-red-500" : fill >= 70 ? "bg-amber-500" : "bg-green-500")} style={{ width: `${fill}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">{g.academic_year}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(g)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(g.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <h3 className="font-bold text-lg">{editingId ? 'Modifier le groupe' : 'Nouveau Groupe'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:bg-muted rounded-md"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className={labelCls}>Nom du groupe *</label>
                <input required value={form.name} onChange={set('name')} className={inputCls} placeholder="Ex: GFC-G1-S3" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Filière</label>
                  <select value={form.filiere_id} onChange={set('filiere_id')} className={inputCls}>
                    <option value="">— Toutes —</option>
                    {filieres.map(f => <option key={f.id} value={f.id}>{f.code} - {f.name}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Semestre *</label>
                  <input required type="number" min="1" max="12" value={form.semester_number} onChange={set('semester_number')} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Capacité *</label>
                  <input required type="number" min="1" value={form.capacity} onChange={set('capacity')} className={inputCls} /></div>
                <div><label className={labelCls}>Année académique</label>
                  <select value={form.academic_year_id} onChange={set('academic_year_id')} className={inputCls}>
                    <option value="">— Choisir —</option>
                    {years.map(y => <option key={y.id} value={y.id}>{y.label}{y.is_current ? ' (En cours)' : ''}</option>)}
                  </select>
                </div>
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
