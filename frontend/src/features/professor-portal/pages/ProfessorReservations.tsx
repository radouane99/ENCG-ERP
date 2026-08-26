import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Plus, Calendar, Clock, CheckCircle2, AlertCircle, Loader2, X, Send, Sparkles } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';
import { toast } from 'sonner';

export default function ProfessorReservations() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [roomId, setRoomId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('14:30');
  const [endTime, setEndTime] = useState('16:30');
  const [purpose, setPurpose] = useState('');

  // Fetch Professor's Reservations
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['professor-reservations'],
    queryFn: async () => {
      const res = await api.get('/professor-portal/reservations');
      return res.data.data || [];
    }
  });

  // Fetch Rooms list
  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms-list'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data.data || res.data || [];
    }
  });

  // Create Reservation Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/professor-portal/reservations', {
        room_id: Number(roomId),
        start_time: `${date} ${startTime}:00`,
        end_time: `${date} ${endTime}:00`,
        purpose: purpose || 'Séance de Rattrapage / Soutenance ENCG',
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Demande de réservation envoyée à l\'administration avec succès !');
      setShowModal(false);
      setPurpose('');
      queryClient.invalidateQueries({ queryKey: ['professor-reservations'] });
    },
    onError: (err: any) => {
      toast.error('Erreur lors de la réservation', {
        description: err.response?.data?.message || err.message
      });
    }
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8 text-[#003a8c]" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in duration-500 pb-28">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] rounded-3xl p-8 text-white shadow-xl border border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Réservations de Salles & Amphis</h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium mt-0.5">
              Demandez et suivez vos créneaux exceptionnels (Rattrapages, Soutenances PFE, Mini-Projets).
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 relative z-10 shrink-0">
          <Link
            to="/professor/rooms/availability"
            className="px-6 py-3.5 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center"
          >
            Voir les salles libres
          </Link>
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-950/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nouvelle Réservation
          </button>
        </div>
      </div>

      {/* List Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
            Historique & Suivi des Demandes ({reservations.length})
          </h2>
          <span className="text-xs font-bold text-slate-400">Campus ENCG Fès</span>
        </div>

        {reservations.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Building2 className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="font-black text-slate-700 text-sm">Aucune réservation en cours</h3>
            <p className="text-xs">Cliquez sur "Nouvelle Réservation" pour réserver une salle ou un amphithéâtre.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((res: any) => {
              const startDate = res.start_time ? new Date(res.start_time) : new Date();
              const endDate = res.end_time ? new Date(res.end_time) : new Date();
              const isApproved = res.status === 'approved';
              
              return (
                <div key={res.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition-all gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0",
                      isApproved ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                    )}>
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-black text-sm text-slate-900">
                        {res.room?.name || res.room_name || `Salle #${res.room_id}`}
                      </div>
                      <div className="text-xs font-semibold text-slate-500 mt-0.5">
                        {res.purpose || 'Séance pédagogique'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-800 flex items-center gap-1.5 justify-end">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" /> {startDate.toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-[11px] font-bold text-slate-400 mt-0.5 flex items-center gap-1.5 justify-end">
                        <Clock className="w-3 h-3" /> {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>

                    <span className={cn(
                      "px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-1",
                      isApproved ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                    )}>
                      {isApproved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {res.status || 'PENDING'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Modal: Create Reservation */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base text-slate-900">Demander une Salle</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Salle / Amphithéâtre souhaité</label>
                <select
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- Choisir une salle --</option>
                  {rooms.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type || 'Salle'} - Capacité: {r.capacity || 40})
                    </option>
                  ))}
                  {rooms.length === 0 && (
                    <>
                      <option value="1">Amphi Ibn Khaldoun (220 places)</option>
                      <option value="2">Amphi Al Qaraouiyine (180 places)</option>
                      <option value="4">Salle TD 101 (45 places)</option>
                      <option value="5">Salle TD 102 (45 places)</option>
                      <option value="9">Lab Informatique L1 (35 places)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Date de la séance</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Heure Début</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Heure Fin</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Objet / Motif de la réservation</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="Ex : Séance de Rattrapage Audit Financier (S7)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-extrabold hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !roomId}
                className="px-6 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4" />}
                Envoyer la Demande
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
