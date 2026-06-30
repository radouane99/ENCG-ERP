import React from 'react';
import { Building2, Plus } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function ProfessorReservations() {
  const reservations = [
    {
      id: 1,
      room: 'Salle TD 01',
      type: 'SOUTENANCE',
      date: '29 May 2026',
      time: '12:30 - 14:00',
      code: 'UPF-1',
      status: 'APPROUVÉE',
      statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-white/5">
            <Building2 className="w-6 h-6 text-[#003a8c]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#001A4B] italic">Réservations d'Infrastructures</h1>
            <p className="text-sm text-white/50">Réservez des salles et des laboratoires pour vos sessions académiques spécifiques.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-[#003a8c] hover:bg-[#002a66] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-blue-900/20">
          <Plus className="w-4 h-4" /> NOUVELLE RÉSERVATION
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5">
        
        {/* Table Header */}
        <div className="grid grid-cols-4 mb-6 pb-2 border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">
          <div>SALLE RÉSERVÉE</div>
          <div>HORAIRE</div>
          <div className="text-center">CODE SÉCURITÉ</div>
          <div className="text-right">STATUT</div>
        </div>

        {/* Table Body */}
        <div className="space-y-4">
          {reservations.map((res) => (
            <div key={res.id} className="grid grid-cols-4 items-center p-4 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100/50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-200/50">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white">{res.room}</div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-0.5">{res.type}</div>
                </div>
              </div>
              
              <div>
                <div className="text-xs font-bold text-white">{res.date}</div>
                <div className="text-[10px] font-bold text-gray-400 mt-0.5">{res.time}</div>
              </div>

              <div className="text-center">
                <span className="text-[10px] font-bold text-gray-400 tracking-widest">{res.code}</span>
              </div>

              <div className="text-right flex justify-end">
                <span className={cn(
                  "px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest",
                  res.statusColor
                )}>
                  {res.status}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
