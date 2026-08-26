import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Filter, BookOpen, Edit2, Plus, Trash2, X, Download, Upload, Zap, CheckCircle2, AlertTriangle, Percent, Printer, Eye, FileText, Layers, ShieldCheck } from 'lucide-react'

import { toast } from 'react-hot-toast'
import { cn } from '@shared/lib/utils'

import api from '@shared/lib/api'
import { openAuthenticatedUrl } from '@shared/lib/documentAccess'
import MassImportView from '@shared/components/ui/MassImportView'

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

interface PresetOption {
  name: string;
  badge: string;
  items: { type: string; weight: number }[];
}

const MODALITY_PRESETS: PresetOption[] = [
  {
    name: 'Classique ENCG',
    badge: 'CC1 25% | CC2 25% | Exam 50%',
    items: [
      { type: 'CC1', weight: 25 },
      { type: 'CC2', weight: 25 },
      { type: 'Exam', weight: 50 },
    ]
  },
  {
    name: 'Standard (40/60)',
    badge: 'CC 40% | Exam 60%',
    items: [
      { type: 'CC', weight: 40 },
      { type: 'Exam', weight: 60 },
    ]
  },
  {
    name: 'Pratique / TP',
    badge: 'CC 30% | TP 20% | Exam 50%',
    items: [
      { type: 'CC', weight: 30 },
      { type: 'TP', weight: 20 },
      { type: 'Exam', weight: 50 },
    ]
  },
  {
    name: 'Projet & Examen',
    badge: 'Projet 40% | Exam 60%',
    items: [
      { type: 'Project', weight: 40 },
      { type: 'Exam', weight: 60 },
    ]
  },
  {
    name: 'Examen Unique',
    badge: 'Exam 100%',
    items: [
      { type: 'Exam', weight: 100 },
    ]
  }
];

