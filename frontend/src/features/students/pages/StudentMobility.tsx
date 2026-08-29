import React, { useState } from 'react';
import { Globe2, MapPin, Star, CheckCircle2, Send, Zap, Check, GraduationCap } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';

export default function StudentMobility() {
  const [selectedVoeux, setSelectedVoeux] = useState<number[]>([1, 2]);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [motivationText, setMotivationText] = useState('Je souhaite postuler pour un semestre d\'échange afin d\'approfondir mes connaissances en Finance et Management International.');
  const [toeicScore, setToeicScore] = useState('880');

  const studentGpa = 16.42;

  const partners = [
    { id: 1, name: 'KEDGE Business School', country: 'France', city: 'Bordeaux / Marseille', type: 'Échange ECTS', slots: 15, gpaRequired: 14.00, matchChance: 96, badge: 'Excellente Compatibilité' },
    { id: 2, name: 'Université Laval', country: 'Canada', city: 'Québec', type: 'Double Diplôme', slots: 10, gpaRequired: 14.50, matchChance: 91, badge: 'Forte Compatibilité' },
    { id: 3, name: 'NEOMA Business School', country: 'France', city: 'Rouen / Reims', type: 'Échange ECTS', slots: 8, gpaRequired: 13.50, matchChance: 98, badge: 'Excellente Compatibilité' },
    { id: 4, name: 'Kyung Hee University', country: 'Corée du Sud', city: 'Séoul', type: 'Échange ECTS', slots: 6, gpaRequired: 15.00, matchChance: 84, badge: 'Bonne Compatibilité' },
    { id: 5, name: 'ESSEC Business School', country: 'France', city: 'Cergy', type: 'Double Diplôme', slots: 6, gpaRequired: 16.00, matchChance: 68, badge: 'Sélectif / Compétitif' },
  ];

  const handleToggleVoeu = (partnerId: number) => {
    if (selectedVoeux.includes(partnerId)) {
      setSelectedVoeux(selectedVoeux.filter(id => id !== partnerId));
    } else {
      if (selectedVoeux.length >= 3) {
        toast.error("Vous ne pouvez sélectionner que 3 vœux maximum.");
        return;
      }
      setSelectedVoeux([...selectedVoeux, partnerId]);
    }
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVoeux.length === 0) {
      toast.error("Veuillez sélectionner au moins 1 vœu d'université partenaire.");
      return;
    }

    toast.loading("Transmission de votre dossier de candidature à la Direction des Relations Internationales...");
    setTimeout(() => {
      toast.dismiss();
      setApplicationSubmitted(true);
      toast.success("🚀 Votre dossier de mobilité a été soumis avec succès au Jury de sélection !");
    }, 800);
  };

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-24">
      
      {/* ── Hero Header Banner ── */}
      <div className="bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#0d1d3d] rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl border border-white/10 text-white flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md text-amber-300 border border-white/10">
              Relations Internationales & Mobilité Académique
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Campagne 2026/2027
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Globe2 className="w-8 h-8 text-amber-300" /> Programmes d'Échange & Doubles Diplômes
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 font-medium leading-relaxed max-w-xl">
            Postulez auprès de nos universités et Business Schools partenaires accréditées (AACSB, EQUIS, AMBA) en Europe, Amérique et Asie.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-xl p-5 rounded-3xl border border-white/15 text-center shrink-0 space-y-1">
          <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block">Votre Score de Sélection</span>
          <div className="text-3xl font-black text-white">{studentGpa} / 20</div>
          <p className="text-[10px] text-emerald-300 font-bold">Éligible à 100% des partenariats</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Partners List */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#001A4B] dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" /> Établissements Partenaires Ouverts aux Candidatures
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Sélectionnez jusqu'à 3 vœux d'affectation par ordre de préférence</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{selectedVoeux.length} / 3 vœu(x) choisi(s)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {partners.map((partner) => {
              const isSelected = selectedVoeux.includes(partner.id);
              const voeuRank = selectedVoeux.indexOf(partner.id) + 1;

              return (
                <div 
                  key={partner.id}
                  onClick={() => handleToggleVoeu(partner.id)}
                  className={cn(
                    "p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 relative",
                    isSelected 
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 shadow-md ring-2 ring-blue-500/20" 
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:shadow-sm"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs font-black text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> {partner.city}, {partner.country}
                      </span>
                      {isSelected && (
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                          {voeuRank}
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-base text-slate-900 dark:text-white leading-snug">{partner.name}</h3>
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {partner.type} • {partner.slots} places
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-400">Score Requis :</span>
                      <span className="text-slate-700 dark:text-slate-200 font-mono">{partner.gpaRequired.toFixed(2)}/20</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-400">Chances d'Admission :</span>
                      <span className="text-emerald-600 font-mono font-black flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-500" /> {partner.matchChance}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Application Form */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Dossier de Candidature</h3>
            </div>

            {applicationSubmitted ? (
              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-black text-sm text-emerald-900 dark:text-emerald-300">Candidature Déposée</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed font-medium">
                  Votre dossier a été transmis au comité de sélection. Vous recevrez une notification lors de la publication des résultats d'affectation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Score TOEIC / TOEFL</label>
                  <input
                    type="text"
                    value={toeicScore}
                    onChange={e => setToeicScore(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 880 / 990"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lettre de Motivation (Synthèse)</label>
                  <textarea
                    rows={4}
                    value={motivationText}
                    onChange={e => setMotivationText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Expliquez votre projet d'études et professionnel..."
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[11px] text-slate-500 space-y-1">
                  <div className="font-bold text-slate-700 dark:text-slate-300">Vœux Sélectionnés :</div>
                  {selectedVoeux.length === 0 ? (
                    <div className="italic text-slate-400">Aucun vœu sélectionné</div>
                  ) : (
                    selectedVoeux.map((id, i) => {
                      const p = partners.find(item => item.id === id);
                      return (
                        <div key={id} className="flex items-center gap-1 font-bold text-blue-900 dark:text-blue-300">
                          <span>#{i + 1}</span> {p?.name} ({p?.country})
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#001A4B] hover:bg-[#082663] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Soumettre ma Candidature
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
