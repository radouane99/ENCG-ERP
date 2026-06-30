import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function TimetableAdminView() {
  const calendarRef = useRef<FullCalendar>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<any>(null);

  // MOCK DATA for Demo purposes (Replace with actual queries later)
  const [events, setEvents] = useState([
    {
      id: '1',
      title: 'Fiscalité d\'Entreprise\nAmphi A\nPr. El Fassi',
      start: '2026-10-12T08:30:00',
      end: '2026-10-12T10:30:00',
      backgroundColor: '#1F3A5F',
      extendedProps: { roomId: 1, profId: 1, groupId: 1 }
    },
    {
      id: '2',
      title: 'Algèbre Linéaire\nSalle 302\nPr. Bennani',
      start: '2026-10-13T10:45:00',
      end: '2026-10-13T12:45:00',
      backgroundColor: '#A80A0B',
      extendedProps: { roomId: 2, profId: 2, groupId: 1 }
    }
  ]);

  const generateTimetable = async () => {
    setIsGenerating(true);
    try {
      // Fake delay to simulate AI constraint solving
      await new Promise(r => setTimeout(r, 2000));
      
      const res = await api.post('/timetable/generate', {
        institution_id: 1,
        academic_year_id: 1,
        semester_id: 1,
        filiere_id: 1
      });

      toast.success(res.data.message || 'Emploi du temps généré avec succès !');
      // In reality, refetch events here
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la génération.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEventDrop = async (info: any) => {
    const { event } = info;
    
    // Compute new day (1=Mon) and time
    const newDay = event.start.getDay() === 0 ? 7 : event.start.getDay();
    const newStart = event.start.toTimeString().split(' ')[0];
    const newEnd = event.end.toTimeString().split(' ')[0];

    try {
      const res = await api.post('/timetable/check-conflict', {
        schedule_id: parseInt(event.id),
        new_day: newDay,
        new_start_time: newStart,
        new_end_time: newEnd,
        new_room_id: event.extendedProps.roomId // Keep same room for now
      });

      if (res.data.success) {
        toast.success('Mouvement validé.');
      } else {
        // Revert move
        info.revert();
        // Show Conflict Modal
        setConflictDetails({
          message: res.data.message,
          suggestions: res.data.suggestions
        });
        setConflictModalOpen(true);
      }
    } catch (error) {
      info.revert();
      toast.error('Erreur de validation réseau.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            Smart Timetabling
          </h1>
          <p className="text-muted-foreground mt-1">
            Génération algorithmique et gestion intelligente des emplois du temps.
          </p>
        </div>
        
        <button
          onClick={generateTimetable}
          disabled={isGenerating}
          className="bg-[#A80A0B] hover:bg-[#7D0809] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-70"
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Cpu className="w-5 h-5" />
          )}
          {isGenerating ? 'Calcul en cours...' : 'Génération Automatique IA'}
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay'
          }}
          locale="fr"
          hiddenDays={[0]} // Hide Sunday
          slotMinTime="08:00:00"
          slotMaxTime="19:00:00"
          allDaySlot={false}
          events={events}
          editable={true} // Enable Drag & Drop
          droppable={true}
          eventDrop={handleEventDrop}
          height="auto"
          eventClassNames="rounded-md border-none px-1 text-xs shadow-sm"
        />
      </div>

      {/* Conflict Modal */}
      {conflictModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl p-6 shadow-xl border border-border">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <AlertTriangle className="w-8 h-8" />
              <h2 className="text-xl font-bold text-foreground">Conflit Détecté</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Le système a refusé ce déplacement : {conflictDetails?.message}
            </p>
            
            <h3 className="font-semibold text-sm mb-3">L'IA vous suggère ces alternatives :</h3>
            <div className="space-y-3 mb-6">
              {conflictDetails?.suggestions?.length > 0 ? (
                conflictDetails.suggestions.map((sug: any, i: number) => (
                  <div key={i} className="flex justify-between items-center border border-border rounded-lg p-3 hover:bg-muted/30 cursor-pointer">
                    <div>
                      <p className="font-medium">Même Horaire, Autre Salle</p>
                      <p className="text-sm text-muted-foreground">Salle: {sug.room_name}</p>
                    </div>
                    <button className="text-primary text-sm font-medium hover:underline">
                      Appliquer
                    </button>
                  </div>
                ))
              ) : (
                <div className="bg-muted/30 p-4 rounded-lg text-sm text-muted-foreground text-center">
                  Aucune alternative trouvée pour ce créneau.
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setConflictModalOpen(false)}
                className="bg-muted text-foreground px-4 py-2 rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                Annuler le déplacement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
