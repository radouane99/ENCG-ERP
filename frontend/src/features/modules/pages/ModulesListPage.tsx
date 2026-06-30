import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Filter, MoreHorizontal, BookOpen, Edit2, Users, Plus, Trash2, X, GraduationCap } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import ExcelActions from '@shared/components/ui/ExcelActions'

interface Filiere {
  id: number;
  code: string;
  name: string;
}

interface Module {
  id: number;
  code: string;
  name: string;
  semester: string;
  semester_number: number;
  coefficient: number;
  filiere: string;
  filiere_id: number | null;
  professor: string;
  studentsCount: number;
  active: boolean;
  credit_hours: number | null;
}

export default function ModulesListPage() {
  const { t } = useTranslation('common')
  const [modules, setModules] = useState<Module[]>([])
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    semester_number: 1,
    coefficient: 1,
    credit_hours: 45,
    filiere_id: '',
    is_active: true
  })

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [modRes, filRes] = await Promise.all([
        api.get('/modules'),
        api.get('/filieres')
      ]);
      setModules(modRes.data.data || []);
      setFilieres(filRes.data.data || []);
    } catch (error) {
      console.error("Erreur de chargement", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [])

  // Actions
  const handleOpenModal = (mod?: Module) => {
    if (mod) {
      setEditingId(mod.id);
      setFormData({
        code: mod.code,
        name: mod.name,
        semester_number: mod.semester_number,
        coefficient: mod.coefficient,
        credit_hours: mod.credit_hours || 45,
        filiere_id: mod.filiere_id ? mod.filiere_id.toString() : '',
        is_active: mod.active
      });
    } else {
      setEditingId(null);
      setFormData({ 
        code: '', name: '', semester_number: 1, coefficient: 1, credit_hours: 45, filiere_id: '', is_active: true 
      });
    }
    setShowModal(true);
  }

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert filiere_id to null if empty string
      const payload = {
        ...formData,
        filiere_id: formData.filiere_id === '' ? null : parseInt(formData.filiere_id)
      };

      if (editingId) {
        await api.put(`/modules/${editingId}`, payload);
      } else {
        await api.post('/modules', payload);
      }
      handleCloseModal();
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Erreur de sauvegarde", error);
      alert("Une erreur est survenue lors de la sauvegarde.");
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce module ?")) {
      try {
        await api.delete(`/modules/${id}`);
        fetchData();
      } catch (error) {
        console.error("Erreur de suppression", error);
      }
    }
  }

  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in relative p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Modules & Matières</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gérez le catalogue des modules enseignés.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExcelActions model="modules" label="Modules" onImportSuccess={fetchData} />
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Nouveau Module
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Modules</p>
            <p className="text-2xl font-bold text-foreground">{modules.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Modules Actifs</p>
            <p className="text-2xl font-bold text-foreground">{modules.filter(m => m.active).length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Modules sans Filière</p>
            <p className="text-2xl font-bold text-foreground">{modules.filter(m => !m.filiere_id).length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-muted text-foreground flex items-center justify-center">
            <Filter className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Table Container */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center p-12 text-muted-foreground">Chargement des données...</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold">Code / Intitulé</th>
                  <th scope="col" className="px-6 py-3 font-semibold text-center">Semestre</th>
                  <th scope="col" className="px-6 py-3 font-semibold text-center">Filière</th>
                  <th scope="col" className="px-6 py-3 font-semibold text-center">Coef.</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Professeur</th>
                  <th scope="col" className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredModules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">Aucun module trouvé.</td>
                  </tr>
                ) : (
                  filteredModules.map((mod) => (
                    <tr key={mod.id} className="bg-card hover:bg-muted/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{mod.code}</span>
                          <span className="text-sm text-muted-foreground">{mod.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border bg-blue-500/10 text-blue-600 border-blue-500/20">
                          {mod.semester}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-foreground bg-muted px-2 py-1 rounded-md text-xs">
                          {mod.filiere}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-foreground">{mod.coefficient}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {mod.professor !== 'Non assigné' ? mod.professor.split(' ')[1]?.charAt(0) || 'P' : '?'}
                          </div>
                          <span className="font-medium text-muted-foreground text-xs">{mod.professor}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(mod)}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" 
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(mod.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <h3 className="font-bold text-lg">{editingId ? 'Modifier le module' : 'Nouveau Module'}</h3>
              <button onClick={handleCloseModal} className="p-1 text-muted-foreground hover:bg-muted rounded-md"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Code *</label>
                  <input 
                    type="text" required 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-sm" 
                    placeholder="Ex: M101" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Semestre *</label>
                  <input 
                    type="number" min="1" max="12" required 
                    value={formData.semester_number} 
                    onChange={e => setFormData({...formData, semester_number: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Nom du module *</label>
                <input 
                  type="text" required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm" 
                  placeholder="Ex: Mathématiques Financières" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Coefficient</label>
                  <input 
                    type="number" step="0.5" min="0" required 
                    value={formData.coefficient} 
                    onChange={e => setFormData({...formData, coefficient: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Volume Horaire (heures)</label>
                  <input 
                    type="number" min="0" 
                    value={formData.credit_hours} 
                    onChange={e => setFormData({...formData, credit_hours: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Filière (Optionnel)</label>
                <select 
                  value={formData.filiere_id} 
                  onChange={e => setFormData({...formData, filiere_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                >
                  <option value="">Tronc Commun (Toutes filières)</option>
                  {filieres.map(f => (
                    <option key={f.id} value={f.id}>{f.code} - {f.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg">
                  Annuler
                </button>
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
