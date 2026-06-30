import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Filter, MoreHorizontal, BookOpen, Edit2, Users, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import ExcelActions from '@shared/components/ui/ExcelActions'

interface Filiere {
  id: number;
  code: string;
  name: string;
  type: string;
  duration_years: number;
  coordinator: string;
  students: number;
  active: boolean;
}

export default function FiliereList() {
  const { t } = useTranslation('common')
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'Formation Initiale',
    duration_years: 5,
    is_active: true
  })

  // Fetch data
  const fetchFilieres = async () => {
    try {
      setLoading(true);
      const res = await api.get('/filieres');
      setFilieres(res.data.data || []);
    } catch (error) {
      console.error("Erreur de chargement des filières", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFilieres();
  }, [])

  // Actions
  const handleOpenModal = (filiere?: Filiere) => {
    if (filiere) {
      setEditingId(filiere.id);
      setFormData({
        code: filiere.code,
        name: filiere.name,
        type: filiere.type,
        duration_years: filiere.duration_years || 5,
        is_active: filiere.active
      });
    } else {
      setEditingId(null);
      setFormData({ code: '', name: '', type: 'Formation Initiale', duration_years: 5, is_active: true });
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
      if (editingId) {
        await api.put(`/filieres/${editingId}`, formData);
      } else {
        await api.post('/filieres', formData);
      }
      handleCloseModal();
      fetchFilieres();
    } catch (error) {
      console.error("Erreur de sauvegarde", error);
      alert("Une erreur est survenue lors de la sauvegarde.");
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette filière ?")) {
      try {
        await api.delete(`/filieres/${id}`);
        fetchFilieres();
      } catch (error) {
        console.error("Erreur de suppression", error);
      }
    }
  }

  const filteredFilieres = filieres.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Filières & Parcours</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gérez l'offre de formation, les filières et les coordinateurs.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExcelActions model="filieres" label="Filières" onImportSuccess={fetchFilieres} />
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Filière
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Filières</p>
            <p className="text-2xl font-bold text-foreground">{filieres.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Formation Initiale</p>
            <p className="text-2xl font-bold text-foreground">{filieres.filter(f => f.type === 'Formation Initiale').length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Formation Continue</p>
            <p className="text-2xl font-bold text-foreground">{filieres.filter(f => f.type === 'Formation Continue').length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-muted text-foreground flex items-center justify-center">
            <Users className="w-5 h-5" />
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
              placeholder="Rechercher une filière..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-background border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <Filter className="w-4 h-4" />
              Filtres
            </button>
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
                  <th scope="col" className="px-6 py-3 font-semibold">Type de Formation</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Coordinateur</th>
                  <th scope="col" className="px-6 py-3 font-semibold text-center">Effectif</th>
                  <th scope="col" className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFilieres.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">Aucune filière trouvée.</td>
                  </tr>
                ) : (
                  filteredFilieres.map((filiere) => (
                    <tr key={filiere.id} className="bg-card hover:bg-muted/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{filiere.code}</span>
                          <span className="text-sm text-muted-foreground">{filiere.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                          filiere.type === 'Formation Initiale' 
                            ? "bg-secondary/10 text-secondary border-secondary/20"
                            : "bg-muted text-muted-foreground border-border"
                        )}>
                          {filiere.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {filiere.coordinator && filiere.coordinator !== 'Non assigné' ? filiere.coordinator.split(' ')[1]?.charAt(0) || filiere.coordinator.charAt(0) : '?'}
                          </div>
                          <span className="font-medium text-foreground">{filiere.coordinator}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          {filiere.students || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(filiere)}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" 
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(filiere.id)}
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
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <h3 className="font-bold text-lg">{editingId ? 'Modifier la filière' : 'Nouvelle Filière'}</h3>
              <button onClick={handleCloseModal} className="p-1 text-muted-foreground hover:bg-muted rounded-md"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Code *</label>
                <input 
                  type="text" required 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm" 
                  placeholder="Ex: CFC" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Nom de la filière *</label>
                <input 
                  type="text" required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm" 
                  placeholder="Ex: Commerce et Finance" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Type de formation</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                >
                  <option value="Formation Initiale">Formation Initiale</option>
                  <option value="Formation Continue">Formation Continue</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Durée (Années)</label>
                <input 
                  type="number" min="1" max="7" required 
                  value={formData.duration_years} 
                  onChange={e => setFormData({...formData, duration_years: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm" 
                />
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
