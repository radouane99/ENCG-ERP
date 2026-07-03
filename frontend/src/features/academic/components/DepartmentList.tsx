import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Filter, MoreHorizontal, BookOpen, Edit2, Users, Plus, Trash2, X, Building2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'

interface Department {
  id: number;
  code: string;
  name: string;
  name_ar: string;
  head_name: string;
  is_active: boolean;
}

export default function DepartmentList() {
  const { t } = useTranslation('common')
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    name_ar: '',
    head_name: '',
    is_active: true
  })

  // Fetch data
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      setDepartments(res.data.data || []);
    } catch (error) {
      console.error("Erreur de chargement des départements", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDepartments();
  }, [])

  // Actions
  const handleOpenModal = (dept?: Department) => {
    if (dept) {
      setEditingId(dept.id);
      setFormData({
        code: dept.code || '',
        name: dept.name || '',
        name_ar: dept.name_ar || '',
        head_name: dept.head_name || '',
        is_active: dept.is_active !== undefined ? dept.is_active : true
      });
    } else {
      setEditingId(null);
      setFormData({ code: '', name: '', name_ar: '', head_name: '', is_active: true });
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
        await api.put(`/departments/${editingId}`, formData);
      } else {
        await api.post('/departments', formData);
      }
      handleCloseModal();
      fetchDepartments();
    } catch (error) {
      console.error("Erreur de sauvegarde", error);
      alert("Une erreur est survenue lors de la sauvegarde.");
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce département ?")) {
      try {
        await api.delete(`/departments/${id}`);
        fetchDepartments();
      } catch (error) {
        console.error("Erreur de suppression", error);
      }
    }
  }

  const filteredDepartments = departments.filter(d => 
    d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in relative p-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="italic text-blue-600">Départements</span>
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Gérez les départements académiques de votre établissement.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-slate-50 px-4 py-2 rounded-full border border-slate-100 text-sm font-medium text-slate-600 flex items-center gap-2">
            Départements: <span className="text-slate-900 font-bold">{departments.length}</span>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0f2863] hover:bg-[#1a387e] text-white rounded-lg font-bold shadow-sm transition-colors text-sm uppercase tracking-wide"
          >
            <Plus className="w-4 h-4" />
            Nouveau Département
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f2863]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDepartments.map((dept) => (
            <div key={dept.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              {/* Card Header (Blue) */}
              <div className="bg-[#11296b] p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-md tracking-wider">
                    {dept.code}
                  </span>
                  <Building2 className="text-white/40 w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1.5 leading-tight">{dept.name}</h3>
                <p className="text-blue-100/70 text-xs font-medium">{dept.name_ar || '—'}</p>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-2 divide-x divide-slate-100 py-5 border-b border-slate-100 bg-white">
                <div className="text-center px-4 col-span-2">
                  <div className="text-sm font-bold text-slate-800">{dept.head_name || 'Non défini'}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Chef de département</div>
                </div>
              </div>

              {/* Actions Section */}
              <div className="flex divide-x divide-slate-100 bg-white">
                <button 
                  onClick={() => handleOpenModal(dept)}
                  className="flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors uppercase tracking-wider"
                >
                  <Edit2 className="w-4 h-4" /> Modifier
                </button>
                <button 
                  onClick={() => handleDelete(dept.id)}
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
              <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Modifier le département' : 'Nouveau Département'}</h3>
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
                  placeholder="Ex: SG" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nom du département *</label>
                <input 
                  type="text" required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
                  placeholder="Ex: Sciences de Gestion" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nom en Arabe</label>
                <input 
                  type="text" 
                  value={formData.name_ar} 
                  onChange={e => setFormData({...formData, name_ar: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-right" 
                  dir="rtl"
                  placeholder="علوم التسيير" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chef de Département</label>
                <input 
                  type="text" 
                  value={formData.head_name} 
                  onChange={e => setFormData({...formData, head_name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
                  placeholder="Nom du chef" 
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="is_active"
                  checked={formData.is_active} 
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-slate-700">Département actif</label>
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
