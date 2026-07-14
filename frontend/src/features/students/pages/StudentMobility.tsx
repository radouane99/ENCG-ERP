import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlaneTakeoff, Globe2, MapPin, Star, Clock, CheckCircle2, AlertCircle, Send, FileText } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@/shared/lib/api';
import { toast } from 'sonner';
import { Spinner } from '@shared/components/ui/Spinner';

export default function StudentMobility() {
  const queryClient = useQueryClient();
  const [localVoeux, setLocalVoeux] = useState<number[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['mobility-data'],
    queryFn: async () => {
      const res = await api.get('/student-portal/mobility/partners');
      const apiData = res.data.data;
      setLocalVoeux(apiData.voeux || []);
      return apiData;
    }
  });

  const saveVoeuxMutation = useMutation({
    mutationFn: async (voeuxToSave: number[]) => {
      return api.post('/student-portal/mobility/voeux', { voeux: voeuxToSave });
    },
    onSuccess: () => {
      toast.success("Vos vœux ont été enregistrés avec succès.");
      queryClient.invalidateQueries({ queryKey: ['mobility-data'] });
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement de vos vœux.");
    }
  });

  const handleToggleVoeu = (partnerId: number) => {
    let newVoeux = [...localVoeux];
    if (newVoeux.includes(partnerId)) {
      newVoeux = newVoeux.filter(id => id !== partnerId);
    } else {
      if (newVoeux.length >= 3) {
        toast.error("Vous ne pouvez sélectionner que 3 vœux maximum.");
        return;
      }
      newVoeux.push(partnerId);
    }
    setLocalVoeux(newVoeux);
    // Auto save for seamless experience
    saveVoeuxMutation.mutate(newVoeux);
  };

  const partners = data?.partners || [];

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-[#001A4B] rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-blue-900">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-500/30">
              <Globe2 className="w-3.5 h-3.5" /> S7 / S8 International
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Mobilité Internationale</h1>
            <p className="text-blue-200 text-lg max-w-2xl">
              Postulez pour un semestre d'échange ou un double diplôme. Les affectations sont basées sur le classement au mérite (S1 à S6).
            </p>
          </div>
          <div className="shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center">
            <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Moyenne de Classement</div>
            <div className="text-3xl font-black text-white">14.85<span className="text-sm font-medium text-blue-200">/20</span></div>
            <div className="text-xs text-emerald-400 font-bold mt-1">Éligible au Top 5</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Voeux Selection */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Catalogue des Partenaires</h2>
              <span className="text-sm font-bold text-white/50">{localVoeux.length} / 3 vœux maximum</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {partners.map((partner: any) => {
                const isSelected = localVoeux.includes(partner.id);
                const voeuRank = localVoeux.indexOf(partner.id) + 1;

                return (
                  <div key={partner.id} onClick={() => handleToggleVoeu(partner.id)} className={cn(
                    "p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group",
                    isSelected ? "border-blue-500 bg-blue-50/30 shadow-md" : "border-white/5 bg-[#1F3A5F] hover:border-blue-200 hover:shadow-md"
                  )}>
                    {isSelected && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-white w-8 h-8 flex items-center justify-center font-black rounded-bl-xl z-10 shadow-sm">
                        {voeuRank}
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-white text-lg group-hover:text-blue-300 transition-colors pr-6 leading-tight">
                        {partner.name}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white/50 uppercase tracking-wider mb-4">
                      <MapPin className="w-3.5 h-3.5" /> {partner.city}, {partner.country}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-[10px] font-black uppercase border border-purple-100">
                        {partner.type}
                      </span>
                      <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-[10px] font-black uppercase border border-amber-100">
                        {partner.slots} Places
                      </span>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="text-xs text-white/50">Moy. Min. : <span className="font-bold text-white">{partner.gpaRequired}</span></div>
                      <button className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-colors",
                        isSelected ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-white/[0.05] text-white/80 hover:bg-white/[0.1]"
                      )}>
                        {isSelected ? 'Retirer' : 'Ajouter aux vœux'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Voeux Summary */}
          <div className="space-y-6">
            <div className="bg-[#1F3A5F] rounded-3xl p-6 shadow-lg border border-white/10 sticky top-6">
              <h3 className="font-black text-white mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" /> Vos Vœux Actuels
              </h3>
              
              {localVoeux.length === 0 ? (
                <div className="text-center py-8">
                  <PlaneTakeoff className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/50 font-medium">Aucun vœu sélectionné pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {localVoeux.map((id, idx) => {
                    const p = partners.find((x: any) => x.id === id);
                    if (!p) return null;
                    return (
                      <div key={id} className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm leading-tight">{p.name}</div>
                          <div className="text-xs text-white/50">{p.country}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-white/10">
                <button 
                  disabled={localVoeux.length === 0 || saveVoeuxMutation.isPending}
                  className="w-full bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  {saveVoeuxMutation.isPending ? <Spinner className="w-4 h-4 text-white" /> : <Send className="w-4 h-4" />}
                  Soumettre le Dossier
                </button>
                <p className="text-center text-[10px] text-white/40 mt-3 uppercase tracking-widest">
                  Date limite : 15 Juillet 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
