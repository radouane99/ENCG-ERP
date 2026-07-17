import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Filter, MoreHorizontal, BookOpen, Edit2, Users, Plus, Trash2, X, GraduationCap, Download, Upload } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
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
        setAssessmentsList(response.data.data.map((a: any) => ({
          id: a.id,
          type: a.type,
          weight: a.weight
        })));
      } catch (err) {
        console.error("Error fetching assessments", err);
        setAssessmentsList([{ type: 'Exam', weight: 100 }]);
      }
    } else {
      setEditingId(null);
      setFormData({ 
        code: '', name: '', semester_number: 1, coefficient: 1, credit_hours: 45, filiere_id: '', is_active: true 
      });
      setAssessmentsList([{ type: 'Exam', weight: 100 }]);
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

    const sum = assessmentsList.reduce((acc, curr) => acc + curr.weight, 0);
    if (assessmentsList.length > 0 && Math.abs(sum - 100) > 0.01) {
      alert(`La somme des poids des évaluations doit être égale à 100% (Actuellement: ${sum}%)`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert filiere_id to null if empty string
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

      // Sync assessments/modalities
      if (targetModuleId) {
        await api.post(`/modules/${targetModuleId}/assessments`, {
          assessments: assessmentsList
        });
      }

      handleCloseModal();
      fetchData(); // Refresh list
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
        (m.filiere && m.filiere.toLowerCase() === q) ||
        m.name.toLowerCase().includes(q) || 
        m.code.toLowerCase().includes(q)
      );
    }
    if (semesterFilter) {
      match = match && m.semester_number === parseInt(semesterFilter);
    }
    return match;
  })

  if (isImporting) {
    return (
      <MassImportView
        title="Importation Massive de Modules (Excel/CSV)"
        bannerTitle="Importateur de Modules"
        bannerSubtitle="Gérez le catalogue académique de l'UPF en ajoutant l'ensemble de vos modules en un instant."
        modelName="Modules"
        templateName="Fichier Modèle des Modules"
        templateDesc={
          <>Téléchargez et remplissez le gabarit pré-formaté. Il contient les colonnes requises : <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">Code Module</span>, <span className="text-red-500 font-mono text-xs bg-red-50 px-1 py-0.5 rounded">Intitule du Module</span>, etc.</>
        }
        instructions={<>Assurez-vous que l'ID Filiere correspond exactement à un ID existant dans la plateforme, ou laissez-le vide si non applicable.</>}
        apiModel="modules"
        onBack={() => setIsImporting(false)}
        onSuccess={() => {
          fetchData()
        }}
      />
    )
  }

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
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold shadow-sm hover:bg-slate-50 transition-colors text-sm uppercase tracking-wide disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {exporting ? 'Export...' : 'Exporter Excel'}
          </button>
          <button 
            onClick={() => setIsImporting(true)} 
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold shadow-sm hover:bg-slate-50 transition-colors text-sm uppercase tracking-wide"
          >
            <Upload className="w-4 h-4" /> Importer CSV/Excel
          </button>
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Filtrer par filière :</label>
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 min-w-[200px] outline-none focus:border-blue-500 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          >
          <option value="">-- Toutes les Filières --</option>
          {filieres.map(f => (
            <option key={f.id} value={f.code}>{f.code} - {f.name}</option>
          ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Semestre :</label>
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 min-w-[150px] outline-none focus:border-blue-500 transition-colors"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
          >
            <option value="">-- Tous --</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
              <option key={s} value={s}>Semestre {s}</option>
            ))}
          </select>
        </div>
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
                  <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Heures de Crédit</th>
                  <th scope="col" className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredModules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">Aucun module trouvé.</td>
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
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                          <BookOpen className="w-3.5 h-3.5" />
                          {mod.credit_hours || 0}h
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
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Heures de Crédit</label>
                  <input 
                    type="number" step="1" min="0" required 
                    value={formData.credit_hours} 
                    onChange={e => setFormData({...formData, credit_hours: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 text-slate-700" 
                  />
                </div>
                
                {/* Modality block */}
                <div className="border-t border-slate-100 pt-6">
                  <label className="block text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">Modalités d'évaluation (Requis - Total: 100%)</label>
                  <div className="space-y-3">
                    {assessmentsList.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-1">
                          <select
                            value={item.type}
                            onChange={(e) => updateAssessmentRow(index, 'type', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none bg-white"
                          >
                            <option value="CC">Contrôle Continu</option>
                            <option value="CC1">CC1</option>
                            <option value="CC2">CC2</option>
                            <option value="Exam">Examen</option>
                            <option value="TP">TP</option>
                            <option value="Oral">Oral</option>
                            <option value="Project">Projet</option>
                          </select>
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            placeholder="Poids %"
                            value={item.weight}
                            onChange={(e) => updateAssessmentRow(index, 'weight', parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 text-center outline-none"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAssessmentRow(index)}
                          className="p-2.5 text-red-500 bg-red-50/50 hover:bg-red-50 rounded-lg border border-transparent transition-colors text-xs"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addAssessmentRow}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 pt-1"
                    >
                      ➕ Ajouter une évaluation
                    </button>
                  </div>
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
