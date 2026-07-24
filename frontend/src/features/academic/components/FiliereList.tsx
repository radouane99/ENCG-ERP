import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Search, 
  Filter, 
  BookOpen, 
  Edit2, 
  Users, 
  Plus, 
  Trash2, 
  X, 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  Layers, 
  Sparkles, 
  GraduationCap,
  Award,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'

interface Filiere {
  id: number;
  code: string;
  name: string;
  type: string;
  duration_years: number;
  coordinator: string;
  responsable_id?: number | null;
  responsable_name?: string | null;
  students: number;
  active: boolean;
  groups_count?: number;
  modules_count?: number;
}

export default function FiliereList() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [professors, setProfessors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'grande_ecole',
    duration_years: 5,
    responsable_id: '',
    is_active: true
  })

  // Fetch filieres
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

  // Fetch users/professors for Chef de Filière dropdown
  const fetchProfessors = async () => {
    try {
      const res = await api.get('/users');
      const list = res.data.data || res.data || [];
      setProfessors(list.filter((u: any) => ['admin', 'professor', 'teacher', 'super-admin'].includes(u.role)));
    } catch (err) {
      console.error("Erreur chargement des enseignants", err);
    }
  }

  useEffect(() => {
    fetchFilieres();
    fetchProfessors();
  }, [])

  // Actions
  const handleOpenModal = (filiere?: Filiere) => {
    if (filiere) {
      setEditingId(filiere.id);
      setFormData({
        code: filiere.code,
        name: filiere.name,
        type: filiere.type || 'grande_ecole',
        duration_years: filiere.duration_years || 5,
        responsable_id: filiere.responsable_id ? String(filiere.responsable_id) : '',
        is_active: filiere.active
      });
    } else {
      setEditingId(null);
      setFormData({ code: '', name: '', type: 'grande_ecole', duration_years: 5, responsable_id: '', is_active: true });
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
      const payload = {
        ...formData,
        responsable_id: formData.responsable_id ? Number(formData.responsable_id) : null
      }
      if (editingId) {
        await api.put(`/filieres/${editingId}`, payload);
        toast.success(isRtl ? 'تم تحديث الشعبة بنجاح' : 'Filière mise à jour avec succès !');
      } else {
        await api.post('/filieres', payload);
        toast.success(isRtl ? 'تم إضافة الشعبة بنجاح' : 'Filière créée avec succès !');
      }
      handleCloseModal();
      fetchFilieres();
    } catch (error: any) {
      console.error("Erreur de sauvegarde", error);
      toast.error(error.response?.data?.message || "Une erreur est survenue lors de la sauvegarde.");
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette filière ?")) {
      try {
        await api.delete(`/filieres/${id}`);
        toast.success(isRtl ? 'تم حذف الشعبة' : 'Filière supprimée avec succès');
        fetchFilieres();
      } catch (error) {
        console.error("Erreur de suppression", error);
        toast.error("Erreur lors de la suppression");
      }
    }
  }

  const filteredFilieres = filieres.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.responsable_name && f.responsable_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const assignedChefCount = filieres.filter(f => f.responsable_name && f.responsable_name !== 'Non assigné').length

  return (
    <div className="space-y-8 animate-in relative p-6 max-w-7xl mx-auto pb-16">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <GraduationCap className="w-10 h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-400/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Cartographie Académique ENCG
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {isRtl ? 'الشعب والتخصصات الأكاديمية' : 'Programmes, Spécialités & Chefs de Filière'}
              </h1>
              <p className="text-blue-100/90 text-sm max-w-2xl font-medium mt-1">
                {isRtl ? 'إدارة الشعب، تعيين رؤساء الشعب (Chefs de Filière)، ومتابعة الأفواج والوحدات.' : 'Gérez la structure pédagogique des spécialités ENCG et assignez les Chefs de Filière responsables.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl hover:scale-105 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {isRtl ? 'إضافة شعبة جديدة' : 'Nouvelle Filière'}
            </button>
          </div>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FILIÈRES ENCG</span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{filieres.length}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Spécialités Ouvertes</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-black text-xl shadow-inner">
            <BookOpen className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CHEFS DE FILIÈRE ASSIGNÉS</span>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{assignedChefCount} / {filieres.length}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Responsables Nommés</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-black text-xl shadow-inner">
            <UserCheck className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RECHERCHE RAPIDE</span>
            <div className="relative mt-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filtrer par nom ou code..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0f2863]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredFilieres.map((filiere) => (
            <div key={filiere.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300 group">
              {/* Card Header (Deep Blue Gradient) */}
              <div className="bg-gradient-to-r from-[#0f2863] to-[#1e40af] p-6 relative">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-white/20 backdrop-blur-md text-white text-xs font-black px-3 py-1 rounded-xl tracking-widest uppercase border border-white/20">
                    {filiere.code}
                  </span>
                  <span className="text-blue-200/80 text-[10px] font-bold uppercase tracking-widest bg-blue-900/50 px-2.5 py-0.5 rounded-full border border-blue-700/50">
                    {filiere.duration_years ? `${filiere.duration_years} Ans` : 'Grande École'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mb-1.5 leading-tight">{filiere.name}</h3>
                <p className="text-blue-100/80 text-xs font-semibold uppercase tracking-wider">{filiere.type || 'grande_ecole'}</p>
              </div>

              {/* Chef de Filiere Designation Banner */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0", filiere.responsable_name && filiere.responsable_name !== 'Non assigné' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Chef de Filière</span>
                    <h5 className={cn("text-xs font-extrabold truncate", filiere.responsable_name && filiere.responsable_name !== 'Non assigné' ? "text-slate-900 dark:text-white" : "text-amber-600 font-bold")}>
                      {filiere.responsable_name || 'Non assigné'}
                    </h5>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenModal(filiere)}
                  className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-wider border border-indigo-200/60 dark:border-indigo-800 transition-all cursor-pointer shrink-0"
                >
                  {filiere.responsable_name && filiere.responsable_name !== 'Non assigné' ? 'Modifier' : 'Nommer'}
                </button>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800 py-4 bg-white dark:bg-slate-900">
                <div className="text-center px-4">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{filiere.groups_count ?? 1}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Groupes</div>
                </div>
                <div className="text-center px-4">
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{filiere.modules_count ?? 7}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Modules</div>
                </div>
              </div>

              {/* Actions Section */}
              <div className="flex divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <button 
                  onClick={() => handleOpenModal(filiere)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-indigo-600" /> Modifier
                </button>
                <button 
                  onClick={() => handleDelete(filiere.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal CRUD with Chef de Filiere Assignment */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden space-y-0">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" /> {editingId ? 'Modifier la filière' : 'Créer une Nouvelle Filière'}
              </h3>
              <button onClick={handleCloseModal} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Code Filière *</label>
                  <input 
                    type="text" required 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="Ex: GFC" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Durée (Années) *</label>
                  <input 
                    type="number" required min={1} max={7}
                    value={formData.duration_years} 
                    onChange={e => setFormData({...formData, duration_years: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nom de la filière *</label>
                <input 
                  type="text" required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Ex: Gestion Financière et Comptable" 
                />
              </div>

              {/* Chef de Filière Selection Field */}
              <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/50 space-y-2">
                <label className="block text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-600" /> Chef de Filière (Président du Jury)
                </label>
                <select 
                  value={formData.responsable_id} 
                  onChange={e => setFormData({...formData, responsable_id: e.target.value})}
                  className="w-full px-4 py-3 border border-amber-300 dark:border-amber-800 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                >
                  <option value="">-- Sélectionner le Chef de Filière --</option>
                  {professors.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      👨‍🏫 {p.name} ({p.email})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                  Le Chef de Filière sera automatiquement désigné comme Président du Jury de délibération.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Type de formation</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="grande_ecole">Grande École ENCG</option>
                  <option value="master_specialise">Master Spécialisé</option>
                  <option value="doctorat">Doctorat / Recherche</option>
                  <option value="formation_continue">Formation Continue</option>
                </select>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={handleCloseModal} className="px-5 py-3 text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer">
                  ANNULER
                </button>
                <button type="submit" className="px-6 py-3.5 text-xs font-black bg-gradient-to-r from-[#0f2863] to-[#1e40af] text-white hover:from-[#15347d] hover:to-[#254cb6] rounded-2xl shadow-xl transition-all cursor-pointer uppercase tracking-wider">
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
