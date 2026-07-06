import React, { useState } from 'react';
import { Calendar as CalendarIcon, Download, Link as LinkIcon, FileText, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function StudentSchedule() {
  const [view, setView] = useState<'MOIS' | 'SEMAINE' | 'JOUR' | 'LISTE'>('SEMAINE');

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-[#003a8c] rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#003a8c] italic">Mon Emploi du Temps</h1>
            <p className="text-white/50 font-medium">Semaine du 22/06 au 28/06/2026</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-[#001A4B] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#003a8c] transition-colors shadow-sm">
            <FileText className="w-4 h-4" /> EXPORTER PDF
          </button>
          <button className="flex items-center gap-2 bg-[#003a8c] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors shadow-sm">
            <CalendarIcon className="w-4 h-4" /> Télécharger iCal
          </button>
          <button className="flex items-center gap-2 bg-[#003a8c] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors shadow-sm">
            <LinkIcon className="w-4 h-4" /> Lien de Synchro
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-[#0b1021] rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl border border-white/10">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        
        <div className="relative z-10 flex-1">
          <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">EMPLOI DU TEMPS PERSONNEL</div>
          <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-400" /> Génie Informatique - Groupe 1
          </h2>
          <div className="flex items-center gap-2 text-gray-300 font-medium text-sm">
            <BookOpen className="w-4 h-4" /> Génie Informatique
          </div>
          <p className="text-gray-400 mt-2 text-sm">Planning hebdomadaire récurrent â€” mis Ã  jour par l'administration.</p>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center min-w-[100px] backdrop-blur-md">
            <div className="text-3xl font-black text-white">6</div>
            <div className="text-[9px] font-bold text-white/60 uppercase tracking-widest mt-1">SÉANCES / SEM.</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[100px] backdrop-blur-md">
            <div className="text-3xl font-black text-white/80">6</div>
            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">MODULES</div>
          </div>
        </div>
      </div>

      {/* Calendar UI */}
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-white/5">
        
        {/* Calendar Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <button className="p-2 bg-white/[0.02] border border-white/10 rounded-lg hover:bg-white/[0.05] transition-colors">
              <ChevronLeft className="w-5 h-5 text-white/70" />
            </button>
            <button className="p-2 bg-white/[0.02] border border-white/10 rounded-lg hover:bg-white/[0.05] transition-colors">
              <ChevronRight className="w-5 h-5 text-white/70" />
            </button>
            <button className="px-4 py-2 bg-white/[0.02] border border-white/10 rounded-lg text-xs font-bold text-white/80 hover:bg-white/[0.05] transition-colors uppercase tracking-widest">
              AUJOURD'HUI
            </button>
          </div>
          
          <h2 className="text-xl font-black text-[#001A4B] italic">22 â€“ 27 juin 2026</h2>
          
          <div className="flex bg-white/[0.02] p-1 rounded-xl border border-white/10">
            {['MOIS', 'SEMAINE', 'JOUR', 'LISTE'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as any)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  view === v 
                    ? "bg-[#003a8c] text-white shadow-sm" 
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid (Mockup) */}
        <div className="border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.02]">
              <div className="p-3"></div> {/* Time Column */}
              <div className="p-3 text-center border-l border-white/10 text-xs font-bold text-white/70">LUN. 22/06</div>
              <div className="p-3 text-center border-l border-white/10 text-xs font-bold text-white/70">MAR. 23/06</div>
              <div className="p-3 text-center border-l border-white/10 text-xs font-bold text-white/70">MER. 24/06</div>
              <div className="p-3 text-center border-l border-white/10 text-xs font-bold text-[#003a8c] bg-blue-50/50">JEU. 25/06</div>
              <div className="p-3 text-center border-l border-white/10 text-xs font-bold text-white/70">VEN. 26/06</div>
              <div className="p-3 text-center border-l border-white/10 text-xs font-bold text-white/70">SAM. 27/06</div>
            </div>
            
            {/* Time Grid */}
            <div className="relative h-[600px] bg-white">
              {/* Background Lines */}
              {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((hour) => (
                <div key={hour} className="absolute w-full border-t border-white/5 flex h-[60px]" style={{ top: `${(hour - 8) * 60}px` }}>
                  <div className="w-[14.28%] text-xs font-bold text-gray-400 -mt-2.5 pl-2">{hour}:00</div>
                  <div className="w-[14.28%] border-l border-white/5"></div>
                  <div className="w-[14.28%] border-l border-white/5"></div>
                  <div className="w-[14.28%] border-l border-white/5"></div>
                  <div className="w-[14.28%] border-l border-white/5 bg-amber-50/30"></div> {/* Today Highlight */}
                  <div className="w-[14.28%] border-l border-white/5"></div>
                  <div className="w-[14.28%] border-l border-white/5"></div>
                </div>
              ))}

              {/* Mock Events */}
              <div className="absolute top-[60px] left-[14.28%] w-[14.28%] h-[90px] p-1">
                <div className="bg-blue-100 border-l-4 border-blue-500 w-full h-full rounded p-2 text-xs overflow-hidden">
                  <div className="font-bold text-blue-900">Programmation C</div>
                  <div className="text-blue-700">Amphi A</div>
                  <div className="text-blue-600">09:00 - 10:30</div>
                </div>
              </div>
              
              <div className="absolute top-[180px] left-[28.56%] w-[14.28%] h-[120px] p-1">
                <div className="bg-emerald-100 border-l-4 border-emerald-500 w-full h-full rounded p-2 text-xs overflow-hidden">
                  <div className="font-bold text-emerald-900">Bases de données</div>
                  <div className="text-emerald-700">Salle T1</div>
                  <div className="text-emerald-600">11:00 - 13:00</div>
                </div>
              </div>

              <div className="absolute top-[300px] left-[57.12%] w-[14.28%] h-[90px] p-1">
                <div className="bg-purple-100 border-l-4 border-purple-500 w-full h-full rounded p-2 text-xs overflow-hidden">
                  <div className="font-bold text-purple-900">Réseaux Informatiques</div>
                  <div className="text-purple-700">Labo 3</div>
                  <div className="text-purple-600">13:00 - 14:30</div>
                </div>
              </div>
              
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
