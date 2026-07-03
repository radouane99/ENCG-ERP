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
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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
    if (isSubmitting) return;
    setIsSubmitting(true);
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
    } catch (error: any) {
      console.error("Erreur de sauvegarde", error);
      if (error.response?.status === 422) {
        alert("Erreur de validation: Le code module existe déjà ou les données sont invalides.");
      } else {
        alert("Une erreur est survenue lors de la sauvegarde.");
      }
    } finally {
      setIsSubmitting(false);
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

  const filteredModules = modules.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.filiere && m.filiere.toLowerCase() === q) ||
      m.name.toLowerCase().includes(q) || 
      m.code.toLowerCase().includes(q)
    );
  })

  return (
    <div className="space-y-6 animate-in relative p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2863] italic">Catalogue des Modules</h1>
            <p className="text-slate-500 mt-1 text-sm">Gestion des modules académiques, des coefficients et des charges de cours de l'UPF.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ExcelActions model="modules" label="CSV/EXCEL" onImportSuccess={fetchData} />
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0f2863] text-white rounded-lg font-bold shadow-sm hover:bg-[#1a387e] transition-colors text-sm uppercase tracking-wide"
          >
            <Plus className="w-4 h-4" />
            Ajouter Module
          </button>
        </div>
      </div>

      {/* Filter Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Filtrer par filière :</label>
        <select 
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 min-w-[250px] outline-none focus:border-blue-500 transition-colors"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        >
          <option value="">-- Toutes les Filières --</option>
          {filieres.map(f => (
            <option key={f.id} value={f.code}>{f.code} - {f.name}</option>
          ))}
        </select>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center py-20 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f2863]"></div>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-4 font-bold tracking-wider">Code Module</th>
                  <th scope="col" className="px-6 py-4 font-bold tracking-wider">Désignation</th>
                  <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Coefficient</th>
                  <th scope="col" className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredModules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-400 font-medium">Aucun module trouvé.</td>
                  </tr>
                ) : (
                  filteredModules.map((mod) => (
                    <tr key={mod.id} className="bg-white hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-md text-xs">{mod.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-700">{mod.name}</span>
                        {mod.filiere && <span className="block mt-1 text-xs text-slate-400">{mod.filiere}</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                          x{mod.coefficient.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(mod)}
                            className="text-amber-500 hover:text-amber-600 transition-colors" 
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(mod.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-2xl text-[#0f2863]">{editingId ? 'Edit Module' : 'Add New Module'}</h3>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Filière (Requis)</label>
                  <select 
                    value={formData.filiere_id} 
                    onChange={e => setFormData({...formData, filiere_id: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                    required
                  >
                    <option value="">-- Sélectionner la Filière --</option>
                    {filieres.map(f => (
                      <option key={f.id} value={f.id}>{f.code} - {f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Semestre (Requis)</label>
                  <select 
                    value={formData.semester_number} 
                    onChange={e => setFormData({...formData, semester_number: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 text-slate-700"
                    required
                  >
                    <option value={0}>-- Sélectionner le Semestre --</option>
                    {[1,2,3,4,5,6,7,8,9,10].map(s => (
                      <option key={s} value={s}>Semestre {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Module Code</label>
                  <input 
                    type="text" required 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 text-slate-700" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Module Name</label>
                  <input 
                    type="text" required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 text-slate-700" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Coefficient</label>
                  <input 
                    type="number" step="0.5" min="0" required 
                    value={formData.coefficient} 
                    onChange={e => setFormData({...formData, coefficient: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 text-slate-700" 
                  />
                </div>
                
                <div className="flex items-center justify-end pt-6">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-6 py-3 font-bold bg-[#0f2863] text-white hover:bg-[#1a387e] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md transition-colors uppercase text-sm tracking-wide"
                  >
                    {isSubmitting ? 'EN COURS...' : (editingId ? 'UPDATE MODULE' : 'CREATE MODULE')}
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
