import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Search, Plus, Filter } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import api from '@/shared/lib/api';
import { useTranslation } from 'react-i18next';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

const TYPE_COLORS = {
  CM: { bg: '#3b82f6', border: '#2563eb' },
  TD: { bg: '#10b981', border: '#059669' },
  TP: { bg: '#f59e0b', border: '#d97706' },
  EXAM: { bg: '#ef4444', border: '#dc2626' },
};

const MOCK_EVENTS: TimetableEvent[] = [
  {
    id: '1',
    title: 'Comptabilité Approfondie',
    start: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    extendedProps: {
      professor: 'Pr. BENCHEKROUN',
      room: 'Amphi A',
      type: 'CM',
      group: 'GFC',
    },
    backgroundColor: TYPE_COLORS.CM.bg,
    borderColor: TYPE_COLORS.CM.border,
  },
  {
    id: '2',
    title: 'Marketing Stratégique',
    start: new Date(new Date().setHours(10, 15, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(12, 15, 0, 0)).toISOString(),
    extendedProps: {
      professor: 'Pr. ALAOUI',
      room: 'Salle 201',
      type: 'TD',
      group: 'MCM-G1',
    },
    backgroundColor: TYPE_COLORS.TD.bg,
    borderColor: TYPE_COLORS.TD.border,
  },
];

const ModernTimetable: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const [viewState, setViewState] = useState<'timeGridWeek' | 'timeGridDay' | 'dayGridMonth'>('timeGridWeek');
  const [targetType, setTargetType] = useState<'group' | 'professor' | 'room'>('group');
  const [targetId, setTargetId] = useState<string>('GFC');
  const calendarRef = useRef<FullCalendar>(null);

  const { data } = useQuery({
    queryKey: ['fullcalendar', targetType, targetId],
    queryFn: () => api.get(`/timetable/export/${targetType}/${targetId}`).then(r => r.data),
    placeholderData: { data: MOCK_EVENTS }
  });

  const events = data?.data ?? MOCK_EVENTS;

  const renderEventContent = (eventInfo: any) => {
    return (
      <div className="p-1 h-full flex flex-col gap-0.5 overflow-hidden text-white/90">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold px-1.5 rounded bg-black/20">
            {eventInfo.event.extendedProps.type}
          </span>
          <span className="text-[10px] opacity-80">{eventInfo.timeText}</span>
        </div>
        <p className="text-xs font-bold leading-tight mt-0.5 truncate">
          {eventInfo.event.title}
        </p>
        <div className="mt-auto flex flex-col opacity-80">
          <span className="text-[10px] truncate">{eventInfo.event.extendedProps.professor}</span>
          <span className="text-[10px] truncate">{eventInfo.event.extendedProps.room}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon size={20} className="text-primary" />
            Emploi du temps
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Vue interactive de FullCalendar</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-sm text-white font-medium bg-primary hover:bg-primary/90 px-4 py-2 rounded-xl transition-all">
            <Plus size={14} /> Ajouter séance
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 bg-card border border-border p-3 rounded-2xl shrink-0">
        <select 
          value={targetType} 
          onChange={e => setTargetType(e.target.value as any)}
          className="bg-muted border border-border rounded-xl text-sm text-foreground px-3 py-2 outline-none focus:border-primary/50"
        >
          <option value="group">Filière / Groupe</option>
          <option value="professor">Professeur</option>
          <option value="room">Salle</option>
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* FullCalendar Container */}
      <div className="flex-1 bg-card border border-border rounded-2xl p-4 overflow-hidden fc-dark-theme">
        <style dangerouslySetInnerHTML={{__html: `
          .fc-theme-standard .fc-scrollgrid { border-color: hsl(var(--border)); }
          .fc-theme-standard td, .fc-theme-standard th { border-color: hsl(var(--border)); }
          .fc-col-header-cell-cushion { color: hsl(var(--foreground)); padding: 8px !important; }
          .fc-timegrid-axis-cushion, .fc-timegrid-slot-label-cushion { color: hsl(var(--muted-foreground)); }
          .fc-timegrid-slot { height: 40px !important; }
          .fc-event { border-radius: 8px; border: none; padding: 2px; transition: transform 0.1s; }
          .fc-event:hover { transform: scale(1.02); z-index: 10 !important; }
          .fc-toolbar-title { color: hsl(var(--foreground)); font-size: 1.2rem !important; }
          .fc-button-primary { background-color: hsl(var(--primary)) !important; border-color: hsl(var(--primary)) !important; }
          .fc-button-primary:hover { background-color: hsl(var(--primary) / 0.9) !important; }
          .fc-button-active { background-color: hsl(var(--primary) / 0.8) !important; }
        `}} />
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={viewState}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          locale={i18n.language === 'ar' ? 'ar' : frLocale}
          events={events}
          eventContent={renderEventContent}
          slotMinTime="08:00:00"
          slotMaxTime="19:00:00"
          allDaySlot={false}
          weekends={true}
          hiddenDays={[0]} // Hide Sunday
          height="100%"
          editable={true} // Enable Drag & Drop
          droppable={true}
          eventDrop={(info) => {
            console.log(info.event.title + " was dropped on " + info.event.start);
            // API call to update backend would go here
          }}
        />
      </div>
    </div>
  );
};

export default ModernTimetable;
