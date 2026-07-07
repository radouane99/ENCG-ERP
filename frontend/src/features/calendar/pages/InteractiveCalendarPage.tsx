import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery } from '@tanstack/react-query';
import { fetchCalendarEvents } from '../api/calendarApi';
import { renderEventContent } from '../components/EventContent';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/Card';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

import { toast } from 'sonner';
import { moveCalendarEvent } from '../api/calendarApi';

export default function InteractiveCalendarPage({ isAdmin = false }: { isAdmin?: boolean }) {
  const [dateRange, setDateRange] = useState({
    start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  });

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['calendar-events', dateRange],
    queryFn: () => fetchCalendarEvents(dateRange.start, dateRange.end),
  });

  const handleDatesSet = (dateInfo: any) => {
    setDateRange({
      start: dateInfo.startStr.split('T')[0],
      end: dateInfo.endStr.split('T')[0]
    });
  };

  const handleEventDrop = (info: any) => {
    if (!isAdmin) {
      info.revert();
      return;
    }

    const { event, oldEvent } = info;
    const oldDate = oldEvent.startStr.split('T')[0];
    const newDate = event.startStr.split('T')[0];
    
    // Time extraction handling whether it's an ISO string or just a date
    const newStartTime = event.startStr.includes('T') ? event.startStr.split('T')[1].substring(0, 8) : '08:00:00';
    const newEndTime = event.endStr ? event.endStr.split('T')[1].substring(0, 8) : '10:00:00';

    const promise = moveCalendarEvent({
      event_id: event.id,
      old_date: oldDate,
      new_date: newDate,
      new_start_time: newStartTime,
      new_end_time: newEndTime
    }).then(() => refetch());

    toast.promise(promise, {
      loading: 'Déplacement du cours...',
      success: 'Cours déplacé avec succès !',
      error: 'Erreur lors du déplacement.'
    });

    promise.catch(() => {
      info.revert();
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-primary" />
              {isAdmin ? 'Gestion des Emplois du Temps' : 'Mon Emploi du Temps'}
            </CardTitle>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Actualisation...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="bg-white rounded-lg p-4 shadow-inner min-h-[600px]">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              locales={[{ code: 'fr', buttonText: { today: "Aujourd'hui", month: 'Mois', week: 'Semaine', day: 'Jour' } }]}
              locale="fr"
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              weekends={true}
              hiddenDays={[0]} // Hide Sunday if desired, ENCG usually has classes Mon-Sat
              events={events}
              eventContent={renderEventContent}
              datesSet={handleDatesSet}
              editable={isAdmin}
              droppable={isAdmin}
              eventDrop={handleEventDrop}
              height="auto"
              nowIndicator={true}
              eventClassNames="rounded-md shadow-sm border-0 cursor-pointer transition-transform hover:scale-[1.02]"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500"></div> Cours Magistral (CM)
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500"></div> Travaux Dirigés (TD)
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500"></div> Rattrapage
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div> Examen
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-violet-500"></div> Surveillance
        </div>
      </div>
    </div>
  );
}
