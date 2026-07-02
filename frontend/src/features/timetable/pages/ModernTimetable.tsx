import React, { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar as CalendarIcon, Search, Download, Filter } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import arLocale from '@fullcalendar/core/locales/ar'
import frLocale from '@fullcalendar/core/locales/fr'
import api from '@shared/lib/api'
import { useTranslation } from 'react-i18next'
import { Button } from '@shared/components/ui/Button'
import { Input } from '@shared/components/ui/Input'

interface TimetableEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    professor: string;
    room: string;
    type: 'CM' | 'TD' | 'TP' | 'EXAM';
    group: string;
  };
  backgroundColor: string;
  borderColor: string;
}

const TYPE_COLORS: Record<string, { bg: string, border: string }> = {
  CM: { bg: 'hsl(var(--color-primary))', border: 'transparent' },
  TD: { bg: '#10b981', border: 'transparent' },
  TP: { bg: '#f59e0b', border: 'transparent' },
  EXAM: { bg: '#ef4444', border: 'transparent' },
};

export default function ModernTimetable() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const [targetType, setTargetType] = useState<'group' | 'professor' | 'room'>('group')
  const [targetId, setTargetId] = useState<string>('1') // default group ID
  const calendarRef = useRef<FullCalendar>(null)

  // In reality, this endpoint would use the `TimetableService` to export FullCalendar compatible events
  const { data, isLoading } = useQuery({
    queryKey: ['timetable', targetType, targetId],
    queryFn: () => api.get(`/timetable`, { params: { [`${targetType}_id`]: targetId } }).then(r => r.data),
  })

  // Format the raw DB response into FullCalendar format
  const formatEvents = (rawSchedules: any[]) => {
    if (!rawSchedules) return []
    // This is a naive formatter assuming rawSchedules has repeating day_of_week
    // A real implementation would map `day_of_week` and `start_time`/`end_time` to actual dates in the current week
    return rawSchedules.map(schedule => {
      // Mocking the date assignment for current week based on day_of_week (1 = Monday)
      const currentDay = new Date().getDay() || 7 // 1-7
      const diff = schedule.day_of_week - currentDay
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + diff)
      
      const dateStr = targetDate.toISOString().split('T')[0]

      return {
        id: schedule.id.toString(),
        title: schedule.module_name,
        start: `${dateStr}T${schedule.start_time}`,
        end: `${dateStr}T${schedule.end_time}`,
        backgroundColor: schedule.module_color || TYPE_COLORS[schedule.type || 'CM'].bg,
        borderColor: 'transparent',
        extendedProps: {
          professor: `${schedule.prof_first_name} ${schedule.prof_last_name}`,
          room: schedule.room_name,
          type: schedule.type || 'CM',
          group: schedule.group_name
        }
      }
    })
  }

  const events = data?.success ? formatEvents(data.data) : []

  const renderEventContent = (eventInfo: any) => {
    return (
      <div className="p-2 h-full flex flex-col gap-1 overflow-hidden text-white drop-shadow-sm w-full">
        <div className="flex flex-row items-center justify-between w-full">
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-black/20 uppercase tracking-widest backdrop-blur-sm shrink-0">
            {eventInfo.event.extendedProps.type}
          </span>
          <span className="text-[10px] font-bold opacity-90 truncate">{eventInfo.timeText}</span>
        </div>
        <p className="text-sm font-bold leading-tight mt-1 truncate">
          {eventInfo.event.title}
        </p>
        <div className="mt-auto flex flex-col opacity-90 text-[10px] font-medium w-full">
          <span className="truncate flex items-center gap-1">👨‍🏫 {eventInfo.event.extendedProps.professor}</span>
          <span className="truncate flex items-center gap-1">📍 {eventInfo.event.extendedProps.room}</span>
        </div>
      </div>
    )
  }

  const customStyles = `
    .fc { font-family: inherit; }
    .fc-theme-standard .fc-scrollgrid { border-color: hsl(var(--border)); border-radius: 1.5rem; overflow: hidden; }
    .fc-theme-standard th { background: hsl(var(--muted)/50); border-color: hsl(var(--border)); padding: 0.75rem 0; font-weight: 700; color: hsl(var(--foreground)); }
    .fc-theme-standard td { border-color: hsl(var(--border)); }
    .fc-timegrid-slot { height: 3.5rem !important; }
    .fc-timegrid-slot-label { font-size: 0.75rem; font-weight: bold; color: hsl(var(--muted-foreground)); }
    .fc-v-event { border-radius: 1rem; border: none; box-shadow: 0 4px 10px rgb(0 0 0 / 0.1); transition: transform 0.2s, z-index 0s; }
    .fc-v-event:hover { transform: scale(1.02); z-index: 50 !important; }
    .fc-button-primary { background: hsl(var(--background)) !important; border: 1px solid hsl(var(--border)) !important; color: hsl(var(--foreground)) !important; border-radius: 0.75rem !important; font-weight: 600 !important; text-transform: capitalize !important; }
    .fc-button-primary:hover { background: hsl(var(--muted)) !important; }
    .fc-button-active { background: hsl(var(--color-primary)) !important; color: white !important; border-color: hsl(var(--color-primary)) !important; }
    .fc-toolbar-title { font-size: 1.5rem !important; font-weight: 800 !important; color: hsl(var(--foreground)) !important; }
  `

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1400px] mx-auto animate-in flex flex-col h-[calc(100vh-80px)]">
      <style>{customStyles}</style>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] flex items-center gap-3">
            <div className="w-10 h-10 bg-[hsl(var(--color-primary))/10] rounded-xl flex items-center justify-center text-[hsl(var(--color-primary))]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            {isRtl ? 'الجدول الزمني العام' : 'Consultation des Emplois du Temps'}
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1 font-medium">
            {isRtl ? 'عرض شامل للجداول الزمنية حسب الفوج، الأستاذ أو القاعة' : 'Vue unifiée des plannings (Groupes, Professeurs, Salles)'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={<Download size={16} />}>
            {isRtl ? 'تحميل PDF' : 'Exporter PDF'}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4 rounded-3xl shrink-0 shadow-sm items-center">
        <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] font-bold text-sm bg-[hsl(var(--muted)/30)] px-4 py-2 rounded-xl">
          <Filter size={16} /> {isRtl ? 'تصفية حسب:' : 'Filtrer par:'}
        </div>
        <select 
          value={targetType} 
          onChange={e => setTargetType(e.target.value as any)}
          className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm font-bold text-[hsl(var(--foreground))] px-4 py-2 outline-none focus:border-[hsl(var(--color-primary))] focus:ring-2 focus:ring-[hsl(var(--color-primary))/20] transition-all min-w-[160px]"
        >
          <option value="group">{isRtl ? 'فوج دراسي' : 'Filière / Groupe'}</option>
          <option value="professor">{isRtl ? 'أستاذ' : 'Professeur'}</option>
          <option value="room">{isRtl ? 'قاعة' : 'Salle'}</option>
        </select>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Input
            icon={<Search size={16} />}
            placeholder={isRtl ? 'ابحث عن الرمز التعريفي...' : 'Saisir l\'identifiant...'}
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
            className="bg-[hsl(var(--background))]"
          />
        </div>
      </div>

      {/* FullCalendar Container */}
      <div className="flex-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 shadow-sm overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
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
          eventContent={renderEventContent}
          height="100%"
          nowIndicator={true}
        />
      </div>
    </div>
  )
}
