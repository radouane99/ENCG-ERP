import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import { Compass, Sparkles, Calculator, AlertTriangle, CheckCircle2, RefreshCw, Briefcase, GraduationCap, BarChart2, BookOpen } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { cn } from '@shared/lib/utils';

interface ModuleSimItem {
  name: string;
  coefficient: number;
  grade: number | null;
}

export default function StudentOrientationAdvisorPage() {
  const [targetGpa, setTargetGpa] = useState<number>(12.0);
  const [selectedSemester, setSelectedSemester] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<'advisor' | 'simulator'>('advisor');

  // 1. Fetch AI Orientation Profile
  // 1. Fetch AI Orientation Profile
const { data: profileData, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-orientation-profile'],
    queryFn: async () => {
        const res = await api.get('/student/orientation/profile');
        return res.data?.data || res.data || {};
    },
});

  // State for simulated modules
  // State for simulated modules
const [simulatedModules, setSimulatedModules] = useState<ModuleSimItem[]>([]);

  // Sync real modules from database when profileData loads
  React.useEffect(() => {
    if (profileData?.current_semester_modules && profileData.current_semester_modules.length > 0) {
      setSimulatedModules(profileData.current_semester_modules.map((m: any) => ({
        name: m.name,
        coefficient: Number(m.coefficient) || 2,
        grade: m.grade === null || m.grade === undefined ? null : Number(m.grade),
      })));
    }
    if (profileData?.current_semester) {
      setSelectedSemester(profileData.current_semester);
    }
  }, [profileData]);

  // 2. Simulation Mutation
  const simulationMutation = useMutation({
    mutationFn: async (payload: { modules: ModuleSimItem[]; semester_number: number; target_gpa: number }) => {
      const res = await api.post('/student/orientation/simulate-compensation', payload);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      toast.success("Simulation LMD recalculée avec succès !");
    },
    onError: () => {
      toast.error("Erreur lors de la simulation.");
    }
  });

  const radarData = profileData?.radar_skills || [];
  const recommendations = profileData?.recommendations || [];

  const topRec = recommendations[0];

  const handleGradeChange = (index: number, newGrade: number) => {
    const updated = [...simulatedModules];
    updated[index].grade = Math.max(0, Math.min(20, newGrade));
    setSimulatedModules(updated);
  };

  const handleRunSimulation = () => {
    if (simulatedModules.length === 0 || simulatedModules.some(m => m.grade === null)) { toast.error('Renseignez explicitement toutes les notes hypothétiques avant la simulation.'); return; }
    simulationMutation.mutate({
      modules: simulatedModules,
      semester_number: selectedSemester,
      target_gpa: targetGpa,
    });
  };

  const simResult = simulationMutation.data;

  // Real-time quick GPA calculation if no API mutation triggered yet
  const quickAverage = (() => {
    let sum = 0;
    let coeffSum = 0;
    for (const m of simulatedModules) {
      if (m.grade === null) continue; sum += (m.grade * m.coefficient);
      coeffSum += m.coefficient;
    }
    return coeffSum > 0 ? (sum / coeffSum) : 0;
  })();

  const hasEliminatory = simulatedModules.some(m => m.grade !== null && m.grade < 6.0);
  const isValid = simulatedModules.length > 0 && simulatedModules.every(m => m.grade !== null) && quickAverage >= 10.0 && !hasEliminatory;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm font-bold text-muted-foreground dark:text-foreground">Analyse de vos résultats et génération des conseils d'orientation...</p>
      </div>
    );
  }

  if (isError) return <div role="alert" className="rounded-xl border border-red-200 p-5">Impossible de charger votre orientation. <button className="min-h-11 underline" onClick={() => void refetch()}>Réessayer</button></div>;
  if (!topRec) return <div className="rounded-xl border p-5">Aucun résultat exploitable pour proposer une orientation. Vos notes ne sont pas remplacées par des données de démonstration.</div>;
  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-7xl mx-auto">
      
      {/* ── Hero Banner ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden p-6 md:p-10 text-white border border-purple-900/40 erp-page-banner">
        <div className="absolute -top-24 -end-24 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -start-20 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Career & Path Advisor ENCG Fès
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
                Cycle Tronc Commun • Semestre {profileData?.current_semester || 2}
              </span>
            </div>

            <h1 className="text-white erp-page-title">
              Simulateur d'Orientation & Choix de Master
            </h1>

            <p className="text-slate-300/90 text-sm leading-relaxed">
              Analysez vos compétences clés, découvrez la spécialité Master (GFC, MCM, ACG, GRH, MACI) la plus adaptée à vos notes et simulez vos chances de validation LMD en direct.
            </p>
          </div>

          {/* Quick Tab Switcher */}
          <div className="shrink-0 flex items-center bg-slate-900/90 border border-white/10 p-1.5 rounded-2xl backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setActiveTab('advisor')}
              className={cn(
                "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'advisor'
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Compass className="w-4 h-4" />
              <span>Orientation Master</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={cn(
                "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'simulator'
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Calculator className="w-4 h-4" />
              <span>Simulateur LMD</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── TAB 1: ORIENTATION MASTER & RADAR SKILLS ────────────────────────── */}
      {activeTab === 'advisor' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Top Recommendation Highlight Banner */}
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-2xl p-6 md:p-8 text-white border border-purple-500/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold uppercase">
                  Recommandation N°1 • Compatibilité Maximale
                </span>
                <span className="text-xs text-purple-300 font-bold">Algorithme d'affinité ENCG</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <span>{topRec.name} ({topRec.code})</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {profileData?.ai_verdict || topRec.description}
              </p>
            </div>

            <div className="text-center shrink-0 bg-slate-900/80 p-5 rounded-2xl border border-purple-400/30 backdrop-blur-md">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400">
                {topRec.compatibility_score}%
              </div>
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Score de Match</div>
              <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                Profil Idéal
              </div>
            </div>
          </div>

          {/* Grid Radar Chart & Specialization Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Competency Spider / Radar Chart */}
            <div className="bg-card dark:bg-card rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground dark:text-foreground flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Radar de Compétences</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Moyennes obtenues sur vos modules validés (/20)
                  </p>
                </div>
              </div>

              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 20]} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '11px' }} />
                    <Radar name="Votre Note" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.45} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[11px] space-y-1">
                <span className="font-bold text-purple-700 dark:text-purple-300 block">💡 Analyse des points forts :</span>
                <p className="text-muted-foreground dark:text-foreground text-[10px] leading-relaxed">
                  Vos performances en <strong className="text-purple-600 dark:text-purple-400">Comptabilité & Finance</strong> surpassent la moyenne de la promotion, ce qui vous confère un avantage compétitif pour les filières financières et d'audit.
                </p>
              </div>
            </div>

            {/* Right: Master Specialization Cards List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground dark:text-foreground flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Classement des Spécialisations Master</span>
                </h3>
                <span className="text-xs text-slate-400 font-bold">5 filières accréditées ENCG</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((rec: any, idx: number) => {
                  return (
                    <div
                      key={rec.code}
                      className={cn(
                        "bg-card dark:bg-card rounded-2xl p-5 border shadow-sm space-y-3 relative overflow-hidden transition-all hover:shadow-md",
                        idx === 0 ? "border-purple-400 dark:border-purple-600 ring-2 ring-purple-500/20" : "border-slate-200/80 dark:border-border"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs",
                            idx === 0 ? "bg-purple-600 text-white" : "bg-muted dark:bg-card text-slate-700 dark:text-foreground"
                          )}>
                            #{idx + 1}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-foreground dark:text-foreground">
                              {rec.code} — {rec.name}
                            </h4>
                          </div>
                        </div>

                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full font-bold text-[10px]",
                          rec.compatibility_score >= 85 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" :
                          rec.compatibility_score >= 70 ? "bg-primary/5 text-primary dark:bg-indigo-950/60 dark:text-indigo-300" :
                          "bg-muted text-slate-700 dark:bg-card dark:text-foreground"
                        )}>
                          {rec.compatibility_score}% Match
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-muted dark:bg-card h-2 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            rec.compatibility_score >= 85 ? "bg-emerald-500" : rec.compatibility_score >= 70 ? "bg-primary" : "bg-purple-500"
                          )}
                          style={{ width: `${rec.compatibility_score}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-muted-foreground dark:text-muted-foreground leading-relaxed line-clamp-2">
                        {rec.description}
                      </p>

                      {/* Career Prospects */}
                      <div className="space-y-1 pt-1 border-t border-border dark:border-border text-[10px]">
                        <span className="font-bold text-slate-700 dark:text-foreground flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-purple-500" /> Débouchés professionnels :
                        </span>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {rec.career_prospects.slice(0, 3).map((job: string, jIdx: number) => (
                            <span key={jIdx} className="px-2 py-0.5 rounded-lg bg-muted/50 dark:bg-card text-muted-foreground dark:text-foreground font-medium">
                              {job}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: LMD COMPENSATION & TARGET GPA CALCULATOR ────────────────── */}
      {activeTab === 'simulator' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Top Info Alert */}
          <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-600 text-white">
                <Calculator className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-purple-950 dark:text-purple-200">
                  Calculateur Prédictif de Compensation LMD (Règlement Pédagogique ENCG)
                </h3>
                <p className="text-xs text-purple-800/80 dark:text-purple-300/80">
                  Ajustez vos notes estimées par matière. Le simulateur applique les règles officielles (Moyenne &ge; 10.00, validation de module &ge; 10.00, seuil éliminatoire &lt; 06.00/20).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={simulationMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2 shrink-0"
            >
              {simulationMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Simuler avec l'IA</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Interactive Modules Sliders Form */}
            <div className="lg:col-span-2 bg-card dark:bg-card rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-border space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border dark:border-border">
                <h3 className="text-base font-bold text-foreground dark:text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>Modules du Semestre {selectedSemester}</span>
                </h3>
                <span className="text-xs text-slate-400 font-bold">Glissez pour tester différents scénarios</span>
              </div>

              <div className="space-y-4">
                {simulatedModules.map((m, idx) => {
                  const isElim = m.grade !== null && m.grade < 6.0;
                  const isVal = m.grade !== null && m.grade >= 10.0;

                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-muted/50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground dark:text-foreground block">
                            {m.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Coefficient : {m.coefficient}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase",
                            isVal ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" :
                            isElim ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" :
                            "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          )}>
                            {isVal ? 'Validé' : isElim ? 'Éliminatoire (<06)' : 'Compensable'}
                          </span>
                          <span className="font-mono font-bold text-sm text-foreground dark:text-foreground min-w-[50px] text-right">
                            {(m.grade === null ? 'À renseigner' : m.grade.toFixed(2))}/20
                          </span>
                        </div>
                      </div>

                      {/* Slider Input */}
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="0.25"
                        value={m.grade ?? ''}
                        onChange={(e) => handleGradeChange(idx, parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Target GPA Selector */}
              <div className="pt-3 border-t border-border dark:border-border flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-foreground dark:text-foreground">Moyenne Générale Cible Souhaitée :</label>
                  <p className="text-[10px] text-slate-400">Calcule l'effort nécessaire pour décrocher une mention</p>
                </div>
                <div className="flex items-center gap-2">
                  {[10.0, 12.0, 14.0, 16.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTargetGpa(val)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer",
                        targetGpa === val
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-muted dark:bg-card text-muted-foreground dark:text-foreground hover:bg-slate-200"
                      )}
                    >
                      {val.toFixed(0)}/20 ({val === 10 ? 'Passable' : val === 12 ? 'Assez Bien' : val === 14 ? 'Bien' : 'Très Bien'})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live Decision Verdict Card */}
            <div className="bg-slate-950 rounded-2xl p-6 text-white border border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">Règlement LMD ENCG</span>
                  <span className="font-bold text-purple-400">Simulation en Direct</span>
                </div>

                <div className="text-center py-4 bg-slate-900/90 rounded-2xl border border-white/10 space-y-2">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Moyenne Générale Semestrielle</span>
                  <div className={cn(
                    "text-4xl font-bold font-mono",
                    isValid ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {quickAverage.toFixed(2)}/20
                  </div>
                  <div className="text-xs font-bold text-slate-300">
                    {quickAverage >= 16 ? 'Mention Très Bien' :
                     quickAverage >= 14 ? 'Mention Bien' :
                     quickAverage >= 12 ? 'Mention Assez Bien' :
                     quickAverage >= 10 ? 'Mention Passable' : 'Non Validé'}
                  </div>
                </div>

                {/* Verdict Badge */}
                <div className={cn(
                  "p-4 rounded-2xl border text-xs space-y-1.5 font-bold",
                  isValid
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                    : "bg-rose-950/60 border-rose-500/40 text-rose-200"
                )}>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    {isValid ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
                    <span>{isValid ? 'Semestre Validé (V / VPC)' : 'Session de Rattrapage Recommandée'}</span>
                  </div>
                  <p className="text-[11px] font-normal opacity-90 leading-relaxed">
                    {hasEliminatory
                      ? "Attention : Vous avez au moins une note inférieure à 06.00/20 (note éliminatoire). Ce module doit impérativement être rattrapé."
                      : isValid
                      ? "Félicitations ! Votre moyenne semestrielle est supérieure à 10.00 sans aucune note éliminatoire."
                      : "La moyenne actuelle est inférieure au seuil de validation de 10.00/20."}
                  </p>
                </div>
              </div>

              {/* Target GPA Advice */}
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-900/60 text-[11px] text-purple-200 space-y-1">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Conseil de l'IA pour l'objectif {targetGpa.toFixed(0)}/20 :
                </span>
                <p className="text-[10px] text-purple-300/80 leading-relaxed">
                  {simResult?.target_simulation?.advice || (quickAverage >= targetGpa
                    ? `Objectif de ${targetGpa}/20 déjà dépassé avec votre moyenne actuelle de ${quickAverage.toFixed(2)}/20 !`
                    : `Pour atteindre la mention visée, augmentez vos notes de ${((targetGpa - quickAverage) * 1.5).toFixed(1)} points dans les matières à fort coefficient.`)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
