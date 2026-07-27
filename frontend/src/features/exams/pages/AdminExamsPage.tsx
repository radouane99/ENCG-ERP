import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, CheckSquare, Edit, Trash2, Mail, Users, FileText, Monitor, Printer, AlertTriangle, Loader2, Sliders, ArrowUp, ArrowDown, Sparkles, Clock, ListOrdered, Zap, ShieldCheck, Plus, RefreshCw, Layers, Archive } from 'lucide-react'

import { cn } from '@shared/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { academicApi } from '@shared/api/academic'
import { examsApi } from '@shared/api/exams'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { CustomSelect } from '@shared/components/ui'

export default function AdminExamsPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('exams')
  const isRtl = i18n.language === 'ar'
  const queryClient = useQueryClient()

  const [showNotification, setShowNotification] = useState(false)
  const [notificationMsg, setNotificationMsg] = useState('')
  const [notificationType, setNotificationType] = useState<'success'|'error'>('success')

  const [selectedSemesterNum, setSelectedSemesterNum] = useState<number | ''>('')
  const [selectedSessionId, setSelectedSessionId] = useState<number | ''>('')
  const [selectedFiliereId, setSelectedFiliereId] = useState<number | ''>('')
  const [isAutoGenerating, setIsAutoGenerating] = useState(false)

  const { data: filieres } = useQuery({
    queryKey: ['filieres'],
    queryFn: academicApi.getFilieres
  })

  const { data: exams, isLoading: isLoadingExams } = useQuery({
    queryKey: ['admin-exams', selectedFiliereId, selectedSessionId, selectedSemesterNum],
    queryFn: () => examsApi.getExams({
      filiere_id: selectedFiliereId,
      session_id: selectedSessionId,
      semester_number: selectedSemesterNum
    })
  })

  const { data: modules } = useQuery({
    queryKey: ['modules'],
    queryFn: academicApi.getModules
  })

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: academicApi.getGroups
  })

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: academicApi.getRooms
  })

  const { data: examSessions } = useQuery({
    queryKey: ['exam-sessions'],
    queryFn: async () => {
      const res = await api.get('/exam-sessions')
      return res.data.data
    }
  })

  const handleNotify = (msg: string, type: 'success'|'error' = 'success') => {
    if (type === 'success') {
      toast.success(msg)
    } else {
      toast.error(msg)
    }
  }

  // Custom planning state
  const [showCustomGenModal, setShowCustomGenModal] = useState(false)
  const [modulesPerDay, setModulesPerDay] = useState<number>(2)
  const [daySlotMode, setDaySlotMode] = useState<'matin' | 'pm' | 'split'>('matin')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [orderedModuleList, setOrderedModuleList] = useState<any[]>([])
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<number>>(new Set())

  const openCustomGenModal = () => {
    if (!selectedSessionId || !selectedFiliereId) {
      toast.error("Veuillez sélectionner une filière et une session d'abord dans les filtres.");
      return;
    }

    const sessionObj = examSessions?.find((s: any) => s.id === Number(selectedSessionId));
    if (sessionObj?.start_date) {
      setCustomStartDate(sessionObj.start_date.substring(0, 10));
    } else {
      setCustomStartDate(new Date().toISOString().substring(0, 10));
    }

    const filtered = (modules || []).filter((m: any) => {
      if (m.filiere_id !== Number(selectedFiliereId)) return false;
      if (selectedSemesterNum && m.semester_number !== Number(selectedSemesterNum)) return false;
      return true;
    });

    setOrderedModuleList(filtered);
    setSelectedModuleIds(new Set(filtered.map((m: any) => m.id)));
    setShowCustomGenModal(true);
  }

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    const newList = [...orderedModuleList];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;
    setOrderedModuleList(newList);
  }

  const toggleModuleSelection = (id: number) => {
    const newSet = new Set(selectedModuleIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedModuleIds(newSet);
  }

  const handleRunCustomAutoGenerate = async () => {
    if (selectedModuleIds.size === 0) {
      toast.error("Veuillez sélectionner au moins un module à planifier.");
      return;
    }

    try {
      setIsAutoGenerating(true);
      toast.loading("Génération du planning des examens sur mesure...");

      const orderedSelectedModules = orderedModuleList.filter(m => selectedModuleIds.has(m.id));
      const res = await api.post('/exam-planning/custom-generate', {
        filiere_id: Number(selectedFiliereId),
        exam_session_id: Number(selectedSessionId),
        semester_number: selectedSemesterNum ? Number(selectedSemesterNum) : null,
        start_date: customStartDate,
        modules_per_day: modulesPerDay,
        day_slot_mode: daySlotMode,
        ordered_module_ids: orderedSelectedModules.map(m => m.id)
      });

      toast.dismiss();
      toast.success(res.data.message || `Planning sur-mesure généré avec succès (${res.data.created_count || 0} examens créés) !`);
      setShowCustomGenModal(false);
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.response?.data?.message || "Erreur lors de la génération du planning sur-mesure.");
    } finally {
      setIsAutoGenerating(false);
    }
  }

  const handleAutoGenerateExams = async () => {
    if (!selectedSessionId || !selectedFiliereId) {
      toast.error("Veuillez sélectionner une filière et une session d'abord.");
      return;
    }

    try {
      setIsAutoGenerating(true);
      toast.loading("Génération automatique du calendrier des examens...");
      const res = await api.post('/exam-planning/auto-generate', {
        filiere_id: Number(selectedFiliereId),
        exam_session_id: Number(selectedSessionId),
        semester_number: selectedSemesterNum ? Number(selectedSemesterNum) : null
      });

      toast.dismiss();
      toast.success(res.data.message || `Planning généré avec succès ! ${res.data.created_count || 0} examens créés.`);
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.response?.data?.message || "Erreur lors de la génération automatique.");
    } finally {
      setIsAutoGenerating(false);
    }
  }

  const handleResetExams = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer tous les examens planifiés pour cette session et filière ?")) return;

    try {
      toast.loading("Réinitialisation du calendrier...");
      const res = await api.post('/exam-planning/reset', {
        filiere_id: selectedFiliereId ? Number(selectedFiliereId) : null,
        exam_session_id: selectedSessionId ? Number(selectedSessionId) : null,
        semester_number: selectedSemesterNum ? Number(selectedSemesterNum) : null
      });

      toast.dismiss();
      toast.success(res.data.message || "Planning réinitialisé avec succès.");
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
    } catch (err: any) {
      toast.dismiss();
      toast.error("Erreur lors de la réinitialisation.");
    }
  }

  const filiereOptions = [
    { value: '', label: 'Toutes les filières' },
    ...(filieres?.map((f: any) => ({ value: f.id, label: f.name })) || [])
  ]

  const sessionOptions = [
    { value: '', label: "-- Session d'Examen --" },
    ...(examSessions?.map((s: any) => ({ value: s.id, label: `${s.name} (${s.academic_year})` })) || [])
  ]

  const semesterOptions = [
    { value: '', label: 'Tous Semestres (S1-S10)' },
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => ({ value: s, label: `Semestre S${s}` }))
  ]

  const filteredExams = (exams || []).filter((exam: any) => {
    if (selectedFiliereId && exam.module?.filiere_id && Number(exam.module.filiere_id) !== Number(selectedFiliereId)) {
      return false;
    }
    if (selectedSessionId && exam.exam_session_id && Number(exam.exam_session_id) !== Number(selectedSessionId)) {
      return false;
    }
    if (selectedSemesterNum) {
      const examSem = exam.module?.semester_number 
        || (exam.module?.semester ? Number(String(exam.module.semester).replace(/\D/g, '')) : null);
      if (examSem && Number(examSem) !== Number(selectedSemesterNum)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-8 font-sans animate-in duration-500 pb-24">
      
      {/* Hero Header Banner */}
      <div className="relative bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
                <Calendar className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Organisation des Examens & Sessions ENCG Fès
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  Gestion des Examens & Convocations
                </h1>
                <p className="text-blue-100/90 text-xs md:text-sm max-w-3xl font-medium mt-1">
                  Planification des sessions, répartition automatique anti-chevauchement des amphis, impression des bordereaux d'émargement et convocations QR Code.
                </p>
              </div>
            </div>
          </div>

          {/* Controls & Filters Bar */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <CustomSelect
                value={selectedFiliereId}
                onChange={(val) => setSelectedFiliereId(val ? Number(val) : '')}
                options={filiereOptions}
                placeholder="Toutes les filières"
                variant="hero"
                icon={<Layers className="w-4 h-4" />}
                className="w-full sm:w-64"
              />

              <CustomSelect
                value={selectedSessionId}
                onChange={(val) => setSelectedSessionId(val ? Number(val) : '')}
                options={sessionOptions}
                placeholder="-- Session d'Examen --"
                variant="hero"
                icon={<Calendar className="w-4 h-4" />}
                className="w-full sm:w-64"
              />

              <CustomSelect
                value={selectedSemesterNum}
                onChange={(val) => setSelectedSemesterNum(val ? Number(val) : '')}
                options={semesterOptions}
                placeholder="Tous Semestres (S1-S10)"
                variant="hero"
                icon={<Clock className="w-4 h-4" />}
                className="w-full sm:w-60"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={openCustomGenModal}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-amber-300" /> Sur Mesure (2 Ex/Jour)
              </button>

              <button
                onClick={handleAutoGenerateExams}
                disabled={isAutoGenerating}
                className="px-4 py-2.5 bg-[#e6007e] hover:bg-[#cc0070] text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAutoGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300" />} Auto-Générer
              </button>

              <button
                onClick={() => navigate('/admin/exams/pv-archive')}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Archive className="w-4 h-4" /> Archives PVs (SHA-256)
              </button>

              <button
                onClick={handleResetExams}
                className="px-4 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Remise à Zéro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Exams List */}
      <div className="space-y-6">
        {isLoadingExams ? (
          <div className="flex justify-center p-16"><Loader2 className="w-10 h-10 animate-spin text-[#0f2863]" /></div>
        ) : filteredExams?.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
            Aucun examen programmé pour ces filtres. Utilisez "Auto-Générer" ou "Sur Mesure" pour planifier la session.
          </div>
        ) : (
          filteredExams?.map((exam: any) => {
            const dateObj = new Date(exam.exam_date || new Date());
            const day = String(dateObj.getDate()).padStart(2, '0');
            const monthNames = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUI", "JUL", "AOU", "SEP", "OCT", "NOV", "DÉC"];
            const dayNames = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
            
            const timeEndHour = exam.start_time ? parseInt(exam.start_time.split(':')[0]) + Math.floor(exam.duration_minutes / 60) : 0;
            const timeEndMin = exam.start_time ? parseInt(exam.start_time.split(':')[1]) + (exam.duration_minutes % 60) : 0;
            const endTimeStr = `${String(timeEndHour).padStart(2, '0')}:${String(timeEndMin).padStart(2, '0')}`;
            
            return (
              <ExamCard key={exam.id} t={t} 
                id={exam.id}
                title={exam.module?.name || 'Examen Module'}
                group={exam.group?.name || 'Tous Groupes'}
                time={`${exam.start_time?.substring(0, 5) || '08:30'} - ${endTimeStr}`}
                duration={`${exam.duration_minutes || 120} min`}
                room={exam.room?.name || 'Amphithéâtre R'}
                surveillants={exam.surveillants || 'BOUCHRA BENNANI, RADOUANE EL BAHI, FATIM-ZAHRA ALAMI'}
                day={day}
                month={monthNames[dateObj.getMonth()]}
                dayName={dayNames[dateObj.getDay()]}
                type={exam.type || 'EXAMEN'}
                generated={exam.generated_count ?? 0}
                sent={exam.sent_count ?? 0}
                pending={exam.pending_count ?? 0}
                onNotify={handleNotify}
              />
            )
          })
        )}
      </div>

      {/* Modal Custom Planning 2 Exams / Day */}
      {showCustomGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-amber-300 shadow-lg">
                  <Sliders className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black">Génération Sur Mesure (Plafond 2 Ex/Jour)</h3>
                  <p className="text-xs text-blue-200">Configuration du rythme des examens par jour</p>
                </div>
              </div>
              <button onClick={() => setShowCustomGenModal(false)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nombre d'examens / jour</label>
                  <select
                    value={modulesPerDay}
                    onChange={(e) => setModulesPerDay(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value={1}>1 Examen / Jour</option>
                    <option value={2}>2 Examens / Jour (Recommandé ENCG)</option>
                    <option value={3}>3 Examens / Jour</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date de début des épreuves</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Sélection & Ordre de passage des modules</label>
                <div className="max-h-48 overflow-y-auto space-y-2 p-2 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40">
                  {orderedModuleList.map((mod, idx) => (
                    <div key={mod.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedModuleIds.has(mod.id)}
                          onChange={() => toggleModuleSelection(mod.id)}
                          className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                        />
                        <span className="font-extrabold text-slate-900 dark:text-white">#{idx + 1} {mod.name} ({mod.code})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleMoveModule(idx, 'up')} disabled={idx === 0} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleMoveModule(idx, 'down')} disabled={idx === orderedModuleList.length - 1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"><ArrowDown className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button onClick={() => setShowCustomGenModal(false)} className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer">Annuler</button>
              <button onClick={handleRunCustomAutoGenerate} className="px-6 py-2 bg-[#0f2863] text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md cursor-pointer">Générer Planning</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExamCard({ id, title, group, time, duration, room, surveillants, day, month, dayName, type, generated, sent, pending, onNotify, t }: any) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateMutation = useMutation({
    mutationFn: (examId: number) => examsApi.generateConvocations(examId),
    onSuccess: (data) => {
      onNotify(data.message || `Convocations générées avec succès pour l'examen ${id}.`)
      setIsGenerating(false)
    },
    onError: (error: any) => {
      onNotify(error.response?.data?.message || `Erreur lors de la génération pour l'examen ${id}.`, 'error')
      setIsGenerating(false)
    }
  })

  const sendMutation = useMutation({
    mutationFn: (examId: number) => examsApi.sendConvocations(examId),
    onSuccess: (data) => {
      onNotify(data.message || `Emails envoyés avec succès pour l'examen ${id}.`)
    },
    onError: (error: any) => {
      onNotify(error.response?.data?.message || `Erreur lors de l'envoi pour l'examen ${id}.`, 'error')
    }
  })

  const notifyAbsentsMutation = useMutation({
    mutationFn: (examId: number) => examsApi.notifyAbsents(examId),
    onSuccess: (data) => {
      onNotify(data.message || `Absents notifiés avec succès.`)
    },
    onError: (error: any) => {
      onNotify(error.response?.data?.message || `Erreur lors de la notification.`, 'error')
    }
  })

  const handleGenerateClick = () => {
    setIsGenerating(true)
    generateMutation.mutate(id)
  }

  const handleExportEmargementPdf = () => {
    toast.loading(`Génération de la Liste d'Émargement A4...`);
    setTimeout(() => {
      toast.dismiss();
      toast.success(`📜 Feuille d'Émargement A4 générée pour ${title} !`);
      window.open(`/api/v1/groups/emargement-pdf?code=${encodeURIComponent(group)}&filiere=ENCG&semester=S1&count=45&capacity=45`, '_blank');
    }, 600);
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-2xl">
      {/* Date sidebar */}
      <div className="w-full md:w-28 bg-[#0f2863] text-white flex flex-col items-center justify-center p-6 shrink-0 border-b md:border-b-0 md:border-r border-blue-900">
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 mb-1">{month}</span>
        <span className="text-4xl font-black tracking-tight mb-1">{day}</span>
        <span className="text-xs font-bold text-blue-200 mb-3">{dayName}</span>
        <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-wider border border-white/20">{type}</span>
      </div>

      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-3">{title}</h2>
          
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/60 text-[#0f2863] dark:text-blue-300 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800"><Users className="w-3.5 h-3.5 text-blue-600" /> {group}</span>
            <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {time}</span>
            <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"><Clock className="w-3.5 h-3.5 text-slate-400" /> {duration}</span>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Monitor className="w-4 h-4 text-amber-500" />
            <span>SALLE / AMPHI :</span>
            <span className="font-extrabold text-[#0f2863] dark:text-blue-300">{room}</span>
          </div>

          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            SURVEILLANTS : <span className="text-rose-600 dark:text-rose-400 font-extrabold">{surveillants}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{generated}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Convocations Générées</span>
            </div>
          </div>
          <div className="flex gap-2 ml-auto">
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-200">{sent} Envoyées</span>
            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl text-[10px] font-black uppercase tracking-wider border border-amber-200">{pending} En Attente</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Panel */}
      <div className="bg-slate-50/50 dark:bg-slate-800/40 p-6 flex flex-col gap-2.5 w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 justify-center">
        <button 
          onClick={handleGenerateClick}
          disabled={isGenerating}
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-amber-500" />} 
          Générer
        </button>

        <button 
          onClick={() => sendMutation.mutate(id)}
          disabled={sendMutation.isPending}
          className="w-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all cursor-pointer disabled:opacity-50"
        >
          {sendMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} 
          Envoyer Mails
        </button>

        <button 
          onClick={() => notifyAbsentsMutation.mutate(id)}
          disabled={notifyAbsentsMutation.isPending}
          className="w-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-50"
        >
          {notifyAbsentsMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />} 
          Notifier Absents
        </button>

        <button 
          onClick={handleExportEmargementPdf}
          className="w-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-amber-100 transition-all cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-amber-600" /> Émargement (PDF)
        </button>

        <Link to={`/admin/exams/${id}/surveillance`} className="w-full bg-[#0f2863] hover:bg-[#1a387e] text-white py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Surveillance Admin
        </Link>
      </div>
    </div>
  )
}
