import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import arLocale from '@fullcalendar/core/locales/ar'
import frLocale from '@fullcalendar/core/locales/fr'
import { Calendar as CalendarIcon, Cpu, AlertTriangle, CheckCircle2, ChevronRight, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { toast } from 'sonner'
import { Button } from '@shared/components/ui/Button'
import { Modal } from '@shared/components/ui/Modal'

export default function TimetableAdminView() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const calendarRef = useRef<FullCalendar>(null)
  const queryClient = useQueryClient()

  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const [conflictDetails, setConflictDetails] = useState<any>(null)

  // State for selectors
  const [academicYearId, setAcademicYearId] = useState(1)
  const [semesterId, setSemesterId] = useState(1)
  const [filiereId, setFiliereId] = useState(1)
  const institutionId = 1 // Default institution

  const { data: scheduleData } = useQuery({
    queryKey: ['timetable-admin', filiereId],
    queryFn: () => api.get(`/timetable/group/${filiereId}`).then(r => r.data)
  })

  // Format the events
  const events = (scheduleData?.data || []).map((schedule: any) => {
    const currentDay = new Date().getDay() || 7;
    const diff = schedule.day_of_week - currentDay;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + diff);
    const dateStr = targetDate.toISOString().split('T')[0];

    return {
      id: String(schedule.id),
      title: `${schedule.module_name}\n${schedule.room_name}\n${schedule.professor_name}`,
      start: `${dateStr}T${schedule.start_time}`,
      end: `${dateStr}T${schedule.end_time}`,
      backgroundColor: schedule.type === 'TD' ? '#10b981' : schedule.type === 'TP' ? '#f59e0b' : 'hsl(var(--color-primary))',
      borderColor: 'transparent',
      extendedProps: { roomId: schedule.room_id, profId: schedule.professor_id, groupId: schedule.group_id }
    }
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post('/timetable/generate', {
      institution_id: institutionId,
      academic_year_id: academicYearId,
      semester_id: semesterId,
      filiere_id: filiereId
    }),
    onSuccess: (res: any) => {
      toast.success(res.data.message || (isRtl ? 'تم إنشاء الجدول بنجاح!' : 'Emploi du temps généré avec succès !'))
      queryClient.invalidateQueries({ queryKey: ['timetable'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || (isRtl ? 'خطأ أثناء الإنشاء' : 'Erreur lors de la génération.'))
    }
  })

  const publishMutation = useMutation({
    mutationFn: () => api.post('/timetable/publish', {
      academic_year_id: academicYearId,
      semester_id: semesterId,
      filiere_id: filiereId
    }),
    onSuccess: (res: any) => {
      toast.success(res.data.message || (isRtl ? 'تم نشر الجداول بنجاح!' : 'Emplois du temps publiés avec succès !'))
      queryClient.invalidateQueries({ queryKey: ['timetable'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || (isRtl ? 'خطأ أثناء النشر' : 'Erreur lors de la publication.'))
    }
  })

  const conflictCheckMutation = useMutation({
    mutationFn: (payload: any) => api.post('/timetable/check-conflict', payload)
  })

  const handleEventDrop = async (info: any) => {
    const { event } = info
    
    // Compute new day (1=Mon) and time
    const newDay = event.start.getDay() === 0 ? 7 : event.start.getDay()
    const newStart = event.start.toTimeString().split(' ')[0]
    const newEnd = event.end.toTimeString().split(' ')[0]

    try {
      const res = await conflictCheckMutation.mutateAsync({
        schedule_id: event.id, // String UUID
        new_day: newDay,
        new_start_time: newStart,
        new_end_time: newEnd,
        new_room_id: event.extendedProps.roomId // Keep same room for now
      })

      if (res.data.success) {
        toast.success(isRtl ? 'تم تأكيد التغيير' : 'Mouvement validé.')
      } else {
        info.revert()
        setConflictDetails({
          message: res.data.message,
          suggestions: res.data.suggestions
        })
        setConflictModalOpen(true)
      }
    } catch (error) {
      info.revert()
      toast.error(isRtl ? 'خطأ في الاتصال' : 'Erreur de validation réseau.')
    }
  }

  // Inject CSS directly for FullCalendar RTL logic overriding and glassmorphism styling
  const customCalendarStyles = `
    .fc {
      font-family: inherit;
    }
    .fc-theme-standard .fc-scrollgrid {
      border-color: hsl(var(--border));
      border-radius: 1rem;
      overflow: hidden;
    }
    .fc-theme-standard th {
      border-color: hsl(var(--border));
      background: hsl(var(--muted)/50);
      padding: 0.75rem 0;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      color: hsl(var(--muted-foreground));
    }
    .fc-theme-standard td {
      border-color: hsl(var(--border));
    }
    .fc-timegrid-slot {
      height: 3rem;
    }
    .fc-timegrid-slot-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: hsl(var(--muted-foreground));
    }
    .fc-v-event {
      border-radius: 0.75rem;
      padding: 4px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      transition: transform 0.2s;
    }
    .fc-v-event:hover {
      transform: scale(1.02);
      z-index: 10 !important;
    }
    .fc-event-main {
      font-weight: 600;
      line-height: 1.4;
    }
    .fc-button-primary {
      background-color: hsl(var(--background)) !important;
      border-color: hsl(var(--border)) !important;
      color: hsl(var(--foreground)) !important;
      border-radius: 0.5rem !important;
      font-weight: 600 !important;
      text-transform: capitalize !important;
    }
    .fc-button-primary:hover {
      background-color: hsl(var(--muted)) !important;
    }
    .fc-button-primary:not(:disabled).fc-button-active, .fc-button-primary:not(:disabled):active {
      background-color: hsl(var(--color-primary)) !important;
      color: white !important;
      border-color: hsl(var(--color-primary)) !important;
    }
    .fc-toolbar-title {
      font-size: 1.25rem !important;
      font-weight: 700 !important;
      color: hsl(var(--foreground)) !important;
    }
  `

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1400px] mx-auto animate-in">
      <style>{customCalendarStyles}</style>
      
      {/* Header Panel */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 rounded-[2rem] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 end-0 p-8 opacity-5 text-[hsl(var(--color-primary))] pointer-events-none">
          <CalendarIcon size={120} />
        </div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] flex items-center gap-3">
            <div className="w-10 h-10 bg-[hsl(var(--color-primary))/10] rounded-xl flex items-center justify-center text-[hsl(var(--color-primary))]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            {isRtl ? 'إدارة الجداول الذكية' : 'Smart Timetabling'}
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 font-medium">
            {isRtl ? 'توليد تلقائي وإدارة ذكية للجداول الزمنية مع تفادي التعارضات.' : 'Génération algorithmique et gestion intelligente des emplois du temps.'}
          </p>
        </div>
        
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <div className="flex bg-[hsl(var(--muted)/30)] p-1 rounded-xl border border-[hsl(var(--border))]">
            <select 
              value={filiereId}
              onChange={(e) => setFiliereId(Number(e.target.value))}
              className="bg-transparent border-none text-sm font-bold focus:ring-0 text-[hsl(var(--foreground))] pe-8"
            >
              <option value={1}>S6 - Génie Info</option>
              <option value={2}>S4 - Tronc Commun</option>
            </select>
            <div className="w-px bg-[hsl(var(--border))] mx-2 my-1"></div>
            <select 
              value={semesterId}
              onChange={(e) => setSemesterId(Number(e.target.value))}
              className="bg-transparent border-none text-sm font-bold focus:ring-0 text-[hsl(var(--foreground))] pe-8"
            >
              <option value={1}>Semestre 1</option>
              <option value={2}>Semestre 2</option>
            </select>
          </div>
          
          <Button
            onClick={() => generateMutation.mutate()}
            isLoading={generateMutation.isPending}
            variant="primary"
            className="rounded-xl px-6 bg-[#0f2863] hover:bg-[#1a387e] text-white border-none shadow-lg shadow-blue-900/20"
            icon={<Cpu size={18} />}
          >
            {isRtl ? 'توليد ذكي (IA)' : 'Génération IA (Brouillon)'}
          </Button>

          <Button
            onClick={() => publishMutation.mutate()}
            isLoading={publishMutation.isPending}
            variant="primary"
            className="rounded-xl px-6 bg-[#A80A0B] hover:bg-[#7D0809] text-white border-none shadow-lg shadow-red-900/20"
            icon={<CheckCircle2 size={18} />}
          >
            {isRtl ? 'نشر' : 'Publier'}
          </Button>
        </div>
      </div>

      {/* Calendar Area */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 shadow-sm overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: isRtl ? 'timeGridDay,timeGridWeek' : 'prev,next today',
            center: 'title',
            right: isRtl ? 'today next,prev' : 'timeGridWeek,timeGridDay'
          }}
          locale={isRtl ? arLocale : frLocale}
          direction={isRtl ? 'rtl' : 'ltr'}
          hiddenDays={[0]} // Hide Sunday
          slotMinTime="08:00:00"
          slotMaxTime="19:00:00"
          allDaySlot={false}
          events={events}
          editable={true} // Enable Drag & Drop
          droppable={true}
          eventDrop={handleEventDrop}
          height="auto"
        />
      </div>

      {/* Conflict Modal */}
      <Modal
        open={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        title={isRtl ? 'تعارض في الجدول الزمني' : 'Conflit Détecté'}
        size="md"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle size={32} />
          </div>
          
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">
            {isRtl ? 'تداخل في المواعيد' : 'Collision de créneaux'}
          </h3>
          
          <p className="text-[hsl(var(--muted-foreground))] max-w-sm">
            {conflictDetails?.message || (isRtl ? 'هذا الإجراء يسبب تعارضاً مع أستاذ أو قاعة مشغولة.' : 'Cette action cause un conflit (Salle occupée ou Professeur indisponible).')}
          </p>

          {conflictDetails?.suggestions?.length > 0 && (
            <div className="w-full text-start mt-4 bg-[hsl(var(--muted)/30)] rounded-2xl p-4 border border-[hsl(var(--border))]">
              <p className="font-bold text-sm mb-3 text-[hsl(var(--foreground))]">
                {isRtl ? 'مقترحات ذكية لتفادي التعارض:' : 'Suggestions intelligentes :'}
              </p>
              <ul className="space-y-2">
                {conflictDetails.suggestions.map((sug: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{sug.day} à {sug.start_time} - {sug.room}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="w-full pt-4 mt-2">
            <Button className="w-full" variant="outline" onClick={() => setConflictModalOpen(false)}>
              {isRtl ? 'فهمت، إلغاء التغيير' : 'Compris, annuler le déplacement'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
