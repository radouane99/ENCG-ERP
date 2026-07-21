import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, CheckSquare, Edit, Trash2, Mail, Users, FileText, Monitor, Printer, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { academicApi } from '@shared/api/academic'
import { examsApi } from '@shared/api/exams'
import api from '@shared/lib/api'

export default function AdminExamsPage() {
  const { t, i18n } = useTranslation('exams')
  const isRtl = i18n.language === 'ar'

  const [showNotification, setShowNotification] = useState(false)
  const [notificationMsg, setNotificationMsg] = useState('')
  const [notificationType, setNotificationType] = useState<'success'|'error'>('success')

  const { data: filieres, isLoading: isLoadingFilieres } = useQuery({
    queryKey: ['filieres'],
    queryFn: academicApi.getFilieres
  })

  const { data: exams, isLoading: isLoadingExams } = useQuery({
    queryKey: ['admin-exams'],
    queryFn: examsApi.getExams
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
    setNotificationMsg(msg)
    setNotificationType(type)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

  const [isAutoGenerating, setIsAutoGenerating] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<number | ''>('')
  const [selectedFiliereId, setSelectedFiliereId] = useState<number | ''>('')
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualForm, setManualForm] = useState({
    module_id: 1,
    group_id: 1,
    room_id: 1,
    exam_date: '',
    start_time: '',
    duration_minutes: 90
  })
  const [conflictMsg, setConflictMsg] = useState('')
  const [isCheckingConflict, setIsCheckingConflict] = useState(false)

  const handleAutoGenerate = async () => {
    if (!selectedSessionId || !selectedFiliereId) {
      handleNotify("Veuillez sélectionner une filière et une session d'abord.", 'error');
      return;
    }
    setIsAutoGenerating(true)
    try {
      const res = await examsApi.generateSession(Number(selectedSessionId), Number(selectedFiliereId))
      handleNotify(res.message || t('exams.messages.auto_success'), 'success')
      // Need to invalidate queries here if queryClient is available, but the component uses useQuery
      // Let's force a reload for simplicity if needed, or rely on window.location
      window.location.reload();
    } catch (error: any) {
      handleNotify(error.response?.data?.message || t('exams.messages.auto_error'), 'error')
    } finally {
      setIsAutoGenerating(false)
    }
  }

  const handleReset = async () => {
    if (!selectedSessionId) {
      handleNotify("Veuillez sélectionner une session d'abord pour la remise à zéro.", 'error');
      return;
    }
    const message = selectedFiliereId 
      ? "Voulez-vous vraiment effacer tous les examens et convocations pour CETTE filière et session ?"
      : "ATTENTION : Voulez-vous vraiment effacer TOUS les examens et convocations pour TOUTES les filières de cette session ?";
      
    if (!confirm(message)) return;
    
    try {
      const res = await examsApi.resetSession(Number(selectedSessionId), selectedFiliereId ? Number(selectedFiliereId) : undefined);
      handleNotify(res.message || 'Remise à zéro réussie', 'success');
      window.location.reload();
    } catch (error: any) {
      handleNotify(error.response?.data?.message || 'Erreur lors de la remise à zéro', 'error');
    }
  }

  const handleCheckConflict = async () => {
    if (!manualForm.room_id || !manualForm.exam_date || !manualForm.start_time) return;
    setIsCheckingConflict(true)
    setConflictMsg('')
    try {
      const res = await examsApi.checkRoomConflict({ ...manualForm, date: manualForm.exam_date })
      if (res.has_conflict) {
        setConflictMsg(res.message)
      } else {
        setConflictMsg(t('exams.messages.room_available'))
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsCheckingConflict(false)
    }
  }

  const handleCreateManual = async () => {
    try {
      await examsApi.createExam({ ...manualForm, date: manualForm.exam_date })
      setShowManualModal(false)
      handleNotify(t('exams.messages.manual_success'), 'success')
    } catch (error) {
      handleNotify(t('exams.messages.manual_error'), 'error')
    }
  }

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0f2863] flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2863] italic">{t('exams.title')}</h1>
            <p className="text-xs text-slate-500">{t('exams.subtitle')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-blue-600">{t('exams.filters.filiere')}</label>
              <select 
                className="h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-600 outline-none w-48"
                value={selectedFiliereId}
                onChange={(e) => setSelectedFiliereId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">{t('exams.filters.filiere_empty')}</option>
                {!isLoadingFilieres && filieres?.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-blue-600">{t('exams.filters.session')}</label>
              <select 
                className="h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-600 outline-none w-32"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">{t('exams.filters.session_empty')}</option>
                {examSessions?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <button 
              onClick={handleReset}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2 border border-red-200">
              <Trash2 className="w-4 h-4" /> REMISE À ZÉRO
            </button>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-blue-600">
              <input type="checkbox" className="rounded border-slate-300 text-blue-600" /> {t('exams.actions.overwrite')}</label>
            <button 
              onClick={handleAutoGenerate}
              disabled={isAutoGenerating}
              className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {isAutoGenerating ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <ZapIcon className="w-4 h-4 text-amber-400" />} 
              AUTO-GÉNÉRER
            </button>
            <button 
              onClick={() => setShowManualModal(true)}
              className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2"> {t('exams.actions.manual')}</button>
          </div>
        </div>
      </div>

      {showNotification && (
        <div className={cn(
          "px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 mb-6 border",
          notificationType === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"
        )}>
          {notificationType === 'success' ? <CheckSquare className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{notificationMsg}</span>
        </div>
      )}

      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0f2863]">{t('exams.manual_modal.title')}</h2>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600">X</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('exams.manual_modal.module')}</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" value={manualForm.module_id} onChange={(e) => setManualForm({...manualForm, module_id: Number(e.target.value)})}>
                    {modules?.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('exams.manual_modal.group')}</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" value={manualForm.group_id} onChange={(e) => setManualForm({...manualForm, group_id: Number(e.target.value)})}>
                    {groups?.map((g: any) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('exams.manual_modal.room')}</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" value={manualForm.room_id} onChange={(e) => {
                    setManualForm({...manualForm, room_id: Number(e.target.value)});
                    setConflictMsg('');
                  }}>
                    {rooms?.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('exams.manual_modal.date')}</label>
                  <input type="date" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" value={manualForm.exam_date} onChange={(e) => setManualForm({...manualForm, exam_date: e.target.value})} onBlur={handleCheckConflict} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('exams.manual_modal.time')}</label>
                  <input type="time" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" value={manualForm.start_time} onChange={(e) => setManualForm({...manualForm, start_time: e.target.value})} onBlur={handleCheckConflict} />
                </div>
              </div>
              
              {isCheckingConflict ? (
                <div className="text-xs text-blue-500 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> {t('exams.manual_modal.check_loading')}</div>
              ) : conflictMsg ? (
                <div className={cn("text-xs font-bold p-2 rounded", conflictMsg.includes('disponible') ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                  {conflictMsg.includes('disponible') ? <CheckSquare className="w-4 h-4 inline mr-1" /> : <AlertTriangle className="w-4 h-4 inline mr-1" />}
                  {conflictMsg}
                </div>
              ) : null}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowManualModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">{t('exams.manual_modal.cancel')}</button>
              <button onClick={handleCreateManual} disabled={conflictMsg !== '' && !conflictMsg.includes('disponible')} className="bg-[#0f2863] text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">{t('exams.manual_modal.create')}</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {isLoadingExams ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : exams?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500">Aucun examen programmé.</div>
        ) : (
          exams?.map((exam: any) => {
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
                title={exam.module?.name || 'Examen'}
                group={exam.group?.name || 'Tous Groupes'}
                time={`${exam.start_time?.substring(0, 5) || '--:--'} - ${endTimeStr}`}
                duration={`${exam.duration_minutes || 90} min`}
                room={exam.room?.name || 'Non assignée'}
                surveillants="Aucun"
                day={day}
                month={monthNames[dateObj.getMonth()]}
                dayName={dayNames[dateObj.getDay()]}
                type={exam.type || 'EXAMEN'}
                generated={exam.generated_count || 0}
                sent={exam.sent_count || 0}
                pending={exam.pending_count || 0}
                onNotify={handleNotify}
              />
            )
          })
        )}
      </div>
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex">
      {/* Date sidebar */}
      <div className="w-24 bg-[#4a6b9c] text-white flex flex-col items-center justify-center py-6 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider mb-1">{month}</span>
        <span className="text-3xl font-black mb-1">{day}</span>
        <span className="text-[10px] font-medium mb-3">{dayName}</span>
        <span className="px-3 py-1 bg-white/20 rounded-full text-[9px] font-bold uppercase tracking-wider">{type}</span>
      </div>

      <div className="p-6 flex-1 flex items-start justify-between">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md"><Users className="w-4 h-4" /> {group}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> {time}</span>
            <span className="flex items-center gap-1.5"><ClockIcon className="w-4 h-4 text-slate-400" /> {duration}</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Monitor className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-700">{room}</span>
          </div>

          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            SURVEILLANTS : <span className="text-red-500">{surveillants}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl">
            <div className="text-center">
              <span className="text-2xl font-black text-slate-800">{generated}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-2">{t('exams.card.generated').split('\n').map((line: string, i: number) => <span key={i}>{line}<br/></span>)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold uppercase tracking-wider">{sent} ENVOYÉES</span>
            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-bold uppercase tracking-wider">{pending} EN ATTENTE</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-4 flex flex-col gap-2 w-48 shrink-0 border-l border-slate-100">
        <button 
          onClick={handleGenerateClick}
          disabled={isGenerating}
          className="w-full bg-blue-50/50 hover:bg-blue-50 text-slate-600 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-amber-500" />} 
          Générer
        </button>
        <button 
          onClick={() => sendMutation.mutate(id)}
          disabled={sendMutation.isPending}
          className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-70" title="Envoyer emails + PDF">
          {sendMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} 
          {t('exams.card.btn_mail')}
        </button>
        <button 
          onClick={() => notifyAbsentsMutation.mutate(id)}
          disabled={notifyAbsentsMutation.isPending}
          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
          {notifyAbsentsMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />} 
          {t('exams.card.btn_notify')}
        </button>
        <Link to={`/admin/exams/${id}/attendance-sheet`} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
          <Printer className="w-3.5 h-3.5 text-slate-400" /> {t('exams.card.btn_pdf')}</Link>
        <Link to={`/admin/exams/${id}/display-list`} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
          <Monitor className="w-3.5 h-3.5 text-blue-500" /> {t('exams.card.btn_display')}</Link>
        <Link to={`/admin/exams/${id}/attendance-sheet`} className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
          <CheckSquare className="w-3.5 h-3.5 text-amber-500" /> {t('exams.card.btn_attendance')}</Link>
        <Link to={`/admin/exams/${id}/live-attendance`} className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {t('exams.card.btn_live')}</Link>
        <div className="flex gap-2 mt-2">
          <Link to={`/admin/exams/${id}/edit`} className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-600 py-1.5 rounded-lg flex items-center justify-center transition-colors">
            <Edit className="w-3.5 h-3.5" />
          </Link>
          <button className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-1.5 rounded-lg flex items-center justify-center transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ZapIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}

function ClockIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
