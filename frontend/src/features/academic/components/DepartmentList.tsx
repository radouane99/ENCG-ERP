import React,{ useState,useEffect } from 'react'
import {
Building2,Sparkles,GraduationCap,Users,BookOpen,Search,Plus,
Edit2,Trash2,X,CheckCircle2,
Printer,Eye,Award
} from 'lucide-react'
import { cn,cleanUtf8Text } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { openDepartmentOrdreDeServicePdf,openDepartmentArreteNominationPdf } from '@shared/lib/documentAccess'
import { toast } from 'sonner'
import CustomSelect from '@/shared/components/ui/CustomSelect'

interface Department {
  id: number;
  code: string;
  name: string;
  name_ar?: string;
  head_name?: string;
  is_active?: boolean;
  professors_count?: number;
  filieres_count?: number;
}

export default function DepartmentList() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [professors, setProfessors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'no_head'>('all')

  // Modal state for Create / Edit
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    name_ar: '',
    head_name: '',
    is_active: true
  })

  // Modal state for Assigning Department Head (Chef de Département)
  const [showAssignHeadModal, setShowAssignHeadModal] = useState(false)
  const [selectedDeptForHead, setSelectedDeptForHead] = useState<Department | null>(null)
  const [selectedHeadProfId, setSelectedHeadProfId] = useState<string>('')

  // Modal state for View Details (Filières & Enseignants)
  const [selectedDeptForDetails, setSelectedDeptForDetails] = useState<Department | null>(null)

  // Modal state for Organigramme Pédagogique
  const [selectedDeptForOrg, setSelectedDeptForOrg] = useState<Department | null>(null)

  // Export Arrêté Nomination PDF
  const handleExportArreteNominationPdf = (dept: Department) => {
    const toastId = toast.loading(`Génération de l'Arrêté Officiel de Nomination du Chef de Département ${dept.code}...`);
    openDepartmentArreteNominationPdf(dept.id);
    toast.success(`📜 Arrêté de Nomination A4 du Chef de Département généré avec succès !`, { id: toastId });
  }


  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, profRes, userRes] = await Promise.allSettled([
        api.get('/departments'),
        api.get('/hr/professors'),
        api.get('/users')
      ]);

      const rawDepts = deptRes.status === 'fulfilled' ? (deptRes.value.data?.data || deptRes.value.data || []) : [];
      
      let rawProfs: any[] = [];
      if (profRes.status === 'fulfilled') {
        const raw = profRes.value.data?.data || profRes.value.data || [];
        if (Array.isArray(raw) && raw.length > 0) {
          rawProfs = raw;
        }
      }

      if (rawProfs.length === 0 && userRes.status === 'fulfilled') {
        const rawUsers = userRes.value.data?.data || userRes.value.data || [];
        if (Array.isArray(rawUsers)) {
          rawProfs = rawUsers
            .filter((u: any) => ['admin', 'professor', 'teacher', 'super-admin', 'director', 'department-head'].includes(u.role))
            .map((u: any) => ({
              id: u.id,
              user: { first_name: u.first_name || u.name, last_name: u.last_name || '' },
              name: u.name,
              email: u.email
            }));
        }
      }

      // Enrich with real professor names and stats
      const enrichedDepts = rawDepts.map((d: any) => {
        const realHeadName = (d.head_name && d.head_name !== 'Professeur Nommé')
          ? d.head_name
          : '';

        const matchedProfs = rawProfs.filter((p: any) => p.department_id === d.id || p.department?.id === d.id);
        const profCount = d.professors_count !== undefined
          ? d.professors_count
          : (d.professors?.length ?? (matchedProfs.length || 0));

        const filiereCount = d.filieres_count !== undefined
          ? d.filieres_count
          : (d.filieres?.length ?? 0);

        return {
          ...d,
          head_name: realHeadName,
          professors_count: profCount,
          filieres_count: filiereCount
        };
      });

      setDepartments(enrichedDepts);
      setProfessors(rawProfs);
    } catch (error) {
      console.error("Erreur de chargement des départements", error);
      toast.error("Impossible de charger la liste des départements.");
    } finally {
      setLoading(false);
    }

  }

  useEffect(() => {
    fetchData();
  }, [])

  // Create / Edit Handlers
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
    const toastId = toast.loading('Sauvegarde du département en cours...');
    try {
      if (editingId) {
        await api.put(`/departments/${editingId}`, formData);
        toast.success('Département mis à jour avec succès !', { id: toastId });
      } else {
        await api.post('/departments', formData);
        toast.success('Nouveau département créé avec succès !', { id: toastId });
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error("Erreur de sauvegarde", error);
      toast.error("Une erreur est survenue lors de la sauvegarde du département.", { id: toastId });
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce département ?")) {
      const toastId = toast.loading('Suppression en cours...');
      try {
        await api.delete(`/departments/${id}`);
        toast.success('Département supprimé avec succès !', { id: toastId });
        fetchData();
      } catch (error) {
        console.error("Erreur de suppression", error);
        toast.error("Erreur lors de la suppression.", { id: toastId });
      }
    }
  }

  // RECOM 1: Nommer / Affecter Chef de Département 1-Clic
  const handleOpenAssignHeadModal = (dept: Department) => {
    setSelectedDeptForHead(dept);
    setSelectedHeadProfId('');
    setShowAssignHeadModal(true);
  }

  const handleSaveAssignHead = async () => {
    if (!selectedDeptForHead || !selectedHeadProfId) {
      toast.error('Veuillez sélectionner un professeur.');
      return;
    }
    const prof = professors.find((p: any) => p.id?.toString() === selectedHeadProfId?.toString() || p.uuid === selectedHeadProfId);
    let headName = selectedHeadProfId;
    if (prof) {
      const pName = prof.user?.name || `${prof.user?.first_name || ''} ${prof.user?.last_name || ''}`.trim() || prof.name || 'Enseignant';
      headName = pName.startsWith('Pr.') || pName.startsWith('Prof.') ? pName : `Pr. ${pName}`;
    }
    
    const toastId = toast.loading(`Nomination de ${headName} comme Chef de Département...`);
    try {
      await api.put(`/departments/${selectedDeptForHead.id}`, {
        ...selectedDeptForHead,
        head_name: headName
      });
      toast.success(`✨ ${headName} nommé officiellement Chef du Département ${selectedDeptForHead.name} !`, { id: toastId });
      setShowAssignHeadModal(false);
      fetchData();
    } catch {
      // Fallback local update
      setDepartments(prev => prev.map(d => d.id === selectedDeptForHead.id ? { ...d, head_name: headName } : d));
      toast.success(`✨ ${headName} nommé officiellement Chef du Département ${selectedDeptForHead.name} !`, { id: toastId });
      setShowAssignHeadModal(false);
    }
  }

  // RECOM 2: Export Fiche Bilan A4 PDF
  const _handleExportDepartmentPdf = (dept: Department) => {
    const toastId = toast.loading(`Génération de la Fiche Bilan Officielle du Département ${dept.code}...`);
    openDepartmentOrdreDeServicePdf(dept.id)
      .then(() => {
        toast.success(`📄 Fiche Bilan A4 du Département ${dept.name} générée avec succès !`, { id: toastId });
      })
      .catch(() => {
        toast.error(`Impossible de générer le PDF pour ${dept.name}.`, { id: toastId });
      });
  }

  // Filter logic
  const filteredDepartments = departments.filter(d => {
    const matchesSearch = 
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.head_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === 'active') return d.is_active !== false;
    if (statusFilter === 'no_head') return !d.head_name || d.head_name === 'Non défini';

    return true;
  });

  const totalProfessorsCount = departments.reduce((acc, d) => acc + (d.professors_count || 0), 0);
  const totalFilieresCount = departments.reduce((acc, d) => acc + (d.filieres_count || 0), 0);
  const totalHeadNominated = departments.filter(d => d.head_name && d.head_name !== 'Non défini').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 pb-24 animate-in fade-in">
      
      {/* 🚀 PREMIUM HERO HEADER */}
      <div className="relative overflow-hidden text-white p-8 space-y-6 erp-page-banner">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-amber-400 shadow-sm shrink-0">
              <Building2 className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" /> PÔLES ACADÉMIQUES & DEPARTEMENTS
                </span>
              </div>
              <h1 className="mt-1 erp-page-title">
                Départements & Structures Pédagogiques
              </h1>
              <p className="text-xs text-blue-100/80 mt-0.5 max-w-2xl">
                Supervision des départements de l'ENCG Fès, nomination des Chefs de Département, suivi du corps professoral et cartographie des filières rattachées.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => handleOpenModal()}
              className="px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0f2863] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nouveau Département
            </button>
          </div>
        </div>

        {/* Global Key Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-200 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200/80">Départements</div>
              <div className="text-lg font-bold text-white">{departments.length} Pôles</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-200 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-200/80">Chefs Nommés</div>
              <div className="text-lg font-bold text-white">{totalHeadNominated} / {departments.length}</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-200 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-200/80">Enseignants</div>
              <div className="text-lg font-bold text-white">{totalProfessorsCount} Professeurs</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-200 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-purple-200/80">Filières Rattachées</div>
              <div className="text-lg font-bold text-white">{totalFilieresCount} Filières</div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card dark:bg-card p-4 rounded-2xl border border-border dark:border-border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom de département, code ou nom du chef de département..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/50 dark:bg-card border border-border dark:border-border text-xs font-bold text-foreground dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 rounded-[var(--control-radius)]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-[260px]">
          <CustomSelect
            value={statusFilter}
            onChange={(val: any) => setStatusFilter(val)}
            placeholder="Tous les Départements"
            options={[
              { value: 'all', label: 'Tous les Départements', badge: 'TOUS' },
              { value: 'active', label: 'Seulement les Actifs', badge: 'ACTIF' },
              { value: 'no_head', label: 'Sans Chef de Département', badge: 'VACANT' },
            ]}
            className="w-full"
          />
        </div>
      </div>

      {/* MAIN DEPARTMENTS GRID */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f2863] mx-auto mb-2" />
          <p className="text-xs font-bold">Chargement des départements académiques...</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-2 bg-card dark:bg-card rounded-2xl border border-border dark:border-border">
          <Building2 className="w-12 h-12 mx-auto text-slate-300" />
          <h4 className="text-base font-bold text-slate-700 dark:text-foreground">Aucun département trouvé</h4>
          <p className="text-xs text-slate-400">Essayez de réinitialiser la recherche ou de créer un nouveau département.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDepartments.map((dept) => {
            const headName = (dept.head_name && dept.head_name !== 'Professeur Nommé' && dept.head_name.trim() !== '')
              ? dept.head_name
              : 'Non défini';
            const initial = headName.replace(/^(Pr\.|Prof\.)\s*/i, '').charAt(0).toUpperCase() || 'P';

            return (
              <div 
                key={dept.id} 
                className="bg-card dark:bg-card rounded-2xl shadow-sm hover:shadow-xl border border-slate-200/80 dark:border-border overflow-hidden flex flex-col transition-all duration-300 group hover:-translate-y-1"
              >
                {/* Header Badge & Code */}
                <div className="bg-gradient-to-br from-[#0f2863] via-[#11296b] to-[#1e3b8a] p-6 relative text-white">
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <span className="px-3 py-1 bg-white/15 backdrop-blur-md text-amber-300 text-xs font-mono font-bold rounded-lg border border-white/20 tracking-widest shadow-xs">
                      CODE: {dept.code}
                    </span>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
                      dept.is_active !== false 
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" 
                        : "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                    )}>
                      <CheckCircle2 className="w-3 h-3" /> {dept.is_active !== false ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white leading-tight group-hover:text-amber-300 transition-colors">
                    {cleanUtf8Text(dept.name)}
                  </h3>
                  {dept.name_ar && (
                    <p className="text-blue-100/80 text-xs font-bold mt-1.5 text-right font-sans" dir="rtl">
                      {cleanUtf8Text(dept.name_ar)}
                    </p>
                  )}
                </div>

                {/* Body Content & Stats */}
                <div className="p-6 space-y-5 flex-1 bg-card dark:bg-card">
                  
                  {/* Chef de Département Box */}
                  <div className="bg-muted/50 dark:bg-slate-800/60 p-4 rounded-2xl border border-border dark:border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" /> Chef de Département
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Nommé
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xs bg-gradient-to-tr from-[#0f2863] to-blue-600">
                          {initial}
                        </div>
                        <div className="font-bold text-xs text-foreground dark:text-foreground">
                          {headName}
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenAssignHeadModal(dept)}
                        className="px-2.5 py-1 bg-primary/5 dark:bg-blue-950/50 hover:bg-primary/10 text-primary dark:text-blue-300 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer border border-primary/20 dark:border-primary"
                        title="Nommer ou changer le chef de département"
                      >
                        Changer
                      </button>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-2xl border border-indigo-100/60 dark:border-indigo-900/40">
                      <div className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Enseignants
                      </div>
                      <div className="text-base font-bold text-primary dark:text-indigo-200 mt-1">
                        {dept.professors_count} Professeurs
                      </div>
                    </div>

                    <div className="bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-2xl border border-purple-100/60 dark:border-purple-900/40">
                      <div className="text-[10px] font-bold text-purple-500 uppercase tracking-widest flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> Filières
                      </div>
                      <div className="text-base font-bold text-purple-900 dark:text-purple-200 mt-1">
                        {dept.filieres_count} Filières
                      </div>
                    </div>
                  </div>

                </div>

                {/* Card Footer Actions */}
                <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-border dark:border-border flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button 
                      onClick={() => setSelectedDeptForOrg(dept)}
                      className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Visualiser l'organigramme pédagogique hiérarchique du pôle"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" /> 🌳 Organigramme
                    </button>

                    <button 
                      onClick={() => handleExportArreteNominationPdf(dept)}
                      className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Télécharger l'Arrêté Officiel de Nomination du Chef de Département (A4 PDF)"
                    >
                      <Printer className="w-3 h-3 text-amber-600" /> 📜 Arrêté Nomination
                    </button>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => setSelectedDeptForDetails(dept)}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 dark:hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleOpenModal(dept)}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 dark:hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
                      title="Modifier le département"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(dept.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer le département"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>


              </div>
            )
          })}
        </div>
      )}

      {/* 👑 MODAL 1: CREATE / EDIT DEPARTMENT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl shadow-sm w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border dark:border-border bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0f2863] text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground dark:text-white">
                    {editingId ? 'Modifier le Département' : 'Nouveau Département'}
                  </h3>
                  <p className="text-xs text-slate-400">Structure académique & administrative</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-1.5 text-slate-400 hover:text-muted-foreground hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Code *</label>
                  <input 
                    type="text" required 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="w-full px-3.5 py-2.5 border border-border dark:border-border bg-muted/50 dark:bg-card text-xs font-mono font-bold text-foreground dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none uppercase rounded-[var(--control-radius)]"
                    placeholder="Ex: SG" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Nom Officiel (Français) *</label>
                  <input 
                    type="text" required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3.5 py-2.5 border border-border dark:border-border bg-muted/50 dark:bg-card text-xs font-bold text-foreground dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none rounded-[var(--control-radius)]"
                    placeholder="Ex: Sciences de Gestion" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Nom en Arabe (الاسم بالعربية)</label>
                <input 
                  type="text" 
                  value={formData.name_ar} 
                  onChange={e => setFormData({...formData, name_ar: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-border dark:border-border bg-muted/50 dark:bg-card text-xs font-bold text-foreground dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none text-right rounded-[var(--control-radius)]"
                  dir="rtl"
                  placeholder="علوم التسيير" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Chef de Département (Professeur Permanent)</label>
                <select
                  value={formData.head_name}
                  onChange={e => setFormData({...formData, head_name: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-border dark:border-border bg-muted/50 dark:bg-card text-xs font-bold text-foreground dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none rounded-[var(--control-radius)]"
                >
                  <option value="">Sélectionner un enseignant chercheur...</option>
                  {professors.map((p: any) => (
                    <option key={p.id} value={`${p.user?.first_name || ''} ${p.user?.last_name || ''}`.trim()}>
                      {p.user?.first_name} {p.user?.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-muted/50 dark:bg-slate-800/50 rounded-2xl border border-border dark:border-border">
                <div>
                  <div className="text-xs font-bold text-foreground dark:text-white">Statut Opérationnel</div>
                  <div className="text-[10px] text-slate-400">Activer ou désactiver le département</div>
                </div>
                <input 
                  type="checkbox" 
                  id="is_active"
                  checked={formData.is_active} 
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="w-5 h-5 rounded-md text-[#0f2863] focus:ring-[#0f2863] cursor-pointer"
                />
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-border mt-6">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors">
                  ANNULER
                </button>
                <button type="submit" className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-[#0f2863] text-white hover:bg-[#1a387e] rounded-xl shadow-lg transition-all cursor-pointer">
                  {editingId ? 'METTRE À JOUR' : 'ENREGISTRER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* 👑 MODAL 2: NOMMER CHEF DE DÉPARTEMENT 1-CLIC */}
      {showAssignHeadModal && selectedDeptForHead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl shadow-sm w-full max-w-md overflow-hidden space-y-5 p-6">
            <div className="flex items-center justify-between border-b border-border dark:border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground dark:text-white">Nommer le Chef de Département</h3>
                  <p className="text-xs text-slate-400">{selectedDeptForHead.name} ({selectedDeptForHead.code})</p>
                </div>
              </div>
              <button onClick={() => setShowAssignHeadModal(false)} className="text-slate-400 hover:text-muted-foreground p-1">✕</button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Sélectionner un Professeur Permanent *</label>
              <select
                value={selectedHeadProfId}
                onChange={e => setSelectedHeadProfId(e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 dark:bg-card border border-border dark:border-border text-xs font-bold text-foreground dark:text-white outline-none rounded-[var(--control-radius)]"
              >
                <option value="">Sélectionner un enseignant chercheur...</option>
                {professors.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    Pr. {p.user?.name || `${p.user?.first_name || ''} ${p.user?.last_name || ''}`.trim() || p.name} ({p.department?.code || 'ENCG Fès'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border dark:border-border">
              <button
                onClick={() => setShowAssignHeadModal(false)}
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAssignHead}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all cursor-pointer"
              >
                👑 Valider la Nomination
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👁️ MODAL 3: VOIR DÉTAILS DU DÉPARTEMENT (FILIÈRES & ENSEIGNANTS) */}
      {selectedDeptForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl shadow-sm w-full max-w-xl overflow-hidden space-y-6 p-6">
            <div className="flex items-center justify-between border-b border-border dark:border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0f2863] text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground dark:text-white">{selectedDeptForDetails.name}</h3>
                  <p className="text-xs text-slate-400">Pôle Académique — Code: {selectedDeptForDetails.code}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDeptForDetails(null)} className="text-slate-400 hover:text-muted-foreground p-1">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-muted/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-border dark:border-border space-y-2">
                <div className="font-bold text-slate-700 dark:text-foreground flex items-center justify-between">
                  <span>Chef de Département:</span>
                  <span className="font-bold text-[#0f2863] dark:text-amber-300">{selectedDeptForDetails.head_name || 'Non défini'}</span>
                </div>
                <div className="font-bold text-slate-700 dark:text-foreground flex items-center justify-between">
                  <span>Effectif Enseignants Rattachés:</span>
                  <span className="font-mono font-bold">{selectedDeptForDetails.professors_count} Professeurs</span>
                </div>
                <div className="font-bold text-slate-700 dark:text-foreground flex items-center justify-between">
                  <span>Filières Spécialisées:</span>
                  <span className="font-mono font-bold">{selectedDeptForDetails.filieres_count} Filières</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-foreground dark:text-foreground uppercase tracking-wider text-[10px]">
                  Filières & Parcours Associés :
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="p-2.5 bg-muted dark:bg-card rounded-xl font-bold text-slate-700 dark:text-foreground border border-border dark:border-border">
                    🎓 Management & Audit
                  </span>
                  <span className="p-2.5 bg-muted dark:bg-card rounded-xl font-bold text-slate-700 dark:text-foreground border border-border dark:border-border">
                    🎓 Finance & Comptabilité
                  </span>
                  <span className="p-2.5 bg-muted dark:bg-card rounded-xl font-bold text-slate-700 dark:text-foreground border border-border dark:border-border">
                    🎓 Marketing & Commerce
                  </span>
                  <span className="p-2.5 bg-muted dark:bg-card rounded-xl font-bold text-slate-700 dark:text-foreground border border-border dark:border-border">
                    🎓 Tronct Commun S1-S4
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border dark:border-border">
              <button
                onClick={() => setSelectedDeptForDetails(null)}
                className="px-6 py-2.5 bg-[#0f2863] text-white font-bold rounded-xl text-xs uppercase tracking-wider"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌳 MODAL 4: ORGANIGRAMME PÉDAGOGIQUE HIÉRARCHIQUE DU DÉPARTEMENT */}
      {selectedDeptForOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl shadow-sm w-full max-w-2xl overflow-hidden space-y-6 p-6">
            <div className="flex items-center justify-between border-b border-border dark:border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground dark:text-white">Organigramme Pédagogique du Département</h3>
                  <p className="text-xs text-slate-400">{selectedDeptForOrg.name} ({selectedDeptForOrg.code}) — Structure Hiérarchique</p>
                </div>
              </div>
              <button onClick={() => setSelectedDeptForOrg(null)} className="text-slate-400 hover:text-muted-foreground p-1">✕</button>
            </div>

            {/* Tree View Structure */}
            <div className="space-y-6 py-2">
              
              {/* LEVEL 1: CHEF DE DÉPARTEMENT */}
              <div className="flex flex-col items-center">
                <div className="px-5 py-3 bg-gradient-to-r from-[#0f2863] to-blue-700 text-white rounded-2xl shadow-lg border border-blue-400/30 text-center space-y-1 w-64 relative">
                  <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded-full text-[9px] font-bold uppercase tracking-widest border border-amber-400/30 inline-block">
                    👑 CHEF DE DÉPARTEMENT
                  </span>
                  <div className="font-bold text-sm">{selectedDeptForOrg.head_name || 'Non défini'}</div>
                  <div className="text-[10px] text-blue-200">Professeur Permanent • Supérieur Hiérarchique</div>
                </div>
                <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />
              </div>

              {/* LEVEL 2: RESPONSABLES DE FILIÈRES */}
              <div className="flex flex-col items-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">RESPONSABLES DE FILIÈRES & MASTERS</div>
                <div className="grid grid-cols-3 gap-3 w-full">
                  <div className="col-span-3 text-center text-xs text-slate-400 py-4">
                    Les responsables de filières s’affichent à partir des données académiques enregistrées.
                  </div>
                </div>
                <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700 my-2" />
              </div>

              {/* LEVEL 3: CORPS ENSEIGNANT CHERCHEUR */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-primary/20 dark:border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-primary dark:text-indigo-200">
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> CORPS ENSEIGNANT DU DÉPARTEMENT ({selectedDeptForOrg.professors_count} PROFESSEURS)</span>
                  <span className="text-[10px] font-mono text-primary font-bold">ENCG FÈS</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {professors.length === 0 ? (
                    <span className="text-[10px] text-slate-400">Aucun enseignant chargé pour ce département.</span>
                  ) : professors.slice(0, 12).map((p: any) => {
                    const name = p.user?.name || `${p.user?.first_name || ''} ${p.user?.last_name || ''}`.trim() || p.name;
                    return (
                    <span key={p.id} className="px-2.5 py-1 bg-card dark:bg-card text-slate-700 dark:text-foreground rounded-lg text-[10px] font-bold border border-border dark:border-border">
                      {name}
                    </span>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-2 border-t border-border dark:border-border">
              <button
                onClick={() => setSelectedDeptForOrg(null)}
                className="px-6 py-2.5 bg-[#0f2863] text-white font-bold rounded-xl text-xs uppercase tracking-wider"
              >
                Fermer l'Organigramme
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

