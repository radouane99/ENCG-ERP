import React, { useState } from 'react';
import { Building2, Calendar, DollarSign, LibraryBig } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function AdminClubsPage() {
  const [activeTab, setActiveTab] = useState('salles');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div>
        <div className="flex items-center gap-3">
          <LibraryBig className="w-6 h-6 text-gray-400" />
          <h1 className="text-2xl font-black italic tracking-tight text-[#002a7a]">Gestion des Clubs</h1>
        </div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1 ml-9">
          0 Club(s) enregistré(s)
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab('salles')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border",
            activeTab === 'salles' 
              ? "bg-white border-white/10 text-white shadow-sm" 
              : "bg-transparent border-transparent text-white/50 hover:text-white"
          )}
        >
          <Building2 className="w-4 h-4" />
          Demandes de Salles
        </button>
        <button
          onClick={() => setActiveTab('calendrier')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border",
            activeTab === 'calendrier' 
              ? "bg-white border-white/10 text-white shadow-sm" 
              : "bg-transparent border-transparent text-white/50 hover:text-white"
          )}
        >
          <Calendar className="w-4 h-4 text-blue-500" />
          Calendrier des Salles
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border",
            activeTab === 'budget' 
              ? "bg-white border-white/10 text-white shadow-sm" 
              : "bg-transparent border-transparent text-white/50 hover:text-white"
          )}
        >
          <DollarSign className="w-4 h-4 text-amber-500" />
          Demandes de Budget
        </button>
      </div>

      <div className="bg-white rounded-3xl p-16 shadow-sm border border-white/5/50 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-white/[0.02] rounded-2xl flex items-center justify-center mb-4">
          <LibraryBig className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-[#002a7a] mb-2">Aucun club enregistré</h3>
        <p className="text-sm text-gray-400">Les clubs créés par les étudiants apparaîtront ici.</p>
      </div>
    </div>
  );
}
