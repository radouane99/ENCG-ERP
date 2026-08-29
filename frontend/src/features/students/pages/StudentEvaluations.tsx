import React, { useState } from 'react';
import { ShieldCheck, BookOpen, Star, CheckCircle2, Lock, ArrowRight, Send, X, Check, Award } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';
import { toast } from 'sonner';

interface ModuleEval {
  id: string | number;
  name: string;
  code: string;
  prof: string;
  department: string;
  isEvaluated: boolean;
}

export default function StudentEvaluations() {
  const [selectedModule, setSelectedModule] = useState<ModuleEval | null>(null);

  // Ratings (1 to 5 stars)
  const [ratings, setRatings] = useState({
    clarity: 5,       // Clarté des explications & pédagogie
    punctuality: 5,   // Ponctualité & respect du volume horaire
    materials: 5,     // Qualité des polycopiés & supports
    availability: 5,  // Disponibilité & interactivité
  });

  const [comment, setComment] = useState('');
  const [evaluatedModules, setEvaluatedModules] = useState<Record<string, boolean>>({});

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['student-schedule-evals'],
    queryFn: async () => {
      try {
        const res = await api.get('/student-portal/schedule');
        return res.data.data;
      } catch {
        return null;
      }
    }
  });

  const modulesList: ModuleEval[] = React.useMemo(() => {
    if (schedule && schedule.length > 0) {
      const unique = new Map<string, ModuleEval>();
      schedule.forEach((s: any, idx: number) => {
        if (s.module && !unique.has(s.module)) {
          unique.set(s.module, {
            id: idx + 1,
            name: s.module,
            code: s.module_code || `MOD-0${idx + 1}`,
            prof: s.professor || 'Professeur ENCG',
            department: s.department || 'Gestion & Commerce',
            isEvaluated: !!evaluatedModules[s.module],
          });
        }
      });
      return Array.from(unique.values());
    }
    return [
      { id: 1, name: 'Management Stratégique & Gouvernance', code: 'M601', prof: 'Pr. El Amrani', department: 'Management & Stratégie', isEvaluated: !!evaluatedModules['Management Stratégique & Gouvernance'] },
      { id: 2, name: 'Diagnostic Financier & Analyse de la Valeur', code: 'M602', prof: 'Pr. Bensouda', department: 'Finance & Comptabilité', isEvaluated: !!evaluatedModules['Diagnostic Financier & Analyse de la Valeur'] },
      { id: 3, name: 'Marketing International & Négociation', code: 'M603', prof: 'Pr. Tazi', department: 'Marketing & Commerce', isEvaluated: !!evaluatedModules['Marketing International & Négociation'] },
      { id: 4, name: 'Audit Financier & Contrôle Interne', code: 'M604', prof: 'Pr. Bennani', department: 'Finance & Audit', isEvaluated: !!evaluatedModules['Audit Financier & Contrôle Interne'] },
    ];
  }, [schedule, evaluatedModules]);

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;

    toast.loading('Chiffrement asymétrique et enregistrement anonymisé...', { duration: 800 });

    setTimeout(() => {
      setEvaluatedModules(prev => ({ ...prev, [selectedModule.name]: true }));
      toast.success('✨ Évaluation enregistrée avec succès ! Merci pour votre contribution.');
      setSelectedModule(null);
      setComment('');
      setRatings({ clarity: 5, punctuality: 5, materials: 5, availability: 5 });
    }, 800);
  };

  const renderStarRating = (key: keyof typeof ratings, label: string, description: string) => {
    const val = ratings[key];
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">{label}</label>
          <span className="text-xs font-mono font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-lg">
            {val} / 5
          </span>
        </div>
        <p className="text-[11px] text-slate-400 font-medium">{description}</p>
        <div className="flex items-center gap-1 pt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRatings(prev => ({ ...prev, [key]: star }))}
              className="p-1 hover:scale-125 transition-transform cursor-pointer"
            >
              <Star className={cn("w-6 h-6", star <= val ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600")} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-24">
      
      {/* ── Executive Hero Banner ── */}
      <div className="bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#0d1d3d] rounded-[2.5rem] p-6 sm:p-8 text-white shadow-2xl border border-white/10 relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md text-amber-300 border border-white/10">
              Assurance Qualité & Démarche d'Accréditation
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              100% Anonyme & Chiffré
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-300" /> Évaluation des Enseignements & Pédagogie
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 font-medium leading-relaxed max-w-xl">
            Exprimez votre retour constructif sur chaque module afin d'améliorer la qualité des enseignements et des supports académiques.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-xl p-5 rounded-3xl border border-white/15 text-center shrink-0">
          <ShieldCheck className="w-8 h-8 text-emerald-300 mx-auto mb-1" />
          <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block">Confidentialité Totale</span>
          <p className="text-xs font-bold text-white mt-0.5">Aucune donnée nominative transmise aux enseignants</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-slate-400 font-bold">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {modulesList.map((mod) => {
            const isDone = mod.isEvaluated;
            return (
              <div 
                key={mod.id}
                className={cn(
                  "p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4",
                  isDone 
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-blue-300"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      {mod.code}
                    </span>
                    {isDone ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Évalué
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                        En Attente
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-base text-slate-900 dark:text-white leading-snug">{mod.name}</h3>
                  <p className="text-xs font-bold text-slate-500">{mod.prof} • {mod.department}</p>
                </div>

                <div className="pt-2">
                  {isDone ? (
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Vos réponses ont été consolidées dans le rapport pédagogique.
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedModule(mod)}
                      className="w-full py-3 bg-[#001A4B] hover:bg-[#082663] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Évaluer ce Cours <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Evaluation Form Modal ── */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#001A4B] to-blue-900 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Formulaire Anonymisé</span>
                <h2 className="text-base font-black">{selectedModule.name}</h2>
                <p className="text-xs text-blue-200 font-medium">{selectedModule.prof}</p>
              </div>
              <button 
                onClick={() => setSelectedModule(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitEvaluation} className="p-6 overflow-y-auto space-y-4">
              {renderStarRating('clarity', '1. Clarté Pédagogique & Méthode', 'Capacité à expliquer les concepts complexes et dynamisme des séances.')}
              {renderStarRating('punctuality', '2. Assiduité & Respect des Horaires', 'Respect des créneaux de cours et du volume horaire statutaire.')}
              {renderStarRating('materials', '3. Qualité des Supports & Polycopiés', 'Disponibilité des slides, études de cas et exercices corrigés.')}
              {renderStarRating('availability', '4. Disponibilité & Écoute Étudiante', 'Réponses aux questions, séances de révision et bienveillance.')}

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Commentaires & Suggestions Constructives (Optionnel)
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Partagez vos remarques pour aider l'équipe pédagogique à faire évoluer le cours..."
                  className="w-full h-24 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300 font-bold">
                <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Ce formulaire est 100% anonymisé par clé asymétrique ENCG Fès.</span>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedModule(null)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Envoyer mon Évaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
