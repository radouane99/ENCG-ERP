import React, { useState } from 'react';
import { PlaneTakeoff, Globe2, MapPin, Star, Clock, CheckCircle2, AlertCircle, Send, FileText } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function StudentMobility() {
  const [voeux, setVoeux] = useState<number[]>([1, 0, 2]); // Mock selection indices

  const partners = [
    { id: 0, name: 'KEDGE Business School', country: 'France', city: 'Bordeaux', type: 'Double Diplôme', slots: 5, gpaRequired: '14.00' },
    { id: 1, name: 'NEOMA Business School', country: 'France', city: 'Rouen', type: 'Semestre d\'Échange', slots: 8, gpaRequired: '13.50' },
    { id: 2, name: 'Université Laval', country: 'Canada', city: 'Québec', type: 'Semestre d\'Échange', slots: 3, gpaRequired: '14.50' },
    { id: 3, name: 'Kyung Hee University', country: 'Corée du Sud', city: 'Séoul', type: 'Semestre d\'Échange', slots: 2, gpaRequired: '13.00' },
  ];

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
              Postulez pour un semestre d'échange ou un double diplôme. Les affectations sont basées sur le classement au mérite (S1 Ã  S6).
            </p>
          </div>
          <div className="shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center">
            <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Moyenne de Classement</div>
            <div className="text-3xl font-black text-white">14.85<span className="text-sm font-medium text-blue-200">/20</span></div>
            <div className="text-xs text-emerald-400 font-bold mt-1">Éligible au Top 5</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Voeux Selection */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white">Catalogue des Partenaires</h2>
            <span className="text-sm font-bold text-white/50">3 vÅ“ux maximum</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {partners.map((partner) => {
              const isSelected = voeux.includes(partner.id);
              const voeuRank = voeux.indexOf(partner.id) + 1;

              return (
                <div key={partner.id} className={cn(
                  "p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group",
                  isSelected ? "border-blue-500 bg-blue-50/30 shadow-md" : "border-white/5 bg-white hover:border-blue-200 hover:shadow-md"
                )}>
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white w-8 h-8 flex items-center justify-center font-black rounded-bl-xl z-10 shadow-sm">
                      {voeuRank}
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-white text-lg group-hover:text-[#003a8c] transition-colors pr-6 leading-tight">
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
                      isSelected ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-white/[0.05] text-white/80 hover:bg-gray-200"
                    )}>
                      {isSelected ? 'Retirer' : 'Ajouter aux vÅ“ux'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar / Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/5 sticky top-24">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Mes VÅ“ux
            </h3>

            <div className="space-y-3 mb-6">
              {voeux.map((partnerId, i) => {
                const partner = partners.find(p => p.id === partnerId);
                if (!partner) return null;
                return (
                  <div key={i} className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white leading-tight">{partner.name}</div>
                      <div className="text-xs text-white/50">{partner.country}</div>
                    </div>
                  </div>
                );
              })}
              {voeux.length === 0 && (
                <div className="text-sm text-white/50 italic text-center py-4">Aucun vÅ“u sélectionné.</div>
              )}
            </div>

            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl">
                <h4 className="text-xs font-bold text-blue-900 mb-1">Dossier de candidature</h4>
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Transcripts joints
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-600 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Lettre de motivation manquante
                </div>
              </div>

              <button className="w-full bg-[#001A4B] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#003a8c] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                <Send className="w-4 h-4" /> Soumettre VÅ“ux
              </button>
              
              <div className="text-center text-xs text-white/50 font-medium">
                Date limite : 15 Avril 2026
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
