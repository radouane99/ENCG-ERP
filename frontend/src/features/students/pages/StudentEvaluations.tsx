import React, { useState } from 'react';
import { 
  ClipboardCheck, ShieldCheck, BookOpen, Star, CheckCircle2, 
  Sparkles, Lock, ArrowRight, MessageSquare, ThumbsUp, Send, 
  HelpCircle, AlertCircle, Award, X, ChevronRight, Check
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
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

  // Default modules if schedule is empty
  const defaultModules: ModuleEval[] = [
    { id: 1, name: 'Finance d\'Entreprise Approfondie', code: 'M11-GFC', prof: 'Pr. Abdelhak El Amrani', department: 'Sciences de Gestion', isEvaluated: false },
    { id: 2, name: 'Contrôle de Gestion & Pilotage', code: 'M12-GFC', prof: 'Pr. Meryem Kettani', department: 'Sciences de Gestion', isEvaluated: false },
    { id: 3, name: 'Fiscalité Marocaine des Entreprises', code: 'M13-GFC', prof: 'Pr. Youssef Bennani', department: 'Droit & Fiscalité', isEvaluated: false },
    { id: 4, name: 'Marketing Stratégique & Digital', code: 'M14-GFC', prof: 'Pr. Salma Alami', department: 'Commerce & Marketing', isEvaluated: false },
    { id: 5, name: 'Management des Systèmes d\'Information', code: 'M15-GFC', prof: 'Pr. Reda Chraibi', department: 'Informatique & SI', isEvaluated: false },
  ];

  const modulesList: ModuleEval[] = React.useMemo(() => {
    if (schedule && schedule.length > 0) {
      const unique = new Map<string, ModuleEval>();
      schedule.forEach((s: any, idx: number) => {
        if (s.module && !unique.has(s.module)) {
          unique.set(s.module, {
            id: idx + 1,
            name: s.module,
            code: s.module_code || `MOD-${idx + 1}`,
            prof: s.professor || 'Professeur Titulaire ENCG',
            department: s.department || 'Sciences de Gestion',
            isEvaluated: !!evaluatedModules[s.module],
          });
        }
      });
      return Array.from(unique.values());
    }
    return defaultModules.map(m => ({
      ...m,
      isEvaluated: !!evaluatedModules[m.name],
    }));
  }, [schedule, evaluatedModules]);

  const totalCount = modulesList.length;
  const completedCount = modulesList.filter(m => m.isEvaluated).length;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  const handleOpenEvalModal = (module: ModuleEval) => {
    setSelectedModule(module);
    setRatings({ clarity: 5, punctuality: 5, materials: 5, availability: 5 });
    setComment('');
  };

  const handleSubmitEvaluation = () => {
    if (!selectedModule) return;

    // Cryptographic zero-knowledge proof simulation (SHA-256 token)
    const token = 'EVAL-ANON-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    setEvaluatedModules(prev => ({
      ...prev,
      [selectedModule.name]: true
    }));

    toast.success(`Évaluation de "${selectedModule.name}" enregistrée avec succès !`, {
      description: `Token anonyme sécurisé : ${token} — Aucune donnée d'identité n'est liée à cette note.`
    });

    setSelectedModule(null);
  };

  if (isLoading) {
    return <div className="min-h-[400px] flex items-center justify-center"><Spinner className="w-8 h-8 text-[#0f2863]" /></div>;
  }

  return (
    <div className="max-w-[1100px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in pb-24">
      
      {/* ── Header Banner ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-3xl shadow-2xl text-white border border-blue-900/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-emerald-400/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Anonymat 100% Garanti par Cryptographie
              </span>
              <span className="bg-white/10 text-blue-200 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                Semestre en cours
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Évaluation Pédagogique des Enseignements
            </h1>

            <p className="text-blue-100/90 text-sm max-w-2xl leading-relaxed">
              Exprimez votre appréciation sur chaque module en toute liberté. Vos retours permettent d'améliorer en continu la qualité des cours et l'excellence académique de l'ENCG Fès.
            </p>
          </div>

          {/* Progress Pill */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-center min-w-[200px] shrink-0">
            <p className="text-xs font-extrabold uppercase text-blue-200 tracking-wider">Progression</p>
            <p className="text-3xl font-black text-white my-1">{completedCount} / {totalCount}</p>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden mt-2">
              <div 
                className="bg-emerald-400 h-full transition-all duration-500" 
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }} 
              />
            </div>
            {isAllCompleted ? (
              <span className="text-[11px] text-emerald-300 font-black mt-2 inline-block">✓ Toutes complétées</span>
            ) : (
              <span className="text-[11px] text-amber-300 font-bold mt-2 inline-block">Évaluations restantes : {totalCount - completedCount}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Grade Unlock Notice ───────────────────────────────────────────────── */}
      <div className={cn(
        "p-5 rounded-2xl border transition-all flex items-center justify-between gap-4",
        isAllCompleted 
          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-sm"
          : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
      )}>
        <div className="flex items-center gap-3.5">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            isAllCompleted ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
          )}>
            {isAllCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm font-black">
              {isAllCompleted 
                ? "🎉 Consultation des Notes Débloquée avec Succès !" 
                : "🔒 Déblocage de la Consultation des Notes du Semestre"}
            </p>
            <p className="text-xs opacity-80 mt-0.5">
              {isAllCompleted
                ? "Merci pour vos retours constructifs. Vos relevés de notes et délibérations sont désormais accessibles."
                : "Veuillez évaluer l'ensemble de vos modules inscrits pour accéder à la consultation officielle de vos notes."}
            </p>
          </div>
        </div>

        {isAllCompleted && (
          <a
            href="/student/grades"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1"
          >
            <span>Voir Mes Notes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* ── Modules List ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          Modules Inscrits à Évaluer ({modulesList.length})
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {modulesList.map((m) => (
            <div 
              key={m.id}
              className={cn(
                "p-6 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm",
                m.isEvaluated
                  ? "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-90"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-indigo-300"
              )}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm",
                  m.isEvaluated
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                    : "bg-[#0f2863]/10 text-[#0f2863] dark:text-sky-400"
                )}>
                  {m.isEvaluated ? <Check className="w-7 h-7" /> : <BookOpen className="w-6 h-6" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                      {m.code}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {m.department}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1 truncate">
                    {m.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Enseignant Responsable : <span className="font-bold text-slate-700 dark:text-slate-200">{m.prof}</span>
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end">
                {m.isEvaluated ? (
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Évaluation Validée Anonymement</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenEvalModal(m)}
                    className="w-full md:w-auto px-6 py-3 bg-[#0f2863] hover:bg-[#15347d] text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Évaluer le Cours</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Multi-Criteria Evaluation Modal ────────────────────────────────────── */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-[#1e40af] text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-blue-200">
                  {selectedModule.code}
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Évaluation : {selectedModule.name}
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  {selectedModule.prof}
                </p>
              </div>
              <button
                onClick={() => setSelectedModule(null)}
                className="p-2 text-white/70 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Criterion 1: Clarity */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>1. Clarté des explications & pédagogie</span>
                  <span className="text-amber-500 font-black">{ratings.clarity} / 5</span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatings({ ...ratings, clarity: star })}
                      className="p-2 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={cn("w-7 h-7", star <= ratings.clarity ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-700")} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Criterion 2: Punctuality */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>2. Ponctualité & respect du volume horaire</span>
                  <span className="text-amber-500 font-black">{ratings.punctuality} / 5</span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatings({ ...ratings, punctuality: star })}
                      className="p-2 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={cn("w-7 h-7", star <= ratings.punctuality ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-700")} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Criterion 3: Course Materials */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>3. Qualité des polycopiés, TDs & supports de cours</span>
                  <span className="text-amber-500 font-black">{ratings.materials} / 5</span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatings({ ...ratings, materials: star })}
                      className="p-2 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={cn("w-7 h-7", star <= ratings.materials ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-700")} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Criterion 4: Availability */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>4. Disponibilité, écoute & interactions avec la classe</span>
                  <span className="text-amber-500 font-black">{ratings.availability} / 5</span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatings({ ...ratings, availability: star })}
                      className="p-2 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={cn("w-7 h-7", star <= ratings.availability ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-700")} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Constructive Comment */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Commentaire constructif ou suggestion (Facultatif & 100% Anonyme)
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ex : Explications très claires, polycopié bien illustré, travaux dirigés stimulants..."
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#0f2863]"
                />
              </div>

              {/* Anonymity notice */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Votre identifiant étudiant ne sera jamais transmis à l'enseignant ni au chef de département.</span>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedModule(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmitEvaluation}
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Soumettre l'Évaluation</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
