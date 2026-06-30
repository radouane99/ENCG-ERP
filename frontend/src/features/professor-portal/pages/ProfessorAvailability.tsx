import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function ProfessorAvailability() {
  const [availability, setAvailability] = useState<Record<string, { matin: boolean, apresMidi: boolean }>>({
    Lundi: { matin: false, apresMidi: true },
    Mardi: { matin: false, apresMidi: false },
    Mercredi: { matin: true, apresMidi: false },
    Jeudi: { matin: true, apresMidi: false },
    Vendredi: { matin: false, apresMidi: true },
    Samedi: { matin: false, apresMidi: false },
  });

  const toggleSlot = (day: string, slot: 'matin' | 'apresMidi') => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: !prev[day][slot]
      }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 font-sans animate-in fade-in zoom-in duration-500">
      
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Soumis</span>
          </div>
          <h1 className="text-2xl font-black text-[#001A4B]">Disponibilité pour S1 (Normal)</h1>
          <p className="text-sm text-white/50 mt-1">Requête générée le 07/06/2026</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div></div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Matin (09H-12H)</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Après-Midi (14H-17H)</div>
        </div>

        <div className="space-y-3">
          {Object.entries(availability).map(([day, slots]) => (
            <div key={day} className="grid grid-cols-3 gap-4 items-center">
              <div className="font-bold text-white/80">{day}</div>
              
              <button 
                onClick={() => toggleSlot(day, 'matin')}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border",
                  slots.matin 
                    ? "bg-[#003a8c] text-white border-[#003a8c] shadow-lg shadow-blue-900/20" 
                    : "bg-white/[0.02] text-gray-400 border-white/10 hover:bg-white/[0.05]"
                )}
              >
                {slots.matin ? <><Check className="w-4 h-4" /> Disponible</> : 'Indisponible'}
              </button>

              <button 
                onClick={() => toggleSlot(day, 'apresMidi')}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border",
                  slots.apresMidi 
                    ? "bg-[#003a8c] text-white border-[#003a8c] shadow-lg shadow-blue-900/20" 
                    : "bg-white/[0.02] text-gray-400 border-white/10 hover:bg-white/[0.05]"
                )}
              >
                {slots.apresMidi ? <><Check className="w-4 h-4" /> Disponible</> : 'Indisponible'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contraintes ou remarques particulières (Optionnel)</label>
          <textarea 
            rows={4}
            placeholder="Ex: Impossible de surveiller au bloc C le mardi..."
            className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-sm font-medium text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          ></textarea>
        </div>

        <div className="mt-8 flex justify-end">
          <button className="bg-[#003a8c] hover:bg-[#002a66] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20">
            <Check className="w-5 h-5" /> Mettre Ã  jour
          </button>
        </div>

      </div>
    </div>
  );
}
