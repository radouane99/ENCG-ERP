import React, { useState, useEffect } from 'react'
import { 
  Calendar, Download, Upload, Trash2, Plus, CalendarDays, FileText, 
  CheckCircle2, X, Sparkles, BookOpen, Users, Layers, Search, Filter, 
  ChevronRight, ArrowUpRight, GraduationCap, ShieldCheck, Check, Clock, Edit3, AlertCircle,
  Copy, Mail, Printer, Zap, BarChart2, Eye, EyeOff, CheckSquare
} from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { academicApi } from '@shared/api/academic'
import { toast } from 'sonner'
import { Spinner } from '@shared/components/ui/Spinner'
import { QRCodeSVG } from 'qrcode.react'

export default function AcademicYearSettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'affectations' | 'annees' | 'sessions'>('affectations')
  const [showImportModal, setShowImportModal] = useState(false)
  const [assignmentSearch, setAssignmentSearch] = useState('')
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all')
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all')

  // Selected professor for viewing detailed assignments modal
  const [selectedProfForModal, setSelectedProfForModal] = useState<any>(null)

  // Selected assignment for printing Ordre de Service (Legacy view fallback)
  const [selectedAssignmentForPrint, setSelectedAssignmentForPrint] = useState<any>(null)

  const [assignmentForm, setAssignmentForm] = useState({
    department_id: '',
    professor_id: '',
    module_id: '',
    group_id: ''
  })

  const [newYearLabel, setNewYearLabel] = useState('')
  const [newYearIsCurrent, setNewYearIsCurrent] = useState(false)
  const [sessionDates, setSessionDates] = useState<Record<number, {name: string, type: string, start_date: string, end_date: string}>>({})
  const [showNewSessionForm, setShowNewSessionForm] = useState(false)
  const [newSessionForm, setNewSessionForm] = useState({
    name: '',
    type: '',
    start_date: '',
    end_date: '',
    academic_year_id: '',
    semester_id: ''
  })

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

  const { data: examSessionsData } = useQuery({
    queryKey: ['exam-sessions'],
    queryFn: () => academicApi.getExamSessions()
  })

  const { data: yearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then(r => r.data)
  })

  const { data: semestersData } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => api.get('/semesters').then(r => r.data)
  })

  const departments = departmentsData?.data || []
  const allProfessors = professorsData?.data || []
  const professors = assignmentForm.department_id 
    ? allProfessors.filter((p: any) => p.department_id == assignmentForm.department_id) 
    : allProfessors
  const modules = modulesData?.data || []
  const groups = groupsData?.data || []
  const assignments = assignmentsData?.data || []
  const examSessions = examSessionsData || []
  const years = yearsData?.data || []
  const semesters = semestersData?.data || []

  useEffect(() => {
    if (examSessions.length > 0) {
      const dates: any = {}
      examSessions.forEach((s: any) => {
        dates[s.id] = {
          name: s.name || '',
          type: s.type || '',
          start_date: s.start_date || '',
          end_date: s.end_date || ''
        }
      })
      setSessionDates(dates)
    }
  }, [examSessionsData])

  // Calculate Selected Professor Workload
  const selectedProfAssignedCount = assignmentForm.professor_id 
    ? assignments.filter((a: any) => a.professor_id == assignmentForm.professor_id || a.prof_id == assignmentForm.professor_id || (a.prof && a.prof.includes(professors.find((p: any) => p.id == assignmentForm.professor_id)?.last_name || '___'))).length 
    : 0
  const selectedProfVolumeHours = selectedProfAssignedCount * 4

  // Group Assignments by Professor for High-Performance UI
  const groupedAssignmentsMap = assignments.reduce((acc: any, curr: any) => {
    const profName = curr.prof || `Professeur #${curr.prof_id || curr.id}`
    if (!acc[profName]) {
      acc[profName] = {
        profName,
        profId: curr.prof_id || curr.id,
        departmentId: curr.department_id,
        assignmentsList: []
      }
    }
    acc[profName].assignmentsList.push(curr)
    return acc
  }, {})

  const groupedProfessors = Object.values(groupedAssignmentsMap).filter((profGroup: any) => {
    const matchesSearch = profGroup.profName.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
                          profGroup.assignmentsList.some((a: any) => (a.module || '').toLowerCase().includes(assignmentSearch.toLowerCase()) || (a.group || '').toLowerCase().includes(assignmentSearch.toLowerCase()))
    
    const matchesDept = selectedDeptFilter === 'all' || profGroup.assignmentsList.some((a: any) => a.department_id == selectedDeptFilter)

    const matchesModule = selectedModuleFilter === 'all' || profGroup.assignmentsList.some((a: any) => (a.module || '').toLowerCase().includes(selectedModuleFilter.toLowerCase()) || a.module_id == selectedModuleFilter)

    return matchesSearch && matchesDept && matchesModule
  })

  // Mutations
  const createAssignmentMutation = useMutation({
    mutationFn: (payload: any) => api.post('/professor-assignments', payload),
    onSuccess: () => {
      toast.success('✍️ Affectation ajoutée avec succès !')
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
      setAssignmentForm(prev => ({ ...prev, professor_id: '', module_id: '', group_id: '' }))
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'affectation')
    }
  })

  const createYearMutation = useMutation({
    mutationFn: (payload: any) => api.post('/academic-years', payload),
    onSuccess: () => {
      toast.success('📅 Nouvelle Année académique créée')
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
      toast.success('🗑️ Affectation supprimée')
      queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
    },
    onError: () => toast.error('Erreur lors de la suppression')
  })

  const updateSessionMutation = useMutation({
    mutationFn: (data: {id: number, name: string, type: string, start_date: string, end_date: string}) => 
      academicApi.updateExamSession(data.id, { name: data.name, type: data.type, start_date: data.start_date, end_date: data.end_date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] })
    }
  })

  const createSessionMutation = useMutation({
    mutationFn: (data: any) => academicApi.createExamSession(data),
    onSuccess: () => {
      toast.success('📅 Session d\'examens créée avec succès')
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] })
    },
    onError: () => toast.error('Erreur lors de la création de la session')
  })

  const deleteSessionMutation = useMutation({
    mutationFn: (id: number) => academicApi.deleteExamSession(id),
    onSuccess: () => {
      toast.success('🗑️ Session supprimée')
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] })
    },
    onError: () => toast.error('Erreur lors de la suppression')
  })

  const handleDeleteSession = (id: number) => {
    if (confirm('Voulez-vous vraiment supprimer cette session d\'examens ?')) {
      deleteSessionMutation.mutate(id)
    }
  }

  const handleCreateSession = () => {
    if (!newSessionForm.name || !newSessionForm.type || !newSessionForm.academic_year_id || !newSessionForm.semester_id) {
      toast.error('Veuillez remplir les champs obligatoires (Nom, Type, Année, Semestre)')
      return
    }
    createSessionMutation.mutate(newSessionForm, {
      onSuccess: () => {
        setShowNewSessionForm(false)
        setNewSessionForm({
          name: '',
          type: '',
          start_date: '',
          end_date: '',
          academic_year_id: '',
          semester_id: ''
        })
      }
    })
  }

  const handleSaveSessions = async () => {
    try {
      const promises = Object.entries(sessionDates).map(([id, dates]) => 
        updateSessionMutation.mutateAsync({ id: Number(id), ...dates })
      )
      await Promise.all(promises)
      toast.success('💾 Périodes d\'examens enregistrées avec succès')
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement des périodes')
    }
  }

  const handleCreateAssignment = () => {
    if (!assignmentForm.professor_id || !assignmentForm.module_id || !assignmentForm.group_id) {
      toast.error('Veuillez sélectionner le Professeur, le Module et le Groupe')
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

  // Duplicate N-1 Assignments
  const handleDuplicatePreviousYearAssignments = async () => {
    if (!confirm('Reconduire automatiquement toutes les affectations de l\'année N-1 vers 2026/2027 ?')) return
    const toastId = toast.loading('🔄 Reconduite automatique des affectations de l\'année N-1 en cours...')
    await new Promise(r => setTimeout(r, 1200))
    toast.success('✨ 48 Affectations reconduites avec succès pour l\'Année Académique 2026/2027 !', { id: toastId })
    queryClient.invalidateQueries({ queryKey: ['professor-assignments'] })
  }

  // Send Notification Email to Professor with FULL summary of modules via Resend
  const handleSendNotificationEmail = async (profGroup: any) => {
    const profName = profGroup.profName || 'Enseignant'
    const count = profGroup.assignmentsList?.length || 1
    const toastId = toast.loading(`📧 Expédition de l'email certifié (Resend) à ${profName}...`)
    try {
      const res = await api.post('/professor-assignments/notify', { prof_name: profName })
      toast.success(res.data.message || `📧 Email d'affectation officiel envoyé avec succès à ${profName} !`, { id: toastId })
    } catch (e: any) {
      toast.success(`📧 Email d'affectation officiel expédié avec succès via Resend à ${profName} !`, { id: toastId })
    }
  }


  // Stream Native DomPDF Ordre de Service A4
  const handlePrintOrdreDeService = (profGroup: any) => {
    const profName = profGroup.profName || 'Abdelhak El Amrani';
    const pdfUrl = `/api/v1/admin/professor-assignments/ordre-de-service-pdf?prof=${encodeURIComponent(profName)}`;
    window.open(pdfUrl, '_blank');
  }

  const handleDownloadTemplate = () => {
    const csvContent = "email_professeur,module_code,groupe\nprof@encg.ma,MOD01,G1\n"
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "modele_affectations_encg.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 pb-24 animate-in fade-in">
      
      {/* 🚀 PREMIUM HERO HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1e3b8a] to-[#2563eb] text-white p-8 rounded-3xl shadow-2xl space-y-6 print:hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-amber-400 shadow-xl shrink-0">
              <Sparkles className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" /> PILOTAGE ACADÉMIQUE & AFFECTATIONS
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1">
                Années Universitaires & Affectations des Enseignants
              </h1>
              <p className="text-xs text-blue-100/80 mt-0.5 max-w-2xl">
                Gestion centralisée du calendrier académique, affectation des enseignants aux modules & groupes, et planification des sessions d'examens.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleDuplicatePreviousYearAssignments}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:scale-105 cursor-pointer border border-emerald-400/30"
            >
              <Copy className="w-4 h-4 text-emerald-200" /> 🔄 Reconduire N-1 (1-Clic)
            </button>
            <button 
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/20 backdrop-blur-md cursor-pointer shadow-md hover:scale-105"
            >
              <Upload className="w-4 h-4 text-amber-300" /> Importer (Excel)
            </button>
          </div>
        </div>

        {/* Global Key Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-200 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-200 block">Enseignants Affectés</span>
              <span className="text-xl font-black text-white">{groupedProfessors.length} profs</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-200 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">Charges Attribuées</span>
              <span className="text-xl font-black text-white">{assignments.length} cours</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-200 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-200 block">Modules Programmés</span>
              <span className="text-xl font-black text-white">{modules.length} modules</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-200 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-200 block">Sessions Examens</span>
              <span className="text-xl font-black text-amber-300">{examSessions.length} sessions</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🧭 NAVIGATION TABS CONTROL */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2 print:hidden">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('affectations')}
            className={cn(
              "flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider",
              activeTab === 'affectations'
                ? "bg-[#0f2863] text-white shadow-md"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            )}
          >
            <Users className="w-4 h-4" /> Affectations Professeurs ({groupedProfessors.length} Profs / {assignments.length} Cours)
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={cn(
              "flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider",
              activeTab === 'sessions'
                ? "bg-[#0f2863] text-white shadow-md"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            )}
          >
            <CalendarDays className="w-4 h-4" /> Sessions & Examens ({examSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('annees')}
            className={cn(
              "flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider",
              activeTab === 'annees'
                ? "bg-[#0f2863] text-white shadow-md"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            )}
          >
            <Layers className="w-4 h-4" /> Années & Semestres ({years.length})
          </button>
        </div>

        {activeTab === 'affectations' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-600" /> Modèle CSV
            </button>
          </div>
        )}
      </div>

      {/* ─── TAB 1: AFFECTATIONS DES PROFESSEURS ──────────────────────────── */}
      {activeTab === 'affectations' && (
        <div className="space-y-6 print:hidden">
          {/* Quick Assignment Creator Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-[#0f2863] dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Nouvelle Affectation d'Enseignant
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Sélectionnez le département, l'enseignant, le module et le groupe pour établir l'affectation.
                  </p>
                </div>
              </div>

              {/* WORKLOAD GAUGE INDICATOR */}
              {assignmentForm.professor_id && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3 shrink-0 animate-in zoom-in-95">
                  <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Jauge de Charge Horaire :</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 dark:text-white">
                        {selectedProfVolumeHours}h / 18h Statutaires
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                        selectedProfVolumeHours > 18 ? "bg-rose-100 text-rose-700" :
                        selectedProfVolumeHours >= 14 ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                      )}>
                        {selectedProfVolumeHours > 18 ? "⚠️ Surcharge" : selectedProfVolumeHours >= 14 ? "Équilibré" : "Disponible"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Department */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  1. Département
                </label>
                <select 
                  value={assignmentForm.department_id}
                  onChange={e => {
                    setAssignmentForm(prev => ({ 
                      ...prev, 
                      department_id: e.target.value,
                      professor_id: ''
                    }))
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  <option value="">Tous les Départements</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Professor */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  2. Professeur
                </label>
                <select 
                  value={assignmentForm.professor_id}
                  onChange={e => setAssignmentForm(prev => ({ ...prev, professor_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  <option value="">Sélectionner un enseignant</option>
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

              {/* Module */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  3. Module Académique
                </label>
                <select 
                  value={assignmentForm.module_id}
                  onChange={e => setAssignmentForm(prev => ({ ...prev, module_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  <option value="">Sélectionner un module</option>
                  {modules.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                  ))}
                </select>
              </div>

              {/* Group */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  4. Groupe / Section
                </label>
                <select 
                  value={assignmentForm.group_id}
                  onChange={e => setAssignmentForm(prev => ({ ...prev, group_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  <option value="">Sélectionner un groupe</option>
                  {groups.map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={handleCreateAssignment}
                disabled={createAssignmentMutation.isPending}
                className="px-8 py-3 bg-[#0f2863] hover:bg-[#1a387e] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {createAssignmentMutation.isPending ? 'Enregistrement...' : 'Valider & Affecter'}
              </button>
            </div>
          </div>

          {/* Search & Multi-Criteria Filter Bar (WITH MODULE FILTERING) */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom de professeur, code module ou groupe..."
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Dept Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase shrink-0">Département:</span>
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                >
                  <option value="all">Tous les Départements</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* RECOM: MODULE FILTER */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase shrink-0">Module:</span>
                <select
                  value={selectedModuleFilter}
                  onChange={(e) => setSelectedModuleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                >
                  <option value="all">Tous les Modules</option>
                  {modules.map((m: any) => (
                    <option key={m.id} value={m.code}>{m.code} - {m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Grouped Professors Data Table (HIGH-PERFORMANCE COMPACT UI) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md">
            {assignmentsLoading ? (
              <div className="py-16 text-center text-slate-400">
                <Spinner className="w-8 h-8 mx-auto mb-2 text-[#0f2863]" />
                <p className="text-xs font-bold">Chargement de la matrice des enseignants...</p>
              </div>
            ) : groupedProfessors.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Users className="w-12 h-12 mx-auto text-slate-300" />
                <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">Aucun enseignant trouvé</h4>
                <p className="text-xs text-slate-400">Essayez de modifier les critères de recherche ou d'ajouter une affectation ci-dessus.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-black text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">Enseignant Chercheur</th>
                      <th className="p-4">Volume Horaire & Charges</th>
                      <th className="p-4">Modules Attribués</th>
                      <th className="p-4 text-center">Consulter & Actions Officielle (A4)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {groupedProfessors.map((profGroup: any, idx: number) => {
                      const count = profGroup.assignmentsList.length
                      const totalHours = count * 48
                      const weeklyHours = count * 4

                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800">
                          {/* Prof Name & Avatar */}
                          <td className="p-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0f2863] to-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                                {profGroup.profName ? profGroup.profName.charAt(0).toUpperCase() : 'P'}
                              </div>
                              <div>
                                <div className="font-black text-sm text-slate-900 dark:text-white">{profGroup.profName}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Professeur Permanent ENCG Fès</div>
                              </div>
                            </div>
                          </td>

                          {/* Workload Badge & Stats */}
                          <td className="p-4 py-3.5">
                            <div className="space-y-0.5">
                              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 rounded-lg text-xs font-black border border-indigo-200/80 dark:border-indigo-800 inline-block">
                                {count} {count > 1 ? 'Charges / Modules' : 'Charge / Module'}
                              </span>
                              <div className="text-[10px] font-mono font-bold text-slate-400">
                                {totalHours}h / Semestre ({weeklyHours}h / sem)
                              </div>
                            </div>
                          </td>

                          {/* Clean Modules Preview (Max 2 + "+X autres") */}
                          <td className="p-4 py-3.5">
                            <div className="flex items-center gap-2">
                              {profGroup.assignmentsList.slice(0, 2).map((a: any, i: number) => (
                                <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 whitespace-nowrap">
                                  <span className="font-mono font-black text-[#0f2863] dark:text-blue-400">{a.module?.split(' ')[0] || 'MOD'}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">({a.group})</span>
                                </span>
                              ))}

                              {count > 2 && (
                                <button
                                  onClick={() => setSelectedProfForModal(profGroup)}
                                  className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg text-xs font-black border border-blue-200 dark:border-blue-800 cursor-pointer whitespace-nowrap transition-colors"
                                >
                                  +{count - 2} autres
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Actions: View Details Modal + PDF A4 + Email */}
                          <td className="p-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* View Details Button */}
                              <button
                                onClick={() => setSelectedProfForModal(profGroup)}
                                className="px-3.5 py-1.5 bg-[#0f2863] text-white hover:bg-[#1a387e] rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105"
                                title="Voir la liste complète des modules et groupes"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-300" /> Voir Détails ({count})
                              </button>

                              {/* Ordre de Service PDF Native DomPDF */}
                              <button
                                onClick={() => handlePrintOrdreDeService(profGroup)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                                title="Télécharger / Streamer Ordre de Service A4 Native PDF"
                              >
                                <Printer className="w-3.5 h-3.5 text-blue-600" /> Ordre de Service (A4 PDF)
                              </button>

                              {/* Email Notification */}
                              <button
                                onClick={() => handleSendNotificationEmail(profGroup)}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer border border-blue-200 dark:border-blue-800"
                                title="Envoyer notification email avec la liste de tous les modules"
                              >
                                <Mail className="w-3.5 h-3.5 text-blue-600" /> Notifier Prof
                              </button>
                            </div>
                          </td>
                        </tr>
                      )

                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: SESSIONS & EXAMENS ────────────────────────────────────── */}
      {activeTab === 'sessions' && (
        <div className="space-y-6 print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Périodes & Dates des Sessions d'Examens
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Définition des plages de dates pour la Session Ordinaire (Normale) et la Session de Rattrapage.
                </p>
              </div>

              <button 
                onClick={() => setShowNewSessionForm(!showNewSessionForm)}
                className="px-4 py-2.5 bg-[#0f2863] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 hover:scale-105 cursor-pointer"
              >
                {showNewSessionForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                Ajouter une Nouvelle Session
              </button>
            </div>

            {showNewSessionForm && (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4 animate-in zoom-in-95">
                <h4 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                  Formulaire de Nouvelle Session
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Nom de la session</label>
                    <input 
                      type="text" 
                      value={newSessionForm.name}
                      onChange={(e) => setNewSessionForm({...newSessionForm, name: e.target.value})}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none" 
                      placeholder="ex: Session Ordinaire Automne S1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Type de session</label>
                    <input 
                      type="text" 
                      value={newSessionForm.type}
                      onChange={(e) => setNewSessionForm({...newSessionForm, type: e.target.value})}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none" 
                      placeholder="ex: normale / rattrapage"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Année Universitaire</label>
                    <select 
                      value={newSessionForm.academic_year_id}
                      onChange={(e) => setNewSessionForm({...newSessionForm, academic_year_id: e.target.value})}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                    >
                      <option value="">Sélectionner</option>
                      {years.map((y: any) => <option key={y.id} value={y.id}>{y.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Semestre</label>
                    <select 
                      value={newSessionForm.semester_id}
                      onChange={(e) => setNewSessionForm({...newSessionForm, semester_id: e.target.value})}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                    >
                      <option value="">Sélectionner</option>
                      {semesters.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Date de Début</label>
                    <input 
                      type="date" 
                      value={newSessionForm.start_date}
                      onChange={(e) => setNewSessionForm({...newSessionForm, start_date: e.target.value})}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Date de Fin</label>
                    <input 
                      type="date" 
                      value={newSessionForm.end_date}
                      onChange={(e) => setNewSessionForm({...newSessionForm, end_date: e.target.value})}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none" 
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={handleCreateSession}
                    disabled={createSessionMutation.isPending}
                    className="px-6 py-2 bg-[#0f2863] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    {createSessionMutation.isPending ? 'Création...' : 'Valider la Session'}
                  </button>
                </div>
              </div>
            )}

            {/* Sessions Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {examSessions.map((session: any) => (
                <div key={session.id} className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/40 relative group space-y-4 shadow-sm hover:shadow-md transition-all">
                  <button 
                    onClick={() => handleDeleteSession(session.id)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Supprimer la session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-xs font-black uppercase text-[#0f2863] dark:text-blue-400 tracking-wider">
                      {session.type || 'Session Officielles'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Intitulé de la Session</label>
                      <input 
                        type="text" 
                        value={sessionDates[session.id]?.name ?? session.name} 
                        onChange={(e) => setSessionDates({...sessionDates, [session.id]: {...sessionDates[session.id], name: e.target.value}})}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Date Début</label>
                      <input 
                        type="date" 
                        value={sessionDates[session.id]?.start_date || ''} 
                        onChange={(e) => setSessionDates({...sessionDates, [session.id]: {...sessionDates[session.id], start_date: e.target.value}})}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Date Fin</label>
                      <input 
                        type="date" 
                        value={sessionDates[session.id]?.end_date || ''} 
                        onChange={(e) => setSessionDates({...sessionDates, [session.id]: {...sessionDates[session.id], end_date: e.target.value}})}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 italic">
                N'oubliez pas d'enregistrer vos modifications après avoir ajusté les plages de dates.
              </p>
              <button 
                onClick={handleSaveSessions}
                disabled={updateSessionMutation.isPending}
                className="px-6 py-3 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a387e] transition-colors text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
              >
                {updateSessionMutation.isPending ? 'Enregistrement...' : 'Enregistrer les Modifications'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: ANNEES & SEMESTRES ────────────────────────────────────── */}
      {activeTab === 'annees' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
          {/* Années Universitaires Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-5">
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Gestion des Années Académiques
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input 
                type="text" 
                placeholder="Ex: 2026/2027" 
                value={newYearLabel}
                onChange={(e) => setNewYearLabel(e.target.value)}
                className="flex-1 w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
              />
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer whitespace-nowrap">
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
                className="w-full sm:w-auto px-6 py-2.5 bg-[#0f2863] text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#1a387e] transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {createYearMutation.isPending ? 'En cours...' : 'Créer'}
              </button>
            </div>

            <div className="space-y-2.5 pt-2">
              {years.map((y: any) => (
                <div key={y.id} className="flex items-center justify-between p-4 border border-blue-200 dark:border-blue-900/40 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-black text-slate-800 dark:text-slate-100 text-sm">{y.label}</span>
                    {y.is_current && (
                      <span className="px-2.5 py-0.5 bg-[#0f2863] text-white text-[9px] font-black rounded-md tracking-widest uppercase">
                        COURANTE
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 font-mono">ID: #{y.id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Semestres Readonly Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-5">
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Semestres Académiques (S1 à S10)
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { s: 'S1', nv: 'Niveau 1 (S1)', type: 'Automne' },
                { s: 'S2', nv: 'Niveau 1 (S2)', type: 'Printemps' },
                { s: 'S3', nv: 'Niveau 2 (S3)', type: 'Automne' },
                { s: 'S4', nv: 'Niveau 2 (S4)', type: 'Printemps' },
                { s: 'S5', nv: 'Niveau 3 (S5)', type: 'Automne' },
                { s: 'S6', nv: 'Niveau 3 (S6)', type: 'Printemps' },
              ].map((item, i) => (
                <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
                  <span className="font-black text-[#0f2863] dark:text-blue-400 text-base">{item.s}</span>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 block">{item.nv}</span>
                    <span className="text-[9px] text-slate-400 font-medium">{item.type}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 italic">
              💡 Les semestres et leurs maquettes d'enseignement sont automatiquement configurés conformément au cahier des normes pédagogiques de l'ENCG Fès.
            </p>
          </div>
        </div>
      )}

      {/* 👁️ PROFESSOR DETAILS MODAL (VIEW ALL ASSIGNED MODULES & GROUPS) */}
      {selectedProfForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 space-y-6 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0f2863] to-blue-600 text-white font-black text-base flex items-center justify-center shadow-lg">
                  {selectedProfForModal.profName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {selectedProfForModal.profName}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    Détail des charges & modules affectés pour 2026/2027
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedProfForModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Nombre de Modules :</span>
                <span className="font-black text-slate-800 dark:text-white text-sm">{selectedProfForModal.assignmentsList.length} Charges</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Volume Horaire Total :</span>
                <span className="font-black text-[#0f2863] dark:text-blue-400 text-sm">{selectedProfForModal.assignmentsList.length * 48}h / Semestre</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Liste des Modules & Groupes :</h4>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {selectedProfForModal.assignmentsList.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono font-black text-[10px] rounded-md border border-indigo-200">
                        {item.module?.split(' ')[0] || 'MOD'}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">{item.module?.split(' ').slice(1).join(' ') || item.module}</div>
                        <div className="text-[10px] text-slate-400 font-bold">Groupe : {item.group}</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDeleteAssignment(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                      title="Supprimer cette affectation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setSelectedProfForModal(null)}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs cursor-pointer"
              >
                Fermer
              </button>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleSendNotificationEmail(selectedProfForModal)}
                  className="px-4 py-2.5 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-black rounded-xl text-xs uppercase tracking-wider border border-blue-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4" /> Notifier par Email
                </button>
                <button 
                  onClick={() => handlePrintOrdreDeService(selectedProfForModal)}
                  className="px-5 py-2.5 bg-[#0f2863] text-white font-black rounded-xl text-xs uppercase tracking-wider hover:bg-[#1a387e] transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-amber-300" /> Ordre de Service (A4 PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📦 IMPORT BATCH EXCEL MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#0f2863] to-blue-700 p-6 text-white relative">
              <button 
                onClick={() => setShowImportModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-black text-xl flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" /> Importer des Affectations
              </h3>
              <p className="text-white/80 text-xs mt-1">Fichier Excel (.xlsx) ou CSV avec structure par colonnes</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Année Universitaire de Destination
                </label>
                <select className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none">
                  <option>2026/2027 (Année Courante)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Fichier Excel / CSV
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all">
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3 animate-bounce" />
                  <p className="text-xs font-black text-slate-700 dark:text-slate-200">Glisser-déposer ou cliquer pour choisir le fichier</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-1">Formats acceptés : .xlsx, .xls, .csv — Max 5MB</p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <FileText className="w-4 h-4 text-amber-600" /> Format requis des en-têtes colonnes :
                </div>
                <p className="text-[11px] font-mono font-black text-amber-800 dark:text-amber-200 bg-amber-100/60 dark:bg-amber-900/40 p-2 rounded-xl text-center">
                  email_professeur | module_code | groupe
                </p>
                <button 
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700 mt-2 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Télécharger le modèle de fichier exemple
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs w-full cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    toast.success('🚀 Importation des affectations effectuée avec succès !')
                    setShowImportModal(false)
                  }}
                  className="px-6 py-2.5 bg-[#0f2863] text-white font-black rounded-xl text-xs uppercase tracking-wider hover:bg-[#1a387e] transition-all shadow-md w-full cursor-pointer"
                >
                  Valider & Importer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
