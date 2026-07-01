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
    <div className="space-y-8 animate-in relative p-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="italic text-blue-600">Programmes &amp; Filières</span>
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Gérez les filières qui structurent vos groupes et vos modules de cours.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-slate-50 px-4 py-2 rounded-full border border-slate-100 text-sm font-medium text-slate-600 flex items-center gap-2">
            Filières Actives: <span className="text-slate-900 font-bold">{filieres.length}</span>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0f2863] hover:bg-[#1a387e] text-white rounded-lg font-bold shadow-sm transition-colors text-sm uppercase tracking-wide"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Filière
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f2863]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filieres.map((filiere) => (
            <div key={filiere.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              {/* Card Header (Blue) */}
              <div className="bg-[#11296b] p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-md tracking-wider">
                    {filiere.code}
                  </span>
                  <BookOpen className="text-white/40 w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1.5 leading-tight">{filiere.name}</h3>
                <p className="text-blue-100/70 text-xs font-medium">{filiere.type || 'Formation Initiale'}</p>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-2 divide-x divide-slate-100 py-5 border-b border-slate-100 bg-white">
                <div className="text-center px-4">
                  <div className="text-2xl font-black text-slate-800">{Math.floor(Math.random() * 3) + 1}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Groupes</div>
                </div>
                <div className="text-center px-4">
                  <div className="text-2xl font-black text-slate-800">{Math.floor(Math.random() * 5) + 4}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Modules</div>
                </div>
              </div>

              {/* Actions Section */}
              <div className="flex divide-x divide-slate-100 bg-white">
                <button 
                  onClick={() => handleOpenModal(filiere)}
                  className="flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors uppercase tracking-wider"
                >
                  <Edit2 className="w-4 h-4" /> Modifier
                </button>
                <button 
                  onClick={() => handleDelete(filiere.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors uppercase tracking-wider"
                >
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Modifier la filière' : 'Nouvelle Filière'}</h3>
              <button onClick={handleCloseModal} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Code *</label>
                <input 
                  type="text" required 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
                  placeholder="Ex: INF" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nom de la filière *</label>
                <input 
                  type="text" required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
                  placeholder="Ex: Génie Informatique" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type de formation</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="Formation Initiale">Formation Initiale</option>
                  <option value="Formation Continue">Formation Continue</option>
                </select>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 mt-6">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                  ANNULER
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold bg-[#0f2863] text-white hover:bg-[#1a387e] rounded-xl shadow-sm transition-colors">
                  {editingId ? 'METTRE À JOUR' : 'ENREGISTRER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
