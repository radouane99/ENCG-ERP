import { useState } from 'react'
import { FileText, Mail, Zap, CheckCircle, AlertTriangle, Loader2, Users, Shield, Calendar, Clock, MapPin, ChevronRight, BarChart3, Eye, Download, X, MessageCircle, Search } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { examsApi } from '@shared/api/exams'

export default function AdminConvocationsPage() {
  const queryClient = useQueryClient()
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'surveillants'>('overview')
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedSeatings, setSelectedSeatings] = useState<Set<number>>(new Set())
  const [selectedSurveillants, setSelectedSurveillants] = useState<Set<number>>(new Set())
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [searchStudent, setSearchStudent] = useState('')

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      toast.success(msg);
    } else {
      toast.error(msg);
    }
  }

  // Fetch all exam sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['exam-sessions'],
    queryFn: () => api.get('/exam-sessions').then(r => r.data.data)
  })

  // Fetch session stats (when session selected)
  const { data: sessionStats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['convocation-stats', selectedSessionId],
    queryFn: () => examsApi.getConvocationSessionStats(selectedSessionId!),
    enabled: !!selectedSessionId
  })

  // Fetch convocations list
  const { data: convocationList, isLoading: isLoadingList, refetch: refetchList } = useQuery({
    queryKey: ['convocation-list', selectedSessionId, selectedFiliere],
    queryFn: () => examsApi.getConvocationSessionList(selectedSessionId!, selectedFiliere || undefined),
    enabled: !!selectedSessionId && (activeTab === 'students' || activeTab === 'surveillants')
  })

  // Fetch exams for selected session
  const { data: exams, isLoading: isLoadingExams } = useQuery({
    queryKey: ['session-exams', selectedSessionId],
    queryFn: () => api.get('/exams').then(r => (r.data.data || []).filter((e: any) => e.exam_session_id === selectedSessionId)),
    enabled: !!selectedSessionId
  })

  // Generate all convocations for session
  const generateMutation = useMutation({
    mutationFn: () => examsApi.generateSessionConvocations(selectedSessionId!),
    onSuccess: (data) => {
      notify(data.message || `${data.generated_count || 0} convocations générées avec succès !`)
      refetchStats()
      refetchList()
    },
    onError: (err: any) => notify(err.response?.data?.message || 'Erreur lors de la génération.', 'error')
  })

  // Send all convocations emails
  const sendMutation = useMutation({
    mutationFn: () => examsApi.sendSessionEmails(selectedSessionId!),
    onSuccess: (data) => {
      notify(data.message || 'Emails envoyés avec succès !')
      refetchStats()
      refetchList()
    },
    onError: (err: any) => notify(err.response?.data?.message || 'Erreur lors de l\'envoi.', 'error')
  })

  // Auto-assign proctors
  const assignMutation = useMutation({
    mutationFn: () => examsApi.autoAssignProctors(selectedSessionId!),
    onSuccess: (data) => {
      notify(data.message || 'Surveillants affectés automatiquement !')
      refetchStats()
      refetchList()
    },
    onError: (err: any) => notify(err.response?.data?.message || 'Erreur lors de l\'affectation.', 'error')
  })

  // Batch actions - Students
  const batchDownloadMutation = useMutation({
    mutationFn: (seatingIds: number[]) => examsApi.batchDownloadPdf(selectedSessionId!, seatingIds),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `convocations_lot_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      notify('PDF téléchargé avec succès !');
    },
    onError: () => notify('Erreur lors du téléchargement.', 'error')
  })

  const batchEmailMutation = useMutation({
    mutationFn: (seatingIds: number[]) => examsApi.sendBatchEmails(selectedSessionId!, seatingIds),
    onSuccess: () => {
      notify('Emails envoyés avec succès !');
      setSelectedSeatings(new Set());
      refetchList();
      refetchStats();
    },
    onError: () => notify('Erreur lors de l\'envoi des emails.', 'error')
  })

  // Batch actions - Surveillants
  const batchDownloadSurveillantsMutation = useMutation({
    mutationFn: (survIds: number[]) => examsApi.batchDownloadSurveillantsPdf(selectedSessionId!, survIds),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `convocations_profs_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      notify('PDF Surveillants téléchargé avec succès !');
    },
    onError: () => notify('Erreur lors du téléchargement.', 'error')
  })

  const batchEmailSurveillantsMutation = useMutation({
    mutationFn: (survIds: number[]) => examsApi.sendBatchSurveillantsEmails(selectedSessionId!, survIds),
    onSuccess: () => {
      notify('Emails envoyés aux surveillants avec succès !');
      setSelectedSurveillants(new Set());
      refetchList();
      refetchStats();
    },
    onError: () => notify('Erreur lors de l\'envoi des emails.', 'error')
  })

  const batchWhatsAppSurveillantsMutation = useMutation({
    mutationFn: (survIds: number[]) => examsApi.sendBatchSurveillantsWhatsApp(selectedSessionId!, survIds),
    onSuccess: () => {
      notify('Messages WhatsApp envoyés avec succès !');
      setSelectedSurveillants(new Set());
      refetchList();
      refetchStats();
    },
    onError: () => notify('Erreur lors de l\'envoi des messages WhatsApp.', 'error')
  })

  const stats = sessionStats

  const students: any[] = convocationList?.students || []
  const surveillants: any[] = convocationList?.surveillants || []

  const handlePreviewStudentPdf = async (seatingId: number) => {
    try {
      const blob = await examsApi.previewConvocationPdf(seatingId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      notify('Erreur lors de la prévisualisation.', 'error');
    }
  };

  const handleDownloadStudentPdf = async (seatingId: number) => {
    try {
      const blob = await examsApi.downloadConvocationPdf(seatingId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `convocation_${seatingId}.pdf`; // Will be overridden by Content-Disposition if present, but good fallback
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      notify('Erreur lors du téléchargement.', 'error');
    }
  };

  const handlePreviewSurveillantPdf = async (surveillanceId: number) => {
    try {
      const blob = await examsApi.previewSurveillantConvocationPdf(surveillanceId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      notify('Erreur lors de la prévisualisation.', 'error');
    }
  };

  const handleDownloadSurveillantPdf = async (surveillanceId: number) => {
    try {
      const blob = await examsApi.downloadSurveillantConvocationPdf(surveillanceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `convocation_prof_${surveillanceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      notify('Erreur lors du téléchargement.', 'error');
    }
  };

  const filieres = [...new Set(students.map((s: any) => s.filiere))].filter(Boolean)

  const groupedSurveillants = Object.values(surveillants.reduce((acc, curr) => {
    if (!acc[curr.professor_name]) {
      acc[curr.professor_name] = {
        id: curr.id, // Use the first surveillance ID to trigger backend APIs
        professor_name: curr.professor_name,
        seances_count: 0,
        sent_at: curr.sent_at,
        confirmed_at: curr.confirmed_at,
      }
    }
    acc[curr.professor_name].seances_count += 1;
    // We can assume sent_at is true if any is sent
    if (curr.sent_at) acc[curr.professor_name].sent_at = curr.sent_at;
    if (curr.confirmed_at) acc[curr.professor_name].confirmed_at = curr.confirmed_at;
    return acc;
  }, {} as Record<string, any>));

  const filteredStudents = students.filter((s: any) => 
    s.student_name?.toLowerCase().includes(searchStudent.toLowerCase()) || 
    s.cne?.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.filiere?.toLowerCase().includes(searchStudent.toLowerCase())
  )

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSeatings(new Set(filteredStudents.map((s: any) => s.id)))
    } else {
      setSelectedSeatings(new Set())
    }
  }

  const handleSelectOne = (id: number) => {
    const newSet = new Set(selectedSeatings)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedSeatings(newSet)
  }

  const handleSelectAllSurveillants = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSurveillants(new Set(groupedSurveillants.map((s: any) => s.id)))
    } else {
      setSelectedSurveillants(new Set())
    }
  }

  const handleSelectOneSurveillant = (id: number) => {
    const newSet = new Set(selectedSurveillants)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedSurveillants(newSet)
  }

  const handlePreview = (id: number) => {
    setPreviewUrl(`http://localhost:8000/api/admin/exam-planning/student/${id}/preview`)
  }

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-600" />
            Gestion des Convocations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Génération, affectation des surveillants et envoi des convocations

          </p>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={cn(
          'px-4 py-3 rounded-xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-4',
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        )}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{notification.msg}</span>
        </div>
      )}

      {/* Step 1: Session Selection */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-black">1</div>
          <h2 className="text-base font-bold text-slate-800">Sélectionner une Session d'Examens</h2>
        </div>
        {isLoadingSessions ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions?.map((session: any) => (
              <button
                key={session.id}
                onClick={() => { setSelectedSessionId(session.id); setActiveTab('overview') }}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  selectedSessionId === session.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={cn('font-bold text-sm', selectedSessionId === session.id ? 'text-blue-700' : 'text-slate-700')}>
                      {session.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 capitalize">{session.type || 'Ordinaire'}</p>
                  </div>
                  {selectedSessionId === session.id && (
                    <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
                  )}
                </div>
                {session.start_date && (
                  <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(session.start_date).toLocaleDateString('fr-FR')}
                    {session.end_date && ` → ${new Date(session.end_date).toLocaleDateString('fr-FR')}`}
                  </p>
                )}
              </button>
            ))}
            {!sessions?.length && (
              <div className="col-span-3 text-center text-slate-400 py-8 text-sm">
                Aucune session d'examens créée. Créez d'abord une session dans le planning.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rest only shown when session selected */}
      {selectedSessionId && (
        <>
          {/* Step 2: KPI Stats */}
          {isLoadingStats ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Étudiants uniques', value: stats?.students?.total ?? 0, sub: `${stats?.students?.total_seatings ?? 0} inscriptions`, color: 'indigo', icon: Users },
                { label: 'Convocations générées', value: stats?.students?.generated ?? 0, sub: `sur ${stats?.students?.total_seatings ?? 0} totales`, color: 'blue', icon: FileText },
                { label: 'Emails envoyés', value: stats?.students?.sent ?? 0, sub: `${stats?.students?.generated ? Math.round(((stats?.students?.sent ?? 0) / stats.students.generated) * 100) : 0}% du total`, color: 'emerald', icon: Mail },
                { label: 'Surveillants affectés', value: stats?.surveillants?.total ?? 0, sub: `${stats?.surveillants?.generated ?? 0} affectations`, color: 'amber', icon: Shield },
              ].map(({ label, value, sub, color, icon: Icon }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', `bg-${color}-50`)}>
                    <Icon className={cn('w-6 h-6', `text-${color}-600`)} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-2xl font-black text-slate-800">{value}</p>
                    <p className="text-[10px] text-slate-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-black">2</div>
              <h2 className="text-base font-bold text-slate-800">Actions sur la Session</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Generate */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-700">Générer les Convocations</p>
                    <p className="text-[10px] text-slate-400">Crée les QR codes pour tous les étudiants</p>
                  </div>
                </div>
                <button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Générer
                </button>
              </div>

              {/* Auto-assign proctors */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-700">Affecter les Surveillants</p>
                    <p className="text-[10px] text-slate-400">Répartition équitable par l'IA selon disponibilités</p>
                  </div>
                </div>
                <button
                  onClick={() => assignMutation.mutate()}
                  disabled={assignMutation.isPending}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Auto-Affecter
                </button>
              </div>

              {/* Send emails */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-700">Envoyer les Emails</p>
                    <p className="text-[10px] text-slate-400">Convocations PDF par Resend à tous les étudiants</p>
                  </div>
                </div>
                <button
                  onClick={() => sendMutation.mutate()}
                  disabled={sendMutation.isPending || !stats?.students?.generated}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Envoyer Emails
                </button>
              </div>
            </div>
          </div>

          {/* Step 4: Tabs — Students & Surveillants */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex gap-1">
                {[
                  { key: 'overview', label: 'Examens planifiés', icon: BarChart3 },
                  { key: 'students', label: 'Étudiants & Salles', icon: Users },
                  { key: 'surveillants', label: 'Surveillants affectés', icon: Shield },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all',
                      activeTab === key
                        ? 'bg-[#0f2863] text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>

              {activeTab === 'students' && filieres.length > 0 && (
                <select
                  value={selectedFiliere}
                  onChange={e => setSelectedFiliere(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium outline-none"
                >
                  <option value="">Toutes les filières</option>
                  {filieres.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              )}
            </div>

            {/* OVERVIEW TAB — Exam list */}
            {activeTab === 'overview' && (
              <div className="p-4">
                {isLoadingExams ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                ) : exams?.length === 0 ? (
                  <div className="text-center text-slate-400 py-10 text-sm">
                    Aucun examen trouvé pour cette session. Ajoutez des examens dans le Planning.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {exams?.map((exam: any) => {
                      const dateObj = new Date(exam.exam_date || new Date())
                      const seatings = exam.generated_count || 0
                      const sent = exam.sent_count || 0
                      return (
                        <div key={exam.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-[#0f2863] text-white flex flex-col items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold uppercase">{dateObj.toLocaleString('fr-FR', { month: 'short' })}</span>
                              <span className="text-2xl font-black leading-none">{dateObj.getDate()}</span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{exam.module?.name || 'Module'}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Users className="w-3 h-3" /> {exam.group?.name || 'Tous'}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {exam.start_time?.substring(0, 5) || '--:--'} · {exam.duration_minutes || 90}min
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {exam.room?.name || 'Salle non assignée'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Convocations</p>
                              <p className="text-sm font-black text-slate-700">{seatings} générées · {sent} envoyées</p>
                            </div>
                            {seatings > 0
                              ? <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold">Générées</span>
                              : <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[10px] font-bold">En attente</span>
                            }
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* STUDENTS TAB */}
            {activeTab === 'students' && (
              <div>
                {isLoadingList ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                ) : students.length === 0 ? (
                  <div className="text-center text-slate-400 py-10 text-sm">
                    Aucune convocation générée. Cliquez sur "Générer les Convocations" d'abord.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100">
                      <div className="relative w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Rechercher (Nom, CNE, Filière)..."
                          value={searchStudent}
                          onChange={(e) => setSearchStudent(e.target.value)}
                        />
                      </div>
                    </div>
                    {selectedSeatings.size > 0 && (
                      <div className="bg-blue-50 border-b border-blue-100 p-3 px-5 flex items-center justify-between sticky top-0 z-10">
                        <span className="text-blue-800 font-bold text-sm">
                          {selectedSeatings.size} étudiant(s) sélectionné(s)
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => batchDownloadMutation.mutate(Array.from(selectedSeatings))}
                            disabled={batchDownloadMutation.isPending}
                            className="bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2"
                          >
                            {batchDownloadMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            Télécharger PDFs
                          </button>
                          <button
                            onClick={() => batchEmailMutation.mutate(Array.from(selectedSeatings))}
                            disabled={batchEmailMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2"
                          >
                            {batchEmailMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                            Envoyer Emails
                          </button>
                        </div>
                      </div>
                    )}
                    <table className="w-full text-sm">
                      <thead className="text-[9px] text-slate-400 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-3 text-left w-10">
                            <input
                              type="checkbox"
                              checked={filteredStudents.length > 0 && selectedSeatings.size === filteredStudents.length}
                              onChange={handleSelectAll}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-5 py-3 text-left font-bold">Étudiant</th>
                          <th className="px-5 py-3 text-left font-bold">CNE</th>
                          <th className="px-5 py-3 text-left font-bold">Filière / Groupe</th>
                          <th className="px-5 py-3 text-left font-bold">Examen</th>
                          <th className="px-5 py-3 text-left font-bold">Date & Heure</th>
                          <th className="px-5 py-3 text-center font-bold">QR</th>
                          <th className="px-5 py-3 text-center font-bold">Statut</th>
                          <th className="px-5 py-3 text-right font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredStudents.map((s: any) => (
                          <tr key={s.id} className={cn("hover:bg-slate-50/60 transition-colors", selectedSeatings.has(s.id) ? "bg-blue-50/30" : "")}>
                            <td className="px-5 py-3">
                              <input
                                type="checkbox"
                                checked={selectedSeatings.has(s.id)}
                                onChange={() => handleSelectOne(s.id)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                                {(s.student_name || 'E').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-slate-700">{s.student_name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-slate-500 font-mono text-xs">{s.cne || '—'}</td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">{s.filiere}</span>
                            {s.group_name && <span className="ml-1 text-[10px] text-slate-400">· {s.group_name}</span>}
                          </td>
                          <td className="px-5 py-3 text-slate-600 text-xs font-medium">{s.exam_name}</td>
                          <td className="px-5 py-3 text-slate-500 text-xs">
                            {s.exam_date ? new Date(s.exam_date).toLocaleDateString('fr-FR') : '—'}
                            {s.start_time && <span className="ml-2 font-medium">{s.start_time?.substring(0, 5)}</span>}
                          </td>
                          <td className="px-5 py-3 text-center">
                            {s.qr_token
                              ? <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">✓ QR</span>
                              : <span className="text-[10px] text-red-400">—</span>}
                          </td>
                          <td className="px-5 py-3 text-center">
                            {s.sent_at
                              ? <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold">Envoyée</span>
                              : <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[10px] font-bold">En attente</span>}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handlePreviewStudentPdf(s.id); }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Voir la convocation"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDownloadStudentPdf(s.id); }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </>
                )}
              </div>
            )}

            {/* SURVEILLANTS TAB */}
            {activeTab === 'surveillants' && (
              <div>
                {isLoadingList ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                ) : surveillants.length === 0 ? (
                  <div className="text-center text-slate-400 py-10 text-sm">
                    Aucun surveillant affecté. Cliquez sur "Auto-Affecter" pour que l'IA répartisse les surveillants.
                  </div>
                ) : (
                  <>
                    {selectedSurveillants.size > 0 && (
                      <div className="bg-amber-50 border-b border-amber-100 p-3 px-5 flex items-center justify-between sticky top-0 z-10">
                        <span className="text-amber-800 font-bold text-sm">
                          {selectedSurveillants.size} surveillant(s) sélectionné(s)
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => batchDownloadSurveillantsMutation.mutate(Array.from(selectedSurveillants))}
                            disabled={batchDownloadSurveillantsMutation.isPending}
                            className="bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2"
                          >
                            {batchDownloadSurveillantsMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            Télécharger PDFs
                          </button>
                          <button
                            onClick={() => batchEmailSurveillantsMutation.mutate(Array.from(selectedSurveillants))}
                            disabled={batchEmailSurveillantsMutation.isPending}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2"
                          >
                            {batchEmailSurveillantsMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                            Envoyer Emails
                          </button>
                          <button
                            onClick={() => batchWhatsAppSurveillantsMutation.mutate(Array.from(selectedSurveillants))}
                            disabled={batchWhatsAppSurveillantsMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2"
                          >
                            {batchWhatsAppSurveillantsMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                            WhatsApp
                          </button>
                        </div>
                      </div>
                    )}
                  <table className="w-full text-sm">
                    <thead className="text-[9px] text-slate-400 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3 text-left w-10">
                          <input
                            type="checkbox"
                            checked={groupedSurveillants.length > 0 && selectedSurveillants.size === groupedSurveillants.length}
                            onChange={handleSelectAllSurveillants}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                        </th>
                        <th className="px-5 py-3 text-left font-bold">Professeur</th>
                        <th className="px-5 py-3 text-center font-bold">Nombre de séances</th>
                        <th className="px-5 py-3 text-center font-bold">Statut Envoi</th>
                        <th className="px-5 py-3 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {groupedSurveillants.map((s: any) => (
                        <tr key={s.id} className={cn("hover:bg-slate-50/60 transition-colors", selectedSurveillants.has(s.id) ? "bg-amber-50/30" : "")}>
                          <td className="px-5 py-3">
                            <input
                              type="checkbox"
                              checked={selectedSurveillants.has(s.id)}
                              onChange={() => handleSelectOneSurveillant(s.id)}
                              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                            />
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                                {(s.professor_name || 'P').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-slate-700">{s.professor_name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                              {s.seances_count} {s.seances_count > 1 ? 'séances' : 'séance'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center flex flex-col gap-1 items-center justify-center">
                            {s.sent_at
                              ? <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[10px] font-bold">Envoyée</span>
                              : <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[10px] font-bold">En attente</span>}
                            {s.confirmed_at && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Confirmé</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handlePreviewSurveillantPdf(s.id); }}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                title="Voir la convocation"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDownloadSurveillantPdf(s.id); }}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}


