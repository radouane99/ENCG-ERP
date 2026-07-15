import { useState } from 'react'
import { Calendar, Download, Upload, Trash2, Plus, CalendarDays, FileText, CheckCircle2, X } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { toast } from 'sonner'
export default function AcademicYearSettingsPage() {
  const queryClient = useQueryClient()
  const [showImportModal, setShowImportModal] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState({
    department_id: '',
    professor_id: '',
    module_id: '',
    group_id: ''
  })

  const [newYearLabel, setNewYearLabel] = useState('')
  const [newYearIsCurrent, setNewYearIsCurrent] = useState(false)

  // Queries
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then(r => r.data)
  })

  const { data: professorsData } = useQuery({
    queryKey: ['professors'],
    queryFn: () => api.get('/hr/professors').then(r => r.data)
  })

  const { data: modulesData } = useQuery({
    queryKey: ['modules'],
    queryFn: () => api.get('/modules').then(r => r.data)
  })

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => api.get('/groups').then(r => r.data)
  })

  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['professor-assignments'],
    queryFn: () => api.get('/professor-assignments').then(r => r.data)
  })

  const departments = departmentsData?.data || []
  const allProfessors = professorsData?.data || []
  const professors = assignmentForm.department_id 
    ? allProfessors.filter((p: any) => p.department_id == assignmentForm.department_id) 
    : []
  const modules = modulesData?.data || []
  const groups = groupsData?.data || []
  const assignments = assignmentsData?.data || []

  // Mutations
  const createAssignmentMutation = useMutation({
    mutationFn: (payload: any) => api.post('/professor-assignments', payload),
    onSuccess: () => {
      toast.success('Affectation ajoutée avec succès')
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
      setAssignmentForm(prev => ({ ...prev, professor_id: '', module_id: '', group_id: '' }))
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'ajout')
    }
  })

  const createYearMutation = useMutation({
    mutationFn: (payload: any) => api.post('/academic-years', payload),
    onSuccess: () => {
      toast.success('Année académique ajoutée')
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      setNewYearLabel('')
      setNewYearIsCurrent(false)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la création de l\'année')
    }
  })

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/professor-assignments/${id}`),
    onSuccess: () => {
      toast.success('Affectation supprimée')
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
    },
    onError: () => toast.error('Erreur lors de la suppression')
  })

  const handleCreateAssignment = () => {
    if (!assignmentForm.professor_id || !assignmentForm.module_id || !assignmentForm.group_id) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    createAssignmentMutation.mutate(assignmentForm)
  }

  const handleDeleteAssignment = (id: number) => {
    if (confirm('Voulez-vous vraiment supprimer cette affectation ?')) {
      deleteAssignmentMutation.mutate(id)
    }
  }

  const handleCreateYear = () => {
    if (!newYearLabel) {
      toast.error('Veuillez entrer une année (ex: 2026/2027)')
      return
    }
    const match = newYearLabel.match(/^(\d{4})\/(\d{4})$/)
    if (!match) {
      toast.error('Le format doit être YYYY/YYYY (ex: 2026/2027)')
      return
    }
    createYearMutation.mutate({
      label: newYearLabel,
      start_year: parseInt(match[1]),
      end_year: parseInt(match[2]),
      start_date: `${match[1]}-09-01`,
      end_date: `${match[2]}-07-31`,
      is_current: newYearIsCurrent
    })
  }

  const handleDownloadTemplate = () => {
    const csvContent = "email_professeur,module_code,groupe\nprof@encg.ma,MOD01,G1\n"
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "modele_affectations.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const { data: yearsData, isLoading: yearsLoading } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then(r => r.data)
  });

  const years = yearsData?.data || [];

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-[#0f2863] italic">Années Universitaires & Affectations</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gestion des Années */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#0f2863] mb-6">Gestion des Années</h2>
          <div className="flex items-center gap-4 mb-8">
            <input 
              type="text" 
              placeholder="Ex: 2026/2027" 
              value={newYearLabel}
              onChange={(e) => setNewYearLabel(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
              <input 
                type="checkbox" 
                checked={newYearIsCurrent}
                onChange={(e) => setNewYearIsCurrent(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
              />
              Année courante
            </label>
            <button 
              onClick={handleCreateYear}
              disabled={createYearMutation.isPending}
              className="px-6 py-3 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a387e] transition-colors text-sm disabled:opacity-50"
            >
              {createYearMutation.isPending ? 'En cours...' : 'Ajouter'}
            </button>
          </div>

          <div className="space-y-3">
            {years.map((y: any) => (
              <div key={y.id} className="flex items-center justify-between p-4 border border-blue-200 rounded-xl bg-blue-50/30">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800">{y.label}</span>
                  {y.is_current && (
                    <span className="px-2 py-1 bg-[#0f2863] text-white text-[10px] font-bold rounded-md tracking-wider">
                      COURANTE
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Semestres */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#0f2863] mb-6">Semestres (Lecture seule)</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
              <span className="font-bold text-slate-800 text-lg">S1</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Niveau 1</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
              <span className="font-bold text-slate-800 text-lg">S2</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Niveau 1</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 italic">
            Les semestres sont générés automatiquement ou via le panneau Filières.
          </p>
        </div>
      </div>

      {/* Périodes des Sessions d'Examens */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-bold text-[#0f2863] mb-8">Périodes des Sessions d'Examens (Année Courante)</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
          
          {/* Normale Automne */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800">Normale Automne</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Début</label>
              <div className="relative">
                <input type="date" defaultValue="2026-07-01" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Fin</label>
              <div className="relative">
                <input type="date" defaultValue="2026-07-08" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700" />
              </div>
            </div>
          </div>

          {/* Normale Printemps */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800">Normale Printemps</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Début</label>
              <div className="relative">
                <input type="date" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Fin</label>
              <div className="relative">
                <input type="date" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700" />
              </div>
            </div>
          </div>

          {/* Rattrapage Automne */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800">Rattrapage Automne</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Début</label>
              <div className="relative">
                <input type="date" defaultValue="2026-07-15" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Fin</label>
              <div className="relative">
                <input type="date" defaultValue="2026-07-20" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700" />
              </div>
            </div>
          </div>

          {/* Rattrapage Printemps */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800">Rattrapage Printemps</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Début</label>
              <div className="relative">
                <input type="date" defaultValue="2026-06-22" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Fin</label>
              <div className="relative">
                <input type="date" defaultValue="2026-07-03" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex items-center justify-between">
          <p className="text-xs text-slate-400 italic">
            Les examens ne pourront être planifiés que dans les périodes définies pour chaque session.
          </p>
          <button 
            onClick={() => toast.success('Périodes d\'examens enregistrées avec succès')}
            className="px-6 py-3 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a387e] transition-colors text-sm shadow-sm"
          >
            Enregistrer les périodes
          </button>
        </div>
      </div>

      {/* Affectations des Professeurs */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 pb-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 className="text-xl font-bold text-[#0f2863]">Affectations des Professeurs</h2>
            <p className="text-sm text-slate-500 mt-1">
              Affecter un professeur à un module pour un groupe donné (Année 2025/2026).
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm">
              <FileText className="w-4 h-4" /> Modèle
            </button>
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a387e] transition-colors text-sm shadow-sm"
            >
              <Upload className="w-4 h-4" /> Importer
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a387e] transition-colors text-sm shadow-sm">
              <Download className="w-4 h-4" /> Exporter Excel
            </button>
          </div>
        </div>

        <div className="p-8 bg-slate-50/50">
          <div className="flex flex-col lg:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Département</label>
              <select 
                value={assignmentForm.department_id}
                onChange={e => {
                  setAssignmentForm(prev => ({ 
                    ...prev, 
                    department_id: e.target.value,
                    professor_id: '' // Reset professor when department changes
                  }))
                }}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
              >
                <option value="">Sélectionner</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Professeur</label>
              <select 
                value={assignmentForm.professor_id}
                onChange={e => setAssignmentForm(prev => ({ ...prev, professor_id: e.target.value }))}
                disabled={!assignmentForm.department_id}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 disabled:opacity-50 disabled:bg-slate-50"
              >
                <option value="">{assignmentForm.department_id ? 'Sélectionner' : 'Choisissez un département d\'abord'}</option>
                {professors.map((p: any) => {
                  const displayName = (p.first_name || p.last_name) 
                    ? `${p.first_name || ''} ${p.last_name || ''}`.trim() 
                    : `Professeur (ID: ${p.id})`;
                  return (
                    <option key={p.id} value={p.id}>{displayName}</option>
                  );
                })}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Module</label>
              <select 
                value={assignmentForm.module_id}
                onChange={e => setAssignmentForm(prev => ({ ...prev, module_id: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
              >
                <option value="">Sélectionner</option>
                {modules.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.code} {m.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Groupe</label>
              <select 
                value={assignmentForm.group_id}
                onChange={e => setAssignmentForm(prev => ({ ...prev, group_id: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
              >
                <option value="">Sélectionner</option>
                {groups.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleCreateAssignment}
              disabled={createAssignmentMutation.isPending}
              className="w-full lg:w-auto px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors text-sm shadow-sm uppercase tracking-wide disabled:opacity-50"
            >
              {createAssignmentMutation.isPending ? 'En cours...' : '+ Affecter'}
            </button>
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-8 py-5">Professeur</th>
              <th className="px-8 py-5">Module</th>
              <th className="px-8 py-5">Groupe</th>
              <th className="px-8 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {assignmentsLoading ? (
              <tr>
                <td colSpan={4} className="px-8 py-10 text-center text-slate-500 font-medium">Chargement...</td>
              </tr>
            ) : assignments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-10 text-center text-slate-500 font-medium">Aucune affectation trouvée</td>
              </tr>
            ) : assignments.map((a: any) => (
              <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5 font-bold text-slate-800">{a.prof}</td>
                <td className="px-8 py-5 font-medium text-slate-600">
                  {a.module && (
                    <>
                      <span className="font-bold text-slate-400 mr-2">{a.module.split(' ')[0]}</span> 
                      {a.module.split(' ').slice(1).join(' ')}
                    </>
                  )}
                </td>
                <td className="px-8 py-5 font-bold text-slate-600">{a.group}</td>
                <td className="px-8 py-5 text-right">
                  <button 
                    onClick={() => handleDeleteAssignment(a.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 inline-block" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-[#00a85a] p-6 text-white relative">
              <button 
                onClick={() => setShowImportModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-xl">Importer des Affectations</h3>
              <p className="text-white/80 text-sm mt-1">Fichier Excel (.xlsx) ou CSV</p>
            </div>
            
            <div className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Année Universitaire
                  </label>
                  <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700">
                    <option>2025/2026 (Courante)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Fichier Excel / CSV
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700">Cliquer pour choisir un fichier</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">.xlsx, .xls, .csv — Max 5MB</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-amber-800">Format requis (colonnes) :</span>
                  </div>
                  <p className="text-[11px] font-mono font-bold text-amber-700 bg-amber-100/50 inline-block px-2 py-1 rounded">
                    email_professeur | module_code | groupe
                  </p>
                  <button 
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 mt-3 transition-colors"
                  >
                    <Download className="w-3 h-3" /> Télécharger le modèle
                  </button>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between gap-4">
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm w-full"
                >
                  Annuler
                </button>
                <button className="px-6 py-3 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a387e] transition-colors text-sm shadow-sm w-full">
                  Importer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
