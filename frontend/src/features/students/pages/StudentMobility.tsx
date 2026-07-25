import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlaneTakeoff, Globe2, MapPin, Star, Clock, CheckCircle2, AlertCircle, Send, FileText, Sparkles, Trophy, Check, Zap, Percent, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function StudentMobility() {
  const { t, i18n } = useTranslation(['students', 'common']);
  const isRtl = i18n.language === 'ar';
  
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
    }, 1000);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-8 font-sans animate-in duration-500 pb-24">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <PlaneTakeoff className="w-10 h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-purple-400/30">
                <Globe2 className="w-4 h-4 text-amber-400" /> IA Predictive Matching • Mobilité Internationale 2026
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Portail Intelligente & Bourses Étrangères
              </h1>
              <p className="text-blue-100/90 text-sm max-w-2xl font-medium mt-1">
                Simulateur de chances d'admission basé sur votre moyenne cumulative (S1-S6) et votre score TOEIC. Maximisez vos chances d'affectation au vœu #1 !
              </p>
            </div>
          </div>

          <div className="shrink-0 bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 text-center">
            <div className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Moyenne Cumulative (S1-S6)</div>
            <div className="text-3xl font-black text-white font-mono">{studentGpa} <span className="text-sm text-amber-300">/ 20</span></div>
            <div className="text-xs text-emerald-300 font-extrabold mt-1 flex items-center justify-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Rang #1 (Éligible Top 1)
            </div>
          </div>
        </div>
      </div>

      {applicationSubmitted ? (
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-[2.5rem] p-10 shadow-xl text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Candidature Soumise & Évaluée par l'IA !</h2>
          <p className="text-slate-500 max-w-lg mx-auto text-sm font-medium">
            Votre dossier de vœux a été transmis à la Direction des Relations Internationales. Vous recevrez une notification par email dès la délibération du Jury au mérite.
          </p>
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-2xl font-extrabold text-xs border border-emerald-200">
            <Clock className="w-4 h-4" /> Statut : En cours d'évaluation au tri par le Jury
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Catalogue with IA Predictive Chances */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Offres Universitaires & Simulator IA
              </h2>
              <span className="text-xs font-black text-indigo-600 font-mono">{selectedVoeux.length} / 3 vœux sélectionnés</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {partners.map((partner) => {
                const isSelected = selectedVoeux.includes(partner.id);
                const voeuRank = selectedVoeux.indexOf(partner.id) + 1;

                return (
                  <div key={partner.id} onClick={() => handleToggleVoeu(partner.id)} className={cn(
                    "p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group",
                    isSelected ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-md" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 shadow-sm"
                  )}>
                    {isSelected && (
                      <div className="absolute top-0 right-0 bg-indigo-600 text-white w-8 h-8 flex items-center justify-center font-black rounded-bl-2xl text-xs z-10 shadow-sm">
                        #{voeuRank}
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 transition-colors pr-6 leading-tight">
                        {partner.name}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {partner.city}, {partner.country}
                    </div>

                    {/* IA Match Gauge */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5 mb-4">
                      <div className="flex justify-between items-center text-xs font-black">
                        <span className="text-slate-500">Chances IA d'Admission</span>
                        <span className="text-indigo-600 font-mono font-black">{partner.matchChance}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full" style={{ width: `${partner.matchChance}%` }}></div>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 pt-0.5">
                        <ShieldCheck className="w-3 h-3" /> {partner.badge}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border border-purple-200">
                        {partner.type}
                      </span>
                      <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border border-amber-200">
                        {partner.slots} Places
                      </span>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="text-xs text-slate-500">Moy. Min. : <span className="font-extrabold text-slate-900 dark:text-white">{partner.gpaRequired}/20</span></div>
                      <button className={cn(
                        "px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                        isSelected ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                      )}>
                        {isSelected ? 'Retirer' : 'Sélectionner'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Side */}
          <div className="space-y-6">
            <form onSubmit={handleSubmitApplication} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 sticky top-6 space-y-4">
              <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Star className="w-5 h-5 text-amber-400" /> Vos Vœux de Mobilité
              </h3>

              <div className="space-y-2">
                {selectedVoeux.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucun vœu sélectionné.</p>
                ) : (
                  selectedVoeux.map((id, idx) => {
                    const p = partners.find(item => item.id === id);
                    return (
                      <div key={id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-900 dark:text-white">#{idx + 1} {p?.name}</span>
                        <span className="text-[10px] font-bold text-indigo-600 font-mono">{p?.country}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Certificat TOEIC / TOEFL</label>
                <input
                  type="text"
                  value={toeicScore}
                  onChange={(e) => setToeicScore(e.target.value)}
                  placeholder="ex: 880 / 990"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lettre de Motivation (Synthèse)</label>
                <textarea
                  rows={3}
                  value={motivationText}
                  onChange={(e) => setMotivationText(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md hover:scale-102 cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 text-amber-300" /> Soumettre Ma Candidature
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
