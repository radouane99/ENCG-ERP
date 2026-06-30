import React from 'react';
import { Calendar as CalendarIcon, Clock, BookOpen, Building, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function CalendarPage() {
  const days = [
    { name: 'LUN.', date: '22/06' },
    { name: 'MAR.', date: '23/06' },
    { name: 'MER.', date: '24/06' },
    { name: 'JEU.', date: '25/06' },
    { name: 'VEN.', date: '26/06' },
    { name: 'SAM.', date: '27/06' },
    { name: 'DIM.', date: '28/06' },
  ];

  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 to 17

  const events = [
    {
      day: 0, // LUN
      start: 8.5, // 08:30
      duration: 2, // 2 hours
      title: 'Introduction - Génie Informatique',
      room: 'Amphi Ibn Khaldoun',
      color: 'bg-[#003a8c]'
    },
    {
      day: 0, // LUN
      start: 10.75, // 10:45
      duration: 1.25, // 1h15
      title: 'Avancé - Génie Informatique',
      room: '',
      color: 'bg-amber-500'
    },
    {
      day: 1, // MAR
      start: 8.5, // 08:30
      duration: 1.75, // 1h45
      title: 'GAMING',
      room: 'Amphi Al Khwarizmi',
      color: 'bg-emerald-600'
    },
    {
      day: 1, // MAR
      start: 10.5, // 10:30
      duration: 2, // 2h
      title: 'Développement mobile',
      room: 'Amphi Ibn Khaldoun',
      color: 'bg-[#003a8c]'
    },
    {
      day: 2, // MER
      start: 8.0, // 08:00
      duration: 2, // 2h
      title: 'GAMING',
      room: 'Amphi Ibn Khaldoun',
      color: 'bg-emerald-600'
    },
    {
      day: 3, // JEU
      start: 9.0, // 09:00
      duration: 2, // 2h
      title: 'SQL SERVER BASE DE DONNEE',
      room: 'Amphi Ibn Khaldoun',
      color: 'bg-amber-500'
    },
    {
      day: 3, // JEU
      start: 14.0, // 14:00
      duration: 2, // 2h
      title: 'Développement mobile LARAVEL',
      room: 'Amphi Ibn Khaldoun',
      color: 'bg-emerald-600'
    },
    {
      day: 4, // VEN
      start: 8.5, // 08:30
      duration: 1.75, // 1h45
      title: 'Intelligent Artificiel',
      room: 'Amphi Ibn Khaldoun',
      color: 'bg-cyan-600'
    },
    {
      day: 4, // VEN
      start: 13.0, // 13:00
      duration: 2, // 2h
      title: 'Intelligent Artificiel',
      room: 'Amphi Ibn Khaldoun',
      color: 'bg-cyan-600'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-[#003a8c] italic flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-[#003a8c]" /> Calendrier Académique
        </h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-white/10 text-white/80 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-white/[0.02] transition-colors shadow-sm">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
            Google
          </button>
          <button className="flex items-center gap-2 bg-[#0078D4] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#006abc] transition-colors shadow-sm">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M1 3.541v16.918l12.871 3.424V.118L1 3.541zM23 3.992h-8.081v3.275H23v-3.275zm0 4.606h-8.081v3.275H23V8.598zm0 4.606h-8.081v3.275H23v-3.275zm0 4.606h-8.081v3.275H23v-3.275z"/></svg>
            Outlook
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-blue-100">
            ðŸ“…
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SÉANCES / SEMAINE</div>
            <div className="text-2xl font-black text-[#003a8c]">9</div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-pink-100">
            ðŸ“š
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MODULES</div>
            <div className="text-2xl font-black text-[#003a8c]">7</div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-purple-100">
            â±ï¸
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">H / SEMAINE</div>
            <div className="text-2xl font-black text-[#003a8c]">17h</div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-amber-100">
            ðŸ«
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SALLES</div>
            <div className="text-2xl font-black text-[#003a8c]">2</div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5">
        
        {/* Calendar Header Controls */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-black text-[#003a8c] italic">Mon Emploi du Temps</h2>
            <p className="text-xs text-gray-400">Cliquez sur un cours pour voir les détails</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <button className="w-10 h-10 bg-[#003a8c] text-white rounded-xl flex items-center justify-center hover:bg-[#002a66] transition-colors shadow-sm">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-[#003a8c] text-white rounded-xl flex items-center justify-center hover:bg-[#002a66] transition-colors shadow-sm">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button className="px-4 h-10 bg-[#003a8c] text-white rounded-xl flex items-center justify-center text-xs font-bold uppercase hover:bg-[#002a66] transition-colors shadow-sm ml-2">
                AUJ.
              </button>
            </div>
            
            <div className="text-xl font-black text-[#003a8c] px-8">
              22 - 28 JUIN 2026
            </div>
            
            <div className="flex gap-2">
              <button className="px-4 h-10 bg-[#e6007e] text-white rounded-xl flex items-center justify-center text-xs font-bold uppercase transition-colors shadow-sm">
                SEMAINE
              </button>
              <button className="px-4 h-10 bg-[#003a8c] text-white rounded-xl flex items-center justify-center text-xs font-bold uppercase hover:bg-[#002a66] transition-colors shadow-sm">
                JOUR
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SEMESTRE :</span>
            <span className="px-3 py-1.5 border border-white/10 rounded-lg text-xs font-bold text-white/80">TOUS LES SEMESTRES</span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 ml-4 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Chargé
            </span>
          </div>
        </div>

        {/* The Grid */}
        <div className="relative border-t border-l border-white/5 rounded-tl-xl overflow-hidden" style={{ minHeight: '600px' }}>
          {/* Days Header */}
          <div className="grid grid-cols-7 ml-16 border-b border-white/5">
            {days.map((day, idx) => (
              <div key={idx} className="text-center py-4 border-r border-white/5 bg-white/[0.02]/50">
                <div className={cn(
                  "text-[11px] font-bold uppercase tracking-wider",
                  day.name === 'JEU.' ? 'text-[#003a8c]' : 'text-white/50'
                )}>{day.name} {day.date}</div>
              </div>
            ))}
          </div>

          {/* Time Rows */}
          <div className="relative">
            {hours.map((hour, idx) => (
              <div key={idx} className="flex border-b border-white/5 h-24">
                <div className="w-16 flex-shrink-0 text-center py-2 border-r border-white/5">
                  <span className="text-xs font-bold text-gray-400">{hour} H</span>
                </div>
                <div className="flex-1 grid grid-cols-7">
                  {[0,1,2,3,4,5,6].map(d => (
                    <div key={d} className="border-r border-white/5 h-full relative">
                      {/* Empty cell */}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Events positioned absolutely */}
            {events.map((event, idx) => {
              const topOffset = (event.start - 8) * 6; // 6rem per hour (h-24 = 6rem)
              const height = event.duration * 6;
              const leftOffset = event.day * (100 / 7);
              
              return (
                <div 
                  key={idx}
                  className={cn(
                    "absolute p-2 mx-1 rounded-xl shadow-sm border border-black/5 text-white overflow-hidden hover:shadow-md transition-shadow cursor-pointer",
                    event.color
                  )}
                  style={{
                    top: `${topOffset}rem`,
                    height: `${height}rem`,
                    left: `calc(4rem + ${leftOffset}%)`, // 4rem is the 16 w-16
                    width: `calc(${100/7}% - 0.5rem)`
                  }}
                >
                  <div className="text-[10px] font-bold opacity-90 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor(event.start)}:{((event.start % 1) * 60).toString().padStart(2, '0')} - 
                    {Math.floor(event.start + event.duration)}:{(((event.start + event.duration) % 1) * 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs font-bold leading-tight mb-2">
                    {event.title}
                  </div>
                  {event.room && (
                    <div className="text-[9px] font-medium opacity-80 flex items-center gap-1 mt-auto absolute bottom-2 left-2">
                      <div className="w-1 h-1 rounded-full bg-white opacity-50"></div>
                      {event.room}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>

    </div>
  );
}
