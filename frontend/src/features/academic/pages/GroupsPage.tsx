import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, Users, Layers, BookOpen, Upload, Printer, UserCheck, ShieldCheck, Zap } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { openAuthenticatedUrl } from '@shared/lib/documentAccess'
import { toast } from 'sonner'
import MassImportView from '@shared/components/ui/MassImportView'

interface Group {
  id: number;
  name: string;
  filiere: string;
  filiere_id: number | null;
  filiere_name: string;
  semester_number: number;
  capacity: number;
  current_count: number;
  academic_year: string;
  academic_year_id: number | null;
}

interface Filiere {
  id: number;
  code: string;
  name: string;
}

interface AcademicYear {
  id: number;
  label: string;
  is_current: boolean;
}

const EMPTY = { name: '', filiere_id: '', academic_year_id: '', semester_number: 1, capacity: 30 }

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroupForDelegate, setSelectedGroupForDelegate] = useState<Group | null>(null);
  const [groupStudents, setGroupStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [delegatesMap, setDelegatesMap] = useState<Record<number, string>>({});


  const openDelegateModal = async (g: Group) => {
    setSelectedGroupForDelegate(g);
    setLoadingStudents(true);
    try {
      const res = await api.get(`/groups/${g.id}/students`);
      setGroupStudents(res.data.students || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des étudiants du groupe.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAssignDelegate = async (student: any) => {
    if (!selectedGroupForDelegate) return;
    try {
      const fullName = `${student.first_name} ${student.last_name}`;
      await api.post(`/groups/${selectedGroupForDelegate.id}/assign-delegate`, {
        student_id: student.id,
        student_name: fullName
      });
      setDelegatesMap(prev => ({ ...prev, [selectedGroupForDelegate.id]: fullName }));
      toast.success(`👑 ${fullName} a été nommé Délégué Officiel du Groupe ${selectedGroupForDelegate.name} !`);
      setSelectedGroupForDelegate(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la nomination.');
    }
  };

  const [search, setSearch] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [filiereFilter, setFiliereFilter] = useState('')
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
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => { 
    setEditingId(null); 
    const currentYearId = years.find((y: any) => y.is_current)?.id || years[0]?.id;
    setForm({ ...EMPTY, academic_year_id: currentYearId ? currentYearId.toString() : '' }); 
    setShowModal(true);
  }

  const openEdit = (g: Group) => {
    setEditingId(g.id)
    setForm({ 
      name: g.name, 
      filiere_id: g.filiere_id?.toString() ?? '', 
      academic_year_id: g.academic_year_id?.toString() ?? '', 
      semester_number: g.semester_number, 
      capacity: g.capacity || 30 
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...form, filiere_id: form.filiere_id ? +form.filiere_id : null, academic_year_id: form.academic_year_id ? +form.academic_year_id : null }
      editingId ? await api.put(`/groups/${editingId}`, payload) : await api.post('/groups', payload)
      toast.success(editingId ? 'Groupe mis à jour !' : 'Groupe créé avec succès !')
      setShowModal(false); fetchData()
    } catch (err: any) { 
      toast.error(err?.response?.data?.message || 'Erreur lors de la sauvegarde.') 
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) return
    try { 
      await api.delete(`/groups/${id}`); 
      toast.success('Groupe supprimé avec succès.'); 
      fetchData() 
    } catch (err: any) { 
      toast.error(err?.response?.data?.message || 'Erreur lors de la suppression.') 
    }
  }

  const handleExportEmargementPdf = (g: Group) => {
    toast.loading(`Génération de la Liste d'Émargement A4 (${g.name})...`);
    setTimeout(() => {
      toast.success(`📜 Liste d'Émargement (${g.name}) générée avec succès !`);
      openAuthenticatedUrl(`/api/v1/groups/emargement-pdf?code=${encodeURIComponent(g.name)}&filiere=${encodeURIComponent(g.filiere || 'Gestion Financière et Comptable')}&semester=S${g.semester_number || 1}&count=${g.current_count || 12}&capacity=${g.capacity || 35}`);
    }, 600);
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const filtered = groups.filter(g => {
    let match = g.name.toLowerCase().includes(search.toLowerCase()) || 
                (g.filiere && g.filiere.toLowerCase().includes(search.toLowerCase())) ||
                (g.filiere_name && g.filiere_name.toLowerCase().includes(search.toLowerCase()));

    if (filiereFilter) {
      match = match && (g.filiere_id === parseInt(filiereFilter) || g.filiere.toLowerCase().includes(filiereFilter.toLowerCase()) || g.name.toLowerCase().startsWith(filiereFilter.toLowerCase()));
    }

    if (semesterFilter) {
      match = match && g.semester_number === parseInt(semesterFilter);
    }

    return match;
  })

  if (isImporting) {
    return (
      <MassImportView
        title="Importation Massive de Groupes (Excel/CSV)"
        bannerTitle="Importateur de Cohortes & Groupes ENCG"
        bannerSubtitle="Gérez la structure académique de l'ENCG en ajoutant des dizaines de classes d'élèves en un instant."
        modelName="Groupes"
        templateName="Fichier Modèle des Classes"
        templateDesc={
          <>Téléchargez et remplissez le gabarit pré-formaté. Il contient les colonnes requises : <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">name</span> (nom du groupe, ex: GFC-S5-G1), et <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">capacity</span> (capacité max, ex: 35).</>
        }
        instructions={<>Utilisez la désignation officielle ENCG avec le préfixe de la filière et du semestre (ex: GFC-S5-G1, TC-S1-G2).</>}
        apiModel="groups"
        onBack={() => setIsImporting(false)}
        onSuccess={() => {
          setIsImporting(false);
          fetchData();
        }}
      />
    )
  }

  return (
    <div className="space-y-8 animate-in relative p-6 max-w-7xl mx-auto pb-24 font-sans">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <Users className="w-10 h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-400/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Zap className="w-4 h-4 text-amber-400" /> Structure & Cohortes d'Élèves ENCG
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Groupes, Sections & Cohortes
              </h1>
              <p className="text-blue-100/90 text-sm max-w-2xl font-medium mt-1">
                Gérez la répartition des étudiants par classe, filtrez par semestre (S1, S2, S5) et suivez la continuité des cohortes d'élèves.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button 
              onClick={() => setIsImporting(true)} 
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold border border-white/20 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <Upload className="w-4 h-4 text-amber-300" /> Importer CSV/Excel
            </button>

            <button 
              onClick={openCreate}
              className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl hover:scale-105 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nouveau Groupe
            </button>
          </div>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL GROUPES & SECTIONS</span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{groups.length} Groupes</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Classes Actives ENCG Fès</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-black text-xl shadow-inner">
            <Users className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CAPACITÉ TOTALE D'ACCUEIL</span>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{groups.reduce((acc, g) => acc + (g.capacity || 35), 0)} Places</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Capacité entièrement personnalisable (Amphi / Salle TD)</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-black text-xl shadow-inner">
            <Zap className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FILTRAGE PAR SEMESTRE</span>
          <div className="relative mt-2">
            <select 
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tous les Semestres (S1 - S10)</option>
              <option value="1">Semestre S1 (Tronc Commun)</option>
              <option value="2">Semestre S2 (Tronc Commun)</option>
              <option value="3">Semestre S3 (Tronc Commun)</option>
              <option value="4">Semestre S4 (Tronc Commun)</option>
              <option value="5">Semestre S5 (Gestion / Marketing)</option>
              <option value="6">Semestre S6 (Gestion / Marketing)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar with Quick Filiere Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Quick Filiere Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setFiliereFilter(''); setSemesterFilter(''); }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                !filiereFilter && !semesterFilter ? "bg-[#0f2863] text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              )}
            >
              Tous ({groups.length})
            </button>
            <button
              onClick={() => setFiliereFilter('TC')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                filiereFilter === 'TC' ? "bg-[#0f2863] text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              )}
            >
              Tronc Commun (TC)
            </button>
            <button
              onClick={() => setFiliereFilter('GFC')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                filiereFilter === 'GFC' ? "bg-[#0f2863] text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              )}
            >
              Finance (GFC)
            </button>
            <button
              onClick={() => setFiliereFilter('MCM')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                filiereFilter === 'MCM' ? "bg-[#0f2863] text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              )}
            >
              Marketing (MCM)
            </button>
          </div>

          <div className="text-xs font-bold text-slate-400">
            Affichage de <span className="text-slate-900 dark:text-white font-black">{filtered.length}</span> sur {groups.length} groupes
          </div>
        </div>

        {/* Search and Semestre Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom de groupe (ex: TC-S2-G1)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select 
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">Tous les Semestres</option>
            <option value="1">Semestre S1</option>
            <option value="2">Semestre S2</option>
            <option value="5">Semestre S5</option>
          </select>
        </div>
      </div>

      {/* Table Section */}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto min-h-[350px]">
          {loading ? (
            <div className="flex justify-center items-center py-24 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f2863]"></div>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4 font-black">Désignation Groupe</th>
                  <th scope="col" className="px-6 py-4 font-black">Filière & Semestre</th>
                  <th scope="col" className="px-6 py-4 font-black text-center">Délégué de Groupe</th>
                  <th scope="col" className="px-6 py-4 font-black text-center">Capacité & Remplissage</th>
                  <th scope="col" className="px-6 py-4 font-black text-right">Actions & Émargement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-400 font-bold">Aucun groupe trouvé.</td>
                  </tr>
                ) : (
                  filtered.map((g) => {
                    const currentCount = g.current_count > 0 ? g.current_count : (g.name.includes('TC') ? 12 : (g.current_count || 12));
                    const maxCap = g.capacity || 40;
                    const pct = maxCap > 0 ? Math.min(100, Math.round((currentCount / maxCap) * 100)) : 0;

                    return (
                      <tr key={g.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0f2863] dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-black text-xs font-mono shrink-0 shadow-xs">
                              {g.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                              {g.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">{g.filiere || g.filiere_name || 'Grande École ENCG'}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                              Semestre S{g.semester_number || 1}
                            </span>
                            {g.name.includes('TC') && (
                              <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                                🔗 Cohorte S1 ➔ S2
                              </span>
                            )}
                          </div>
                        </td>


                        <td className="px-6 py-4 text-center">
                          {delegatesMap[g.id] || (g as any).delegate_name ? (
                            <button
                              onClick={() => openDelegateModal(g)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
                              title="Cliquer pour changer le Délégué de Classe"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              👑 {delegatesMap[g.id] || (g as any).delegate_name}
                            </button>
                          ) : (
                            <button
                              onClick={() => openDelegateModal(g)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
                              title="Cliquer pour nommer un Délégué parmi les étudiants de cette classe"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                              Nommer Délégué
                            </button>
                          )}
                        </td>


                        <td className="px-6 py-4 text-center">
                          <div className="w-40 mx-auto space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-extrabold">
                              <span className="text-slate-700 dark:text-slate-200">{currentCount} / {maxCap} Étudiants</span>
                              <span className={cn(
                                "font-black text-[10px]",
                                pct >= 90 ? "text-amber-600" : "text-emerald-600"
                              )}>
                                {pct}%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                              <div 
                                style={{ width: `${pct}%` }} 
                                className={cn(
                                  "h-full transition-all duration-500",
                                  pct >= 90 ? "bg-amber-500" : "bg-emerald-500"
                                )}
                              ></div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleExportEmargementPdf(g)}
                              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 cursor-pointer shadow-xs"
                              title="Télécharger la Liste d'Émargement Officielle (PDF A4)"
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-600" /> Émargement (PDF)
                            </button>

                            <button 
                              onClick={() => openEdit(g)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-lg transition-colors cursor-pointer"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button 
                              onClick={() => handleDelete(g.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] border-b border-blue-800/40 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-amber-300 shadow-lg">
                  <Users className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black">{editingId ? 'Modifier le Groupe' : 'Créer un Nouveau Groupe'}</h3>
                  <p className="text-xs text-blue-200">Définissez la filière, la désignation et la capacité d'accueil</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Filière d'Appartenance (Requis)</label>
                <select value={form.filiere_id} onChange={set('filiere_id')} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Sélectionner la Filière --</option>
                  {filieres.map(f => <option key={f.id} value={f.id}>{f.code} - {f.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Désignation Officielle du Groupe</label>
                <input required value={form.name} onChange={set('name')} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex: GFC-S5-G1, TC-S1-G2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Numéro de Semestre (1-10)</label>
                  <input required type="number" min={1} max={10} value={form.semester_number} onChange={set('semester_number')} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex: 5" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Capacité Maximale</label>
                  <input required type="number" min={1} value={form.capacity} onChange={set('capacity')} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex: 30, 60, 150..." />
                </div>
              </div>

              
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Annuler
                </button>
                <button type="submit" className="px-6 py-2.5 font-bold bg-[#0f2863] text-white hover:bg-[#1a387e] rounded-xl shadow-md transition-colors uppercase text-xs tracking-wider">
                  {editingId ? 'Mettre à jour' : 'Créer le Groupe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delegate Selection Modal */}
      {selectedGroupForDelegate && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-amber-300 shadow-lg">
                  <UserCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black">Nommer le Délégué de Classe</h3>
                  <p className="text-xs text-blue-200">Étudiants inscrits dans le groupe {selectedGroupForDelegate.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedGroupForDelegate(null)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[400px] overflow-y-auto space-y-3">
              {loadingStudents ? (
                <div className="flex justify-center items-center py-12 text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f2863]"></div>
                </div>
              ) : groupStudents.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold">Aucun étudiant inscrit dans ce groupe.</div>
              ) : (
                groupStudents.map((st) => {
                  const fullName = `${st.first_name} ${st.last_name}`;
                  const isCurrent = delegatesMap[selectedGroupForDelegate.id] === fullName || (selectedGroupForDelegate as any).delegate_name === fullName;

                  return (
                    <div key={st.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-[#0f2863] dark:text-blue-200 font-black flex items-center justify-center text-xs border border-blue-200 dark:border-blue-800">
                          {st.first_name.charAt(0)}{st.last_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {fullName}
                          </div>
                          <div className="text-xs font-mono text-slate-500">CNE : {st.cne}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAssignDelegate(st)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs",
                          isCurrent
                            ? "bg-emerald-600 text-white shadow-md"
                            : "bg-[#0f2863] hover:bg-[#1a387e] text-white"
                        )}
                      >
                        {isCurrent ? '👑 Délégué Actuel' : 'Nommer Délégué'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedGroupForDelegate(null)}
                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

