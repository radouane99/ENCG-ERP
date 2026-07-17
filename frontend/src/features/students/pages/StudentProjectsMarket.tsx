import React, { useState } from 'react';
import { Briefcase, MapPin, Clock, Building2, Search, Filter, Send, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';

export default function StudentProjectsMarket() {
  const [filter, setFilter] = useState('ALL'); // ALL, STAGE, PFE

  const { data: offersData, isLoading } = useQuery({
    queryKey: ['job-offers'],
    queryFn: async () => {
      const res = await api.get('/student-portal/job-offers');
      return res.data.data;
    }
  });

  const offers = offersData || [];
  const filteredOffers = filter === 'ALL' ? offers : offers.filter((o: any) => o.type === filter);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8 text-[#e6007e]" /></div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-[#0b1021] rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-white/10">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#e6007e]/20 text-[#ff66b2] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-[#e6007e]/30">
            <Briefcase className="w-3.5 h-3.5" /> Réseau Partenaires ENCG
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Bourse aux Projets & PFE</h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Découvrez les offres exclusives de nos entreprises partenaires et postulez en un clic avec votre profil vérifié.
          </p>
        </div>

        {/* Search Bar in Header */}
        <div className="relative z-10 mt-8 max-w-2xl flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Rechercher une offre, une entreprise, un mot-clé..." 
              className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:border-[#e6007e] focus:bg-white/15 transition-all"
            />
          </div>
          <button className="bg-[#e6007e] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#c4006c] transition-colors shadow-lg">
            Rechercher
          </button>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/5">
            <h3 className="text-sm font-black text-[#001A4B] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Type d'Offre
            </h3>
            <div className="space-y-2">
              <button 
                onClick={() => setFilter('ALL')}
                className={cn("w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition-colors", filter === 'ALL' ? "bg-blue-50 text-blue-700" : "text-white/70 hover:bg-white/[0.02]")}
              >
                Toutes les offres
              </button>
              <button 
                onClick={() => setFilter('STAGE')}
                className={cn("w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition-colors", filter === 'STAGE' ? "bg-blue-50 text-blue-700" : "text-white/70 hover:bg-white/[0.02]")}
              >
                Stages (1-3 mois)
              </button>
              <button 
                onClick={() => setFilter('PFE')}
                className={cn("w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition-colors", filter === 'PFE' ? "bg-blue-50 text-blue-700" : "text-white/70 hover:bg-white/[0.02]")}
              >
                Projets de Fin d'Études
              </button>
            </div>
          </div>
        </div>

        {/* Job Cards */}
        <div className="flex-1 space-y-4">
          {filteredOffers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-white/5 hover:shadow-md hover:border-blue-200 transition-all group flex flex-col md:flex-row gap-6">
              
              <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center shrink-0 p-2 overflow-hidden">
                <img src={offer.logo} alt={offer.company} className="max-w-full max-h-full object-contain" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                    offer.type === 'PFE' ? "bg-purple-50 text-purple-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {offer.type}
                  </span>
                  <span className="text-gray-400 text-xs font-bold">â€¢ {offer.company}</span>
                </div>
                
                <h3 className="text-xl font-black text-white group-hover:text-[#003a8c] transition-colors mb-3">
                  {offer.title}
                </h3>
                
                <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-white/50 mb-4">
                  <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" /> {offer.location}</div>
                  <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" /> {offer.duration}</div>
                  <div className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" /> ENCG Partner</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {offer.tags.map((tag, idx) => (
                    <span key={idx} className="bg-white/[0.05] text-white/70 px-3 py-1 rounded-full text-xs font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end justify-center border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                {offer.status === 'NEW' && (
                  <button className="bg-[#001A4B] text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#003a8c] transition-colors shadow-sm w-full md:w-auto justify-center">
                    <Send className="w-4 h-4" /> Postuler en 1 clic
                  </button>
                )}
                {offer.status === 'APPLIED' && (
                  <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-200 w-full md:w-auto justify-center">
                    <CheckCircle2 className="w-4 h-4" /> Candidature Envoyée
                  </div>
                )}
                {offer.status === 'REJECTED' && (
                  <div className="bg-rose-50 text-rose-700 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 border border-rose-200 w-full md:w-auto justify-center">
                    <XCircle className="w-4 h-4" /> Refusée
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
