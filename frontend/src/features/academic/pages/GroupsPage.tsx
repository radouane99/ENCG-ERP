import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, Users, Layers, BookOpen } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import MassImportView from '@shared/components/ui/MassImportView'
import { Upload } from 'lucide-react'

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
  const [isImporting, setIsImporting] = useState(false)
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

  if (isImporting) {
    return (
      <MassImportView
        title="Importation Massive de Groupes (Excel/CSV)"
        bannerTitle="Importateur de Cohortes & Groupes"
        bannerSubtitle="Gérez la structure académique de l'UPF en ajoutant des dizaines de classes d'élèves en un instant."
        modelName="Groupes"
        templateName="Fichier Modèle des Classes"
        templateDesc={
          <>Téléchargez et remplissez le gabarit pré-formaté. Il contient les colonnes requises : <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">name</span> (nom complet ou trigramme du groupe, ex: GI-1), et <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">level</span> (niveau d'étude, ex: L1, L2, L3, M1, M2).</>
        }
        instructions={<>Pour le champ level, utilisez de préférence les formats académiques suivants : <strong>L1, L2, L3</strong> (Licence) ou <strong>M1, M2</strong> (Master).</>}
        apiModel="groups"
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
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2863] italic">Groupes &amp; Cohortes</h1>
            <p className="text-slate-500 mt-1 text-sm">Gestion des classes d'élèves, des sections et des cohortes académiques de l'UPF.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setIsImporting(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold shadow-sm hover:bg-slate-50 transition-colors text-sm uppercase tracking-wide">
            <Upload className="w-4 h-4" /> Importer CSV/Excel
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-[#0f2863] hover:bg-[#1a387e] text-white rounded-lg font-bold shadow-sm text-sm uppercase tracking-wide transition-colors">
            <Plus className="w-4 h-4" /> Ajouter Groupe
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f2863]"></div>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Désignation du groupe</th>
                <th className="px-6 py-4 font-bold tracking-wider text-center">Niveau académique</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-slate-400 font-medium">Aucun groupe trouvé.</td>
                </tr>
              ) : filtered.map(g => (
                <tr key={g.id} className="bg-white hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {g.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-700">{g.name}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                      L{Math.ceil(g.semester_number / 2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(g)} className="text-amber-500 hover:text-amber-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(g.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-2xl text-[#0f2863]">{editingId ? 'Edit Group' : 'Add New Group'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Filière (Requis)</label>
                  <select value={form.filiere_id} onChange={set('filiere_id')} className="w-full px-4 py-3 border border-blue-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700">
                    <option value="">-- Sélectionner la Filière --</option>
                    {filieres.map(f => <option key={f.id} value={f.id}>{f.code} - {f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Group Name</label>
                  <input required value={form.name} onChange={set('name')} className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 text-slate-700" placeholder="e.g. Génie Informatique - Groupe 1" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Level</label>
                  <input required type="text" value={form.semester_number} onChange={set('semester_number')} className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 text-slate-700" placeholder="e.g. L1, L2, Master 1" />
                </div>
                
                <div className="flex items-center justify-end pt-6">
                  <button type="submit" className="px-6 py-3 font-bold bg-[#0f2863] text-white hover:bg-[#1a387e] rounded-lg shadow-md transition-colors uppercase text-sm tracking-wide">
                    {editingId ? 'UPDATE GROUP' : 'CREATE GROUP'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