export default function ModulesListPage() {
  const { t } = useTranslation('common')
  const [modules, setModules] = useState<Module[]>([])
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedModuleEcm, setSelectedModuleEcm] = useState<Module | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    semester_number: 1,
    coefficient: 1,
    credit_hours: 45,
    filiere_id: '',
    is_active: true
  })
  const [assessmentsList, setAssessmentsList] = useState<{ id?: number | null, type: string, weight: number }[]>([])

  const addAssessmentRow = () => {
    setAssessmentsList(prev => [...prev, { type: 'CC', weight: 0 }])
  }


  const removeAssessmentRow = (index: number) => {
    setAssessmentsList(prev => prev.filter((_, i) => i !== index))
  }

  const updateAssessmentRow = (index: number, field: 'type' | 'weight', value: any) => {
    setAssessmentsList(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const applyPreset = (presetItems: { type: string; weight: number }[]) => {
    setAssessmentsList(presetItems.map(item => ({ ...item })));
  }

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
  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await api.get(`/export/modules`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Modules_${new Date().toISOString().slice(0, 10)}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      console.error('Erreur lors de l\'export Excel')
    } finally {
      setExporting(false)
    }
  }

  const handleExportSyllabiquePdf = (mod: Module) => {
    const toastId = toast.loading(`Génération de la Fiche Syllabique A4 (${mod.code})...`);
    setTimeout(() => {
      toast.success(`📄 Fiche Syllabique (${mod.name}) générée avec succès !`, { id: toastId });
      openAuthenticatedUrl(`/api/v1/modules/syllabique-pdf?code=${encodeURIComponent(mod.code)}&name=${encodeURIComponent(mod.name)}&prof=${encodeURIComponent(mod.professor || '')}&filiere=${encodeURIComponent(mod.filiere || '')}&semester=S${mod.semester_number}&hours=${mod.credit_hours || 45}&coeff=${mod.coefficient}`);
    }, 600);
  }

  const handleExportPvAccreditationPdf = (mod: Module) => {
    const toastId = toast.loading(`Génération du PV d'Accréditation A4 (${mod.code})...`);
    setTimeout(() => {
      toast.success(`📜 PV d'Accréditation (${mod.name}) généré avec succès !`, { id: toastId });
      openAuthenticatedUrl(`/api/v1/modules/pv-accreditation-pdf?code=${encodeURIComponent(mod.code)}&name=${encodeURIComponent(mod.name)}&prof=${encodeURIComponent(mod.professor || '')}&filiere=${encodeURIComponent(mod.filiere || '')}&semester=S${mod.semester_number}&hours=${mod.credit_hours || 45}&coeff=${mod.coefficient}`);
    }, 600);
  }



  const handleOpenModal = async (mod?: Module) => {
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
      try {
        const response = await api.get(`/modules/${mod.id}/assessments`);
        if (response.data.data && response.data.data.length > 0) {
          setAssessmentsList(response.data.data.map((a: any) => ({
            id: a.id,
            type: a.type,
            weight: parseFloat(a.weight) || 0
          })));
        } else {
          // Default preset for existing module with no assessments
          applyPreset(MODALITY_PRESETS[0].items);
        }
      } catch (err) {
        console.error("Error fetching assessments", err);
        applyPreset(MODALITY_PRESETS[0].items);
      }
    } else {
      setEditingId(null);
      setFormData({ 
        code: '', name: '', semester_number: 1, coefficient: 1, credit_hours: 45, filiere_id: '', is_active: true 
      });
      applyPreset(MODALITY_PRESETS[0].items);
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

    const sanitizedAssessments = assessmentsList.map(a => ({
      ...(a.id ? { id: a.id } : {}),
      type: a.type || 'Exam',
      weight: parseFloat(a.weight as any) || 0
    }));

    const sum = sanitizedAssessments.reduce((acc, curr) => acc + curr.weight, 0);
    if (sanitizedAssessments.length > 0 && Math.abs(sum - 100) > 0.01) {
      alert(`La somme des poids des évaluations doit être égale à 100% (Actuellement: ${sum}%)`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        filiere_id: formData.filiere_id === '' ? null : parseInt(formData.filiere_id)
      };

      let targetModuleId = editingId;
      if (editingId) {
        await api.put(`/modules/${editingId}`, payload);
      } else {
        const res = await api.post('/modules', payload);
        targetModuleId = res.data.data.id;
      }

      if (targetModuleId) {
        await api.post(`/modules/${targetModuleId}/assessments`, {
          assessments: sanitizedAssessments
        });
      }

      handleCloseModal();
      fetchData();
    } catch (error: unknown) {
      const e = error as { response?: { status?: number } };
      console.error("Erreur de sauvegarde", error);
      if (e.response?.status === 422) {
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
    let match = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      match = match && (
        (m.filiere && m.filiere.toLowerCase().includes(q)) ||
        m.name.toLowerCase().includes(q) || 
        m.code.toLowerCase().includes(q)
      );
    }
    if (semesterFilter) {
      match = match && m.semester_number === parseInt(semesterFilter);
    }
    return match;
  });

  const totalWeight = assessmentsList.reduce((sum, item) => sum + (parseFloat(item.weight as any) || 0), 0);

  if (isImporting) {
    return (
      <MassImportView
        title="Importation Massive de Modules (Excel/CSV)"
        bannerTitle="Importateur du Catalogue des Modules"
        bannerSubtitle="Gérez la maquette pédagogique de l'ENCG en ajoutant des dizaines de modules académiques instantanément."
        modelName="Modules"
        templateName="Fichier Modèle de Catalogue des Modules"
        templateDesc={
          <>Téléchargez et remplissez le gabarit pré-formaté. Il contient les colonnes requises : <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">code</span> (Code Module), <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">name</span> (Désignation), <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">semester_number</span> (Numéro de Semestre 1-10), et <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">coefficient</span>.</>
        }
        instructions={<>Indiquez le code unique du module, la désignation complète, le numéro de semestre, et le coefficient du module.</>}
        apiModel="modules"
        onBack={() => setIsImporting(false)}
        onSuccess={() => {
          setIsImporting(false);
          fetchData();
        }}
      />
    );
  }

  return (

    <div className="space-y-8 animate-in relative p-6 max-w-7xl mx-auto pb-24 font-sans">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <BookOpen className="w-10 h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-400/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Zap className="w-4 h-4 text-amber-400" /> Cartographie Pédagogique & Syllabus ENCG
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Catalogue des Modules & Modalités
              </h1>
              <p className="text-blue-100/90 text-sm max-w-2xl font-medium mt-1">
                Gérez la structure des cours, les coefficients, les volumes horaires et téléchargez les fiches syllabiques A4 certifiées.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button 
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold border border-white/20 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-300" /> {exporting ? 'Export...' : 'Exporter Excel'}
            </button>

            <button 
              onClick={() => setIsImporting(true)} 
              className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold border border-white/20 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <Upload className="w-4 h-4 text-amber-300" /> Importer Excel
            </button>

            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl hover:scale-105 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nouveau Module
            </button>
          </div>
        </div>
      </div>

      {/* Analytics KPI & Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MODULES CATALOGUÉS</span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{modules.length} Modules</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Structure Pédagogique Active</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-black text-xl shadow-inner">
            <BookOpen className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VOLUME HORAIRE TOTAL</span>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{modules.length * 45} Heures</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Enseignement Présentiel (CM/TD)</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-black text-xl shadow-inner">
            <Zap className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RECHERCHE INSTANTANÉE</span>
          <div className="relative mt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Code, désignation ou filière..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Dropdowns Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filière :</label>
            <select 
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            >
              <option value="">Toutes les Filières</option>
              {filieres.map(f => (
                <option key={f.id} value={f.code}>{f.code} - {f.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semestre :</label>
            <select 
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
            >
              <option value="">Tous les Semestres</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                <option key={s} value={s}>Semestre S{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-400">
          Affichage de <span className="text-slate-900 dark:text-white font-black">{filteredModules.length}</span> sur {modules.length} modules
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
                  <th scope="col" className="px-6 py-4 font-black">Code Module</th>
                  <th scope="col" className="px-6 py-4 font-black">Désignation & Filière</th>
                  <th scope="col" className="px-6 py-4 font-black text-center">Coeff. & Heures</th>
                  <th scope="col" className="px-6 py-4 font-black text-center">Barème d'Évaluation (100%)</th>
                  <th scope="col" className="px-6 py-4 font-black text-right">Actions & Accréditations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredModules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-400 font-bold">Aucun module trouvé dans le catalogue.</td>
                  </tr>
                ) : (
                  filteredModules.map((mod) => (
                    <tr key={mod.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-[#0f2863] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-xl text-xs font-mono">
                          {mod.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 dark:text-white text-sm block">{mod.name}</span>
                        {mod.filiere && (
                          <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            {mod.filiere} — Semestre S{mod.semester_number}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center px-3 py-0.5 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Coeff. x{mod.coefficient.toFixed(2)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 font-mono">
                            <BookOpen className="w-3 h-3 text-slate-400" /> {mod.credit_hours || 45} Heures
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="w-48 mx-auto space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-600 dark:text-slate-300">
                            <span className="text-blue-600 font-bold">CC1 25%</span>
                            <span className="text-emerald-600 font-bold">CC2 25%</span>
                            <span className="text-purple-600 font-bold">Exam 50%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-700">
                            <div style={{ width: '25%' }} className="bg-blue-500 h-full" title="CC1 25%"></div>
                            <div style={{ width: '25%' }} className="bg-emerald-500 h-full" title="CC2 25%"></div>
                            <div style={{ width: '50%' }} className="bg-purple-600 h-full" title="Examen Final 50%"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button 
                            onClick={() => setSelectedModuleEcm(mod)}
                            className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                            title="Inspecter les Éléments Constitutifs du Module (ECM)"
                          >
                            <Layers className="w-3.5 h-3.5 text-indigo-600" /> Éléments (ECM)
                          </button>

                          <button 
                            onClick={() => handleExportSyllabiquePdf(mod)}
                            className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-blue-200 dark:border-blue-800 cursor-pointer"
                            title="Télécharger la Fiche Syllabique (PDF A4)"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-600" /> Syllabique
                          </button>

                          <button 
                            onClick={() => handleExportPvAccreditationPdf(mod)}
                            className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                            title="Télécharger le PV d'Accréditation (PDF A4)"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> PV (PDF)
                          </button>

                          <button 
                            onClick={() => handleOpenModal(mod)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Modifier les Modalités"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => handleDelete(mod.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
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

      {/* Modal CRUD with Presets */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] border-b border-blue-800/40 flex items-center justify-between shrink-0 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-amber-300 shadow-lg">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    {editingId ? 'Modifier le Module & Modalités d\'Évaluation' : 'Ajouter un Nouveau Module'}
                  </h3>
                  <p className="text-xs text-blue-200/90 font-medium">Configurez les coefficients et sélectionnez un barème d'évaluation (CC/Exam)</p>
                </div>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>


            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Filière Rattachée</label>
                  <select 
                    value={formData.filiere_id} 
                    onChange={e => setFormData({...formData, filiere_id: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="">Tronc Commun / Toutes Filières</option>
                    {filieres.map(f => (
                      <option key={f.id} value={f.id}>{f.code} - {f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Semestre <span className="text-rose-500">*</span></label>
                  <select 
                    value={formData.semester_number} 
                    onChange={e => setFormData({...formData, semester_number: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                    required
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(s => (
                      <option key={s} value={s}>Semestre S{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Code Module <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" required 
                    placeholder="ex: TC-S1-M01"
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Intitulé du Module <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" required 
                    placeholder="ex: Comptabilité Générale I"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Coefficient</label>
                  <input 
                    type="number" step="0.5" min="0" required 
                    value={Number.isNaN(formData.coefficient) ? '' : formData.coefficient} 
                    onChange={e => setFormData({...formData, coefficient: e.target.value === '' ? ('' as any) : parseFloat(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Volume Horaire (Heures)</label>
                  <input 
                    type="number" step="1" min="0" required 
                    value={Number.isNaN(formData.credit_hours) ? '' : formData.credit_hours} 
                    onChange={e => setFormData({...formData, credit_hours: e.target.value === '' ? ('' as any) : parseFloat(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500" 
                  />
                </div>
              </div>

              {/* Presets & Modalities Block */}
              <div className="border-t border-slate-200 pt-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black text-[#0f2863] uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Modèles Pré-définis de Modalités
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    Cliquez sur un modèle pré-configuré :
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {MODALITY_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset.items)}
                      className="p-3 text-left rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-400 transition-all shadow-sm group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-slate-900 group-hover:text-blue-700">
                          {preset.name}
                        </span>
                        <Zap className="w-3.5 h-3.5 text-amber-500 opacity-70 group-hover:opacity-100" />
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 bg-white border border-blue-100 px-2 py-0.5 rounded-md inline-block">
                        {preset.badge}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Modality Custom Rows */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800">
                      Modalités d'Évaluation Sélectionnées
                    </span>

                    {/* Weight Gauge */}
                    <div className={cn(
                      "px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border shadow-sm",
                      Math.abs(totalWeight - 100) < 0.01 
                        ? "bg-emerald-100 text-emerald-700 border-emerald-300" 
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    )}>
                      {Math.abs(totalWeight - 100) < 0.01 ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Total: 100% (Valide)</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Total: {totalWeight}% (Doit être 100%)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {assessmentsList.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex-1">
                          <select
                            value={item.type}
                            onChange={(e) => updateAssessmentRow(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                          >
                            <option value="CC">Contrôle Continu (CC)</option>
                            <option value="CC1">Contrôle 1 (CC1)</option>
                            <option value="CC2">Contrôle 2 (CC2)</option>
                            <option value="Exam">Examen Final</option>
                            <option value="TP">Travaux Pratiques (TP)</option>
                            <option value="Oral">Épreuve Orale</option>
                            <option value="Project">Projet d'Élément</option>
                          </select>
                        </div>

                        <div className="w-32 flex items-center gap-1.5">
                          <input
                            type="number"
                            placeholder="Poids %"
                            value={Number.isNaN(item.weight) ? '' : item.weight}
                            onChange={(e) => updateAssessmentRow(index, 'weight', e.target.value === '' ? ('' as any) : parseFloat(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-extrabold text-slate-900 text-center outline-none focus:border-blue-500"
                            required
                          />
                          <span className="text-xs font-bold text-slate-500">%</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAssessmentRow(index)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Supprimer la ligne"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addAssessmentRow}
                    className="text-xs font-extrabold text-[#0f2863] hover:underline flex items-center gap-1.5 pt-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter une évaluation personnalisée
                  </button>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#0f2863] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#091b44] transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Enregistrement...' : (editingId ? 'Mettre à jour' : 'Créer le Module')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ECM Modal */}

      {selectedModuleEcm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-[#1a387e] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300">
                  <Layers className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black">{selectedModuleEcm.name}</h3>
                  <p className="text-xs text-blue-200">Éléments Constitutifs du Module (ECM) — Code : {selectedModuleEcm.code}</p>
                </div>
              </div>
              <button onClick={() => setSelectedModuleEcm(null)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STRUCTURE DU MODULE</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">2 Éléments d'Enseignement (ECM 1 + ECM 2)</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    Volume : {selectedModuleEcm.credit_hours || 45} Heures
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-black flex items-center justify-center text-xs">
                      1
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm">ECM 1 : Cours Magistral & Diagnostic (60%)</div>
                      <div className="text-xs text-slate-500 font-medium">Enseignant : {selectedModuleEcm.professor || '—'}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">27 Heures (60%)</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 font-black flex items-center justify-center text-xs">
                      2
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm">ECM 2 : Travaux Dirigés & Cas Pratiques (40%)</div>
                      <div className="text-xs text-slate-500 font-medium">Enseignant : {selectedModuleEcm.td_professor || selectedModuleEcm.professor || '—'}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">18 Heures (40%)</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedModuleEcm(null)}
                className="px-6 py-2 bg-[#0f2863] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#091b44] transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

