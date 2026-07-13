import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, UserCheck, Clock, FileSignature, CheckCircle2, FileText, Banknote, Plus, Edit2, Trash2, X } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'

interface Vacataire {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  qualification: string;
  module: string;
  module_id: number | null;
  agreed_hours: number;
  hours_completed: number;
  hourly_rate: number;
  status: 'pending' | 'signed' | 'completed';
  payment_status: 'paid' | 'partial' | 'unpaid';
  payment_amount: number;
}

interface Stats {
  total: number;
  pending: number;
  total_hours: number;
  unpaid_contracts: number;
}

interface Module {
  id: number;
  code: string;
  name: string;
  filiere_id: number;
}

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', phone: '',
  qualification: '', department_id: '', filiere_id: '', module_id: '', agreed_hours: 30,
  hourly_rate: 400, status: 'pending', contract_start: '', contract_end: ''
};

export default function VacataireList() {
  const { t } = useTranslation('common')
  const [vacataires, setVacataires] = useState<Vacataire[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [filieres, setFilieres] = useState<any[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, total_hours: 0, unpaid_contracts: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [vacRes, modRes, deptRes, filRes] = await Promise.all([
        api.get('/hr/vacataires', { params: { search: searchQuery } }),
        api.get('/modules'),
        api.get('/departments'),
        api.get('/filieres')
      ])
      setVacataires(vacRes.data.data || [])
      setStats(vacRes.data.stats || {})
      setModules(modRes.data.data || [])
      setDepartments(deptRes.data.data || [])
      setFilieres(filRes.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [searchQuery])

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setShowModal(true) }
  const openEdit = (v: Vacataire) => {
    setEditingId(v.id)
    const mod = modules.find(m => m.id === v.module_id)
    const fil = filieres.find(f => f.id === mod?.filiere_id)
    setForm({
      first_name: v.first_name, last_name: v.last_name, email: v.email,
      phone: v.phone, qualification: v.qualification,
      department_id: fil?.department_id?.toString() ?? '',
      filiere_id: mod?.filiere_id?.toString() ?? '',
      module_id: v.module_id?.toString() ?? '',
      agreed_hours: v.agreed_hours, hourly_rate: v.hourly_rate,
      status: v.status, contract_start: '', contract_end: ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...form, module_id: form.module_id ? parseInt(form.module_id as string) : null, contract_type: 'visiting' }
      if (editingId) {
        await api.put(`/hr/vacataires/${editingId}`, payload)
        toast.success('Contrat mis à jour avec succès !')
      } else {
        await api.post('/hr/vacataires', payload)
        toast.success('Vacataire créé avec succès !')
      }
      setShowModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la sauvegarde.')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Voulez-vous vraiment supprimer ce vacataire ?')) {
      try {
        await api.delete(`/hr/vacataires/${id}`)
        toast.success('Vacataire supprimé avec succès')
        fetchData()
      } catch (err) { toast.error('Erreur lors de la suppression.') }
    }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const inputCls = "w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
  const labelCls = "block text-xs font-bold text-muted-foreground uppercase mb-1"

  return (
    <div className="space-y-6 animate-in relative">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#1F3A5F] to-[#2A4D7C] rounded-[2rem] p-8 text-white shadow-xl shadow-[#1F3A5F]/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl mix-blend-overlay"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.2rem] flex items-center justify-center border border-white/20">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1 tracking-tight">
              Gestion des Vacataires
            </h1>
            <p className="text-white/80 font-medium text-sm">
              Gérez les contrats, les heures d'enseignement et les paiements.
            </p>
          </div>
        </div>
        <div className="relative z-10 flex gap-3">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold shadow-sm hover:bg-emerald-600 transition-colors text-sm"
          >
            <Plus className="w-5 h-5" /> Nouveau Vacataire
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground mb-1">Total Vacataires</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p></div>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><UserCheck className="w-5 h-5" /></div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground mb-1">Contrats en attente</p>
            <p className="text-2xl font-bold text-foreground">{stats.pending}</p></div>
          <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center"><FileSignature className="w-5 h-5" /></div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground mb-1">Heures effectuées</p>
            <p className="text-2xl font-bold text-foreground">{stats.total_hours}h</p></div>
          <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center"><Clock className="w-5 h-5" /></div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground mb-1">Non payés</p>
            <p className="text-2xl font-bold text-foreground">{stats.unpaid_contracts}</p></div>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center"><Banknote className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex gap-4 items-center bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" placeholder="Rechercher (Nom, Module)..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center p-12 text-muted-foreground">Chargement...</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 font-semibold">Vacataire</th>
                  <th className="px-6 py-3 font-semibold">Module Assigné</th>
                  <th className="px-6 py-3 font-semibold">Progression (Heures)</th>
                  <th className="px-6 py-3 font-semibold">Contrat</th>
                  <th className="px-6 py-3 font-semibold">Paiement</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vacataires.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Aucun vacataire trouvé.</td></tr>
                ) : vacataires.map((vac) => {
                  const progress = vac.agreed_hours > 0 ? (vac.hours_completed / vac.agreed_hours) * 100 : 0
                  return (
                    <tr key={vac.id} className="bg-card hover:bg-muted/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {vac.first_name[0]}{vac.last_name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{vac.last_name} {vac.first_name}</p>
                            <p className="text-xs text-muted-foreground">{vac.qualification || vac.email}</p>
                          </div>
                        </div>
                      </td>
                        <td className="px-6 py-4">
                          {vac.module ? (
                            <span className="font-medium text-foreground">{vac.module}</span>
                          ) : (
                            <span className="text-muted-foreground italic text-sm">Non assignǸ</span>
                          )}
                        </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 w-36">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">{vac.hours_completed}h</span>
                            <span className="text-muted-foreground">/ {vac.agreed_hours}h</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className={cn("h-1.5 rounded-full transition-all", progress >= 100 ? "bg-green-500" : "bg-primary")}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {vac.status === 'signed' || vac.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Signé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 border border-orange-500/20">
                            <FileSignature className="w-3.5 h-3.5" /> En attente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {vac.payment_status === 'paid' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">Réglé</span>
                        )}
                        {vac.payment_status === 'partial' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">Partiel</span>
                        )}
                        {vac.payment_status === 'unpaid' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">Non calculé</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(vac)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Modifier">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(vac.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <h3 className="font-bold text-lg">{editingId ? 'Modifier le contrat' : 'Nouveau Vacataire'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:bg-muted rounded-md"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Prénom *</label>
                  <input required value={form.first_name} onChange={set('first_name')} className={inputCls} placeholder="Karim" /></div>
                <div><label className={labelCls}>Nom *</label>
                  <input required value={form.last_name} onChange={set('last_name')} className={inputCls} placeholder="TAZI" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Email *</label>
                  <input required type="email" value={form.email} onChange={set('email')} className={inputCls} /></div>
                <div><label className={labelCls}>Téléphone</label>
                  <input value={form.phone} onChange={set('phone')} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Qualification / Titre</label>
                <input value={form.qualification} onChange={set('qualification')} className={inputCls} placeholder="Dr., Expert-Comptable..." /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Département</label>
                  <select value={form.department_id} onChange={set('department_id')} className={inputCls}>
                    <option value="">— Aucun département —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Filière</label>
                  <select value={form.filiere_id} onChange={set('filiere_id')} className={inputCls}>
                    <option value="">— Aucune filière —</option>
                    {filieres.filter(f => !form.department_id || f.department_id.toString() === form.department_id.toString()).map(f => <option key={f.id} value={f.id}>{f.code} - {f.name}</option>)}
                  </select>
                </div>
              </div>

              <div><label className={labelCls}>Module assigné</label>
                <select value={form.module_id} onChange={set('module_id')} className={inputCls}>
                  <option value="">— Aucun module —</option>
                  {modules.filter(m => !form.filiere_id || m.filiere_id.toString() === form.filiere_id.toString()).map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Heures convenues *</label>
                  <input required type="number" min="1" value={form.agreed_hours} onChange={set('agreed_hours')} className={inputCls} /></div>
                <div><label className={labelCls}>Taux horaire (MAD)</label>
                  <input type="number" min="0" value={form.hourly_rate} onChange={set('hourly_rate')} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Date début</label>
                  <input type="date" value={form.contract_start} onChange={set('contract_start')} className={inputCls} /></div>
                <div><label className={labelCls}>Date fin</label>
                  <input type="date" value={form.contract_end} onChange={set('contract_end')} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Statut du contrat</label>
                <select value={form.status} onChange={set('status')} className={inputCls}>
                  <option value="pending">En attente de signature</option>
                  <option value="signed">Signé</option>
                  <option value="completed">Terminé</option>
                </select>
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
