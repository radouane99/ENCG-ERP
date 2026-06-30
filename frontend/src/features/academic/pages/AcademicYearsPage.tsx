import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Calendar, CheckCircle, Lock, Unlock } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'

interface AcademicYear {
  id: number; label: string; start_year: number; end_year: number;
  start_date: string; end_date: string; is_current: boolean; is_locked: boolean;
}

const EMPTY = { label: '', start_year: new Date().getFullYear(), end_year: new Date().getFullYear() + 1, start_date: '', end_date: '', is_current: false }

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY })

  const fetchData = async () => {
    try { setLoading(true); const r = await api.get('/academic-years'); setYears(r.data.data || []) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [])

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY }); setShowModal(true) }
  const openEdit = (y: AcademicYear) => {
    setEditingId(y.id)
    setForm({ label: y.label, start_year: y.start_year, end_year: y.end_year, start_date: y.start_date ?? '', end_date: y.end_date ?? '', is_current: y.is_current })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      editingId ? await api.put(`/academic-years/${editingId}`, form) : await api.post('/academic-years', form)
      toast.success(editingId ? 'Année mise à jour !' : 'Année créée !')
      setShowModal(false); fetchData()
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Erreur.') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette année académique ?')) return
    try { await api.delete(`/academic-years/${id}`); toast.success('Supprimée.'); fetchData() }
    catch (err: any) { toast.error(err?.response?.data?.message || 'Erreur.') }
  }

  const handleSetCurrent = async (y: AcademicYear) => {
    try { await api.put(`/academic-years/${y.id}`, { is_current: true }); toast.success(`${y.label} définie comme année en cours.`); fetchData() }
    catch { toast.error('Erreur.') }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? +e.target.value : e.target.value }))

  const inputCls = "w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
  const labelCls = "block text-xs font-bold text-muted-foreground uppercase mb-1"

  return (
    <div className="space-y-6 animate-in p-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Années Académiques</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gérez le calendrier académique et les années scolaires.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 text-sm">
          <Plus className="w-4 h-4" /> Nouvelle Année
        </button>
      </div>

      {loading ? <div className="text-muted-foreground p-12 text-center">Chargement...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {years.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Aucune année académique définie.</p>
              <button onClick={openCreate} className="mt-2 text-sm text-primary hover:underline">+ Créer la première année</button>
            </div>
          ) : years.map(y => (
            <div key={y.id} className={cn("p-5 rounded-2xl border shadow-sm bg-card relative overflow-hidden", y.is_current && "border-primary/40 ring-2 ring-primary/20")}>
              {y.is_current && <div className="absolute top-3 right-3"><span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">En cours</span></div>}
              {y.is_locked && <div className="absolute top-3 left-3"><Lock className="w-3.5 h-3.5 text-muted-foreground" /></div>}
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold", y.is_current ? "gradient-primary text-white" : "bg-muted text-muted-foreground")}>
                  {y.start_year.toString().slice(2)}
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">{y.label}</p>
                  <p className="text-xs text-muted-foreground">{y.start_year} — {y.end_year}</p>
                </div>
              </div>
              {(y.start_date || y.end_date) && (
                <p className="text-xs text-muted-foreground mb-3">
                  Du {y.start_date ?? '?'} au {y.end_date ?? '?'}
                </p>
              )}
              <div className="flex items-center gap-2 mt-4">
                {!y.is_current && (
                  <button onClick={() => handleSetCurrent(y)} className="flex-1 text-xs font-medium text-primary border border-primary/30 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                    Définir en cours
                  </button>
                )}
                <button onClick={() => openEdit(y)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"><Edit2 className="w-4 h-4" /></button>
                {!y.is_locked && <button onClick={() => handleDelete(y.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <h3 className="font-bold text-lg">{editingId ? 'Modifier l\'année' : 'Nouvelle Année Académique'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:bg-muted rounded-md"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className={labelCls}>Libellé *</label>
                <input required value={form.label} onChange={set('label')} className={inputCls} placeholder="Ex: 2025-2026" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Année début *</label>
                  <input required type="number" value={form.start_year} onChange={set('start_year')} className={inputCls} /></div>
                <div><label className={labelCls}>Année fin *</label>
                  <input required type="number" value={form.end_year} onChange={set('end_year')} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Date début</label><input type="date" value={form.start_date} onChange={set('start_date')} className={inputCls} /></div>
                <div><label className={labelCls}>Date fin</label><input type="date" value={form.end_date} onChange={set('end_date')} className={inputCls} /></div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_current" checked={form.is_current} onChange={e => setForm(p => ({ ...p, is_current: e.target.checked }))} className="w-4 h-4 accent-primary rounded" />
                <label htmlFor="is_current" className="text-sm text-foreground">Définir comme année en cours</label>
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
