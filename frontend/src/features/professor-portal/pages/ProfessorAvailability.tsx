import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Clock, Calendar, AlertCircle, Save, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function ProfessorAvailability() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const queryClient = useQueryClient();

  const [availability, setAvailability] = useState<Record<string, { matin: boolean; apresMidi: boolean }>>({
    Lundi: { matin: true, apresMidi: true },
    Mardi: { matin: true, apresMidi: true },
    Mercredi: { matin: true, apresMidi: false },
    Jeudi: { matin: true, apresMidi: true },
    Vendredi: { matin: false, apresMidi: true },
    Samedi: { matin: false, apresMidi: false },
  });

  const [notes, setNotes] = useState('');

  // Fetch my availability from real backend
  const { data: availData, isLoading } = useQuery({
    queryKey: ['my-availability'],
    queryFn: async () => {
      const res = await api.get('/professor-availability/my');
      return res.data.data;
    }
  });

  useEffect(() => {
    if (availData?.availability) {
      setAvailability(availData.availability);
      if (availData.notes) setNotes(availData.notes);
    }
  }, [availData]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/professor-availability/my', {
        availability,
        notes,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Vos disponibilités ont été enregistrées avec succès !', {
        description: 'Pris en compte instantanément par le Moteur CSP d\'Emploi du Temps.'
      });
      queryClient.invalidateQueries({ queryKey: ['my-availability'] });
    },
    onError: (err: any) => {
      toast.error('Erreur lors de l\'enregistrement', {
        description: err.response?.data?.message || err.message
      });
    }
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

  const setAllDays = (val: boolean) => {
    const updated: Record<string, { matin: boolean; apresMidi: boolean }> = {};
    Object.keys(availability).forEach(d => {
      updated[d] = { matin: val, apresMidi: val };
    });
    setAvailability(updated);
  };

  const countAvailableSlots = Object.values(availability).reduce((acc, curr) => {
    return acc + (curr.matin ? 1 : 0) + (curr.apresMidi ? 1 : 0);
  }, 0);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in duration-500 pb-28">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] rounded-3xl p-8 text-white shadow-xl border border-indigo-900/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {availData?.status || 'Soumis'}
              </span>
              <span className="text-xs font-bold text-slate-300">
                {availData?.session_name || "Session d'Automne 2026/2027"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Déclaration des Disponibilités & Contraintes</h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium">
              Indiquez vos créneaux libres pour la planification des cours et des surveillances d'examens (Intégré au Solver CSP).
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center shrink-0">
            <div className="text-[10px] font-bold uppercase text-indigo-200 tracking-wider">Créneaux Disponibles</div>
            <div className="text-3xl font-black text-white">{countAvailableSlots} / 12</div>
            <div className="text-[10px] text-emerald-300 font-bold mt-0.5">Semaine active</div>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" /> Grille Hebdomadaire des Créneaux
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Cliquez sur un créneau pour basculer entre Disponible et Indisponible.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAllDays(true)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-extrabold transition-colors"
            >
              Tout Déclarer Disponible
            </button>
            <button
              type="button"
              onClick={() => setAllDays(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-extrabold transition-colors"
            >
              Tout Déclarer Indisponible
            </button>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs font-black uppercase tracking-wider text-slate-400 pb-2">
          <div className="text-left pl-2">Jour de la Semaine</div>
          <div className="bg-slate-50 py-2 rounded-xl border border-slate-100">Matin (08H30 - 12H45)</div>
          <div className="bg-slate-50 py-2 rounded-xl border border-slate-100">Après-Midi (14H30 - 18H45)</div>
        </div>

        {/* Days List */}
        <div className="space-y-3">
          {Object.entries(availability).map(([day, slots]) => (
            <div key={day} className="grid grid-cols-3 gap-4 items-center p-2 rounded-2xl hover:bg-slate-50/80 transition-colors">
              <div className="font-black text-sm text-slate-800 pl-2">{day}</div>
              
              <button 
                type="button"
                onClick={() => toggleSlot(day, 'matin')}
                className={cn(
                  "w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm cursor-pointer",
                  slots.matin 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/20" 
                    : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                )}
              >
                {slots.matin ? <><Check className="w-4 h-4" /> Disponible</> : 'Indisponible'}
              </button>

              <button 
                type="button"
                onClick={() => toggleSlot(day, 'apresMidi')}
                className={cn(
                  "w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm cursor-pointer",
                  slots.apresMidi 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/20" 
                    : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                )}
              >
                {slots.apresMidi ? <><Check className="w-4 h-4" /> Disponible</> : 'Indisponible'}
              </button>
            </div>
          ))}
        </div>

        {/* Constraints Textarea */}
        <div className="pt-6 border-t border-slate-100 space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
            Contraintes Pédagogiques ou Remarques Spécifiques (Optionnel)
          </label>
          <textarea 
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex : Créneau du vendredi matin réservé aux réunions de laboratoire de recherche CEDOC / Déplacement à Tanger le mardi..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
          ></textarea>
        </div>

        {/* Submit Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <div className="text-xs text-slate-400 font-medium">
            Dernière mise à jour : {availData?.updated_at || 'Aujourd\'hui'}
          </div>

          <button 
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#001A4B] to-indigo-900 hover:opacity-95 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-950/20 disabled:opacity-50 cursor-pointer"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-amber-400" />}
            Enregistrer mes Disponibilités
          </button>
        </div>

      </div>
    </div>
  );
}
