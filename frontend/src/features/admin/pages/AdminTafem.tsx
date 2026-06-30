import React from 'react';
import { Target, Users, LayoutGrid, CheckCircle2, AlertCircle, Search, Download, FileText, Wand2 } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function AdminTafem() {
  const stats = [
    { label: 'Candidats Inscrits', value: '4,852', subtext: 'Dossiers complets', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Capacité Amphis', value: '5,000', subtext: '12 Salles / 4 Amphis', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Répartition Auto', value: '100%', subtext: 'Placement terminé', color: 'text-[#e6007e]', bg: 'bg-[#e6007e]/10', border: 'border-[#e6007e]/20' },
  ];

  const amphis = [
    { name: 'Amphi Al Khwarizmi', capacity: 450, filled: 450, surveillants: 12 },
    { name: 'Amphi Ibn Sina', capacity: 380, filled: 380, surveillants: 10 },
    { name: 'Salle B1 Ã  B10', capacity: 600, filled: 580, surveillants: 20 },
    { name: 'Chapiteau Extérieur', capacity: 3500, filled: 3442, surveillants: 70 },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-[#001A4B] rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-blue-900">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#e6007e]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#e6007e]/20 text-[#ff66b2] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-[#e6007e]/30">
              <Target className="w-3.5 h-3.5" /> Admissibilité
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Concours TAFEM 2026</h1>
            <p className="text-blue-200 text-lg max-w-2xl">
              Gestion de masse des candidats, répartition intelligente dans les centres d'examens et génération des listes principales.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-4">
            <button className="bg-[#e6007e] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#cc0070] transition-colors shadow-lg flex items-center gap-2">
              <Wand2 className="w-5 h-5" /> Répartition Automatique IA
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className={cn("rounded-2xl p-6 shadow-sm border", stat.bg, stat.border)}>
            <div className="text-sm font-bold text-white/70 mb-2">{stat.label}</div>
            <div className={cn("text-4xl font-black mb-2", stat.color)}>{stat.value}</div>
            <div className="text-xs font-bold text-white/50 uppercase tracking-widest">{stat.subtext}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Logistics / Amphis */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Logistique Salles</h2>
                <p className="text-sm font-medium text-white/50">Occupation et Surveillance</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {amphis.map((amphi, i) => (
              <div key={i} className="p-4 border border-white/5 rounded-2xl bg-white/[0.02]/50 hover:bg-white transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-white">{amphi.name}</h4>
                  <span className="text-xs font-black text-white/50">{amphi.filled} / {amphi.capacity}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div 
                    className={cn("h-full rounded-full transition-all", amphi.filled === amphi.capacity ? "bg-emerald-500" : "bg-blue-500")} 
                    style={{ width: `${(amphi.filled / amphi.capacity) * 100}%` }}
                  ></div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                  <Users className="w-3.5 h-3.5" /> {amphi.surveillants} Surveillants Affectés
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results Generation */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Résultats & Délibération</h2>
              <p className="text-sm font-medium text-white/50">Post-correction OMR</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl border-2 border-dashed border-white/10 text-center hover:border-emerald-400 hover:bg-emerald-50 transition-colors cursor-pointer group">
              <Download className="w-10 h-10 text-gray-400 mx-auto mb-3 group-hover:text-emerald-500" />
              <h3 className="font-bold text-white mb-1">Importer Fichier Scanners OMR</h3>
              <p className="text-xs text-white/50">Format .csv ou .xlsx (Notes des QCM)</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <button className="w-full bg-[#001A4B] text-white py-3 rounded-xl font-bold flex items-center justify-between px-6 hover:bg-[#003a8c] transition-colors shadow-sm">
                <span>Générer Liste Principale (Top 350)</span>
                <FileText className="w-5 h-5" />
              </button>
              <button className="w-full bg-white border border-white/10 text-white/80 py-3 rounded-xl font-bold flex items-center justify-between px-6 hover:bg-white/[0.02] transition-colors">
                <span>Générer Liste d'Attente</span>
                <FileText className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-sm text-rose-800 font-medium">
                Attention : La publication des résultats enverra un SMS automatique aux 350 admis. Veuillez vérifier les seuils de coupure avant validation.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
