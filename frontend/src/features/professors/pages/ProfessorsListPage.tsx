import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, GraduationCap, Users, Briefcase, CheckCircle } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import ExcelActions from '@shared/components/ui/ExcelActions'

interface Professor {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  grade: string;
  specialty: string;
  contract_type: 'permanent' | 'contractual' | 'visiting';
  hire_date: string;
  is_active: boolean;
  department: string;
  department_id: number | null;
}

const CONTRACT_LABELS: Record<string, string> = {
  permanent: 'Permanent',
  contractual: 'Contractuel',
  visiting: 'Vacataire',
};

const CONTRACT_STYLES: Record<string, string> = {
  permanent: 'bg-primary/10 text-primary border-primary/20',
  contractual: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  visiting: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', phone: '',
  grade: '', specialty: '', contract_type: 'permanent',
  hire_date: '', is_active: true, department_id: ''
};

export default function ProfessorsListPage() {
  const [professors, setProfessors] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/professors', { params: { search, contract_type: contractFilter } })
      setProfessors(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [search, contractFilter])

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setShowModal(true) }
  const openEdit = (p: Professor) => {
    setEditingId(p.id)
    setForm({
      first_name: p.first_name, last_name: p.last_name, email: p.email,
      phone: p.phone, grade: p.grade, specialty: p.specialty,
      contract_type: p.contract_type, hire_date: p.hire_date ?? '',
      is_active: p.is_active, department_id: p.department_id?.toString() ?? ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...form, department_id: form.department_id ? parseInt(form.department_id as string) : null }
      if (editingId) {
        await api.put(`/professors/${editingId}`, payload)
        toast.success('Professeur mis à jour !')
      } else {
        await api.post('/professors', payload)
        toast.success('Professeur créé avec succès !')
      }
      setShowModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la sauvegarde.')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer ce professeur ?')) {
      try {
        await api.delete(`/professors/${id}`)
        toast.success('Professeur supprimé.')
        fetchData()
      } catch { toast.error('Erreur lors de la suppression.') }
    }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  const inputCls = "w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
  const labelCls = "block text-xs font-bold text-muted-foreground uppercase mb-1"

  const filtered = professors.filter(p =>
    (!search || `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(search.toLowerCase())) &&
    (!contractFilter || p.contract_type === contractFilter)
  )

  return (
    <div className="space-y-6 animate-in relative p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Corps Professoral</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gérez les professeurs permanents, contractuels et vacataires.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExcelActions model="professors" label="Professeurs" onImportSuccess={fetchData} />
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors text-sm">
            <Plus className="w-4 h-4" /> Nouveau Professeur
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold">{professors.length}</p></div>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Users className="w-5 h-5" /></div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground mb-1">Permanents</p>
            <p className="text-2xl font-bold">{professors.filter(p => p.contract_type === 'permanent').length}</p></div>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Briefcase className="w-5 h-5" /></div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground mb-1">Contractuels</p>
            <p className="text-2xl font-bold">{professors.filter(p => p.contract_type === 'contractual').length}</p></div>
          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center"><GraduationCap className="w-5 h-5" /></div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground mb-1">Actifs</p>
            <p className="text-2xl font-bold">{professors.filter(p => p.is_active).length}</p></div>
          <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center"><CheckCircle className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 items-center bg-muted/20">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Rechercher un professeur..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select value={contractFilter} onChange={e => setContractFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none">
            <option value="">Tous les contrats</option>
            <option value="permanent">Permanent</option>
            <option value="contractual">Contractuel</option>
            <option value="visiting">Vacataire</option>
          </select>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center p-12 text-muted-foreground">Chargement...</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 font-semibold">Professeur</th>
                  <th className="px-6 py-3 font-semibold">Grade / Spécialité</th>
                  <th className="px-6 py-3 font-semibold">Type de contrat</th>
                  <th className="px-6 py-3 font-semibold">Département</th>
                  <th className="px-6 py-3 font-semibold text-center">Statut</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">
                    <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>Aucun professeur trouvé.</p>
                    <button onClick={openCreate} className="mt-2 text-xs text-primary hover:underline">+ Ajouter le premier professeur</button>
                  </td></tr>
                ) : filtered.map((prof) => (
                  <tr key={prof.id} className="bg-card hover:bg-muted/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {prof.first_name[0]}{prof.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{prof.last_name} {prof.first_name}</p>
                          <p className="text-xs text-muted-foreground">{prof.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{prof.grade || '—'}</p>
                      <p className="text-xs text-muted-foreground">{prof.specialty || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border", CONTRACT_STYLES[prof.contract_type])}>
                        {CONTRACT_LABELS[prof.contract_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{prof.department}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                        prof.is_active ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-muted text-muted-foreground border-border")}>
                        {prof.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(prof)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(prof.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <h3 className="font-bold text-lg">{editingId ? 'Modifier le professeur' : 'Nouveau Professeur'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:bg-muted rounded-md"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Prénom *</label>
                  <input required value={form.first_name} onChange={set('first_name')} className={inputCls} placeholder="Ahmed" /></div>
                <div><label className={labelCls}>Nom *</label>
                  <input required value={form.last_name} onChange={set('last_name')} className={inputCls} placeholder="BENSOUDA" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Email *</label>
                  <input required type="email" value={form.email} onChange={set('email')} className={inputCls} /></div>
                <div><label className={labelCls}>Téléphone</label>
                  <input value={form.phone} onChange={set('phone')} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Grade académique</label>
                  <input value={form.grade} onChange={set('grade')} className={inputCls} placeholder="Professeur Habilité, Dr..." /></div>
                <div><label className={labelCls}>Spécialité</label>
                  <input value={form.specialty} onChange={set('specialty')} className={inputCls} placeholder="Finance, Droit..." /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Type de contrat *</label>
                  <select value={form.contract_type} onChange={set('contract_type')} className={inputCls}>
                    <option value="permanent">Permanent</option>
                    <option value="contractual">Contractuel</option>
                    <option value="visiting">Vacataire</option>
                  </select>
                </div>
                <div><label className={labelCls}>Date d'embauche</label>
                  <input type="date" value={form.hire_date} onChange={set('hire_date')} className={inputCls} /></div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" id="is_active" checked={form.is_active as boolean}
                  onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-primary rounded" />
                <label htmlFor="is_active" className="text-sm text-foreground">Professeur actif</label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm">
                  {editingId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
