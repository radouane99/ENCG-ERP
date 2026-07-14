import React from 'react';
import { BrainCircuit, TrendingUp, AlertTriangle, Users, Activity, Target, Zap, BellRing, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';

export default function AdminPredictiveAnalytics() {
  const queryClient = useQueryClient();

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['admin-predictive-analytics'],
    queryFn: () => api.get('/admin/predictive-analytics').then(res => res.data.data),
    staleTime: 1000 * 60 * 10, // 10 min
  });

  const refreshMutation = useMutation({
    mutationFn: () => api.post('/admin/predictive-analytics/refresh').then(res => res.data.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin-predictive-analytics'], data);
      toast.success('Analyse IA actualisée avec succès !');
    },
    onError: () => toast.error("Erreur lors de l'actualisation de l'IA."),
  });

  const dropoutRisks = analyticsData?.dropoutRisks || [];
  const predictions = analyticsData?.predictions || [];
  const aiSummary = analyticsData?.ai_summary;
  const generatedAt = analyticsData?.generated_at;

  const riskColorMap: Record<string, string> = {
    high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Premium Header */}
      <div className="bg-card rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-border">
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-emerald-500/20">
              <BrainCircuit className="w-3.5 h-3.5" /> Moteur IA Gemini 1.5
            </div>
            <h1 className="text-4xl font-black text-foreground mb-2">Centre de Contrôle IA & Prédictions</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Anticipez l'avenir de l'ENCG grâce à l'analyse prédictive. Détectez les risques de décrochage et optimisez la gestion des flux.
            </p>
            {generatedAt && (
              <p className="text-xs text-muted-foreground/60 mt-2">
                Dernière analyse : {new Date(generatedAt).toLocaleString('fr-FR')}
              </p>
            )}
          </div>
          <div className="shrink-0 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 bg-muted border border-border p-4 rounded-2xl backdrop-blur-md">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400" />
              </div>
              <div>
                <div className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Modèle Actif</div>
                <div className="text-emerald-400 font-black text-lg">Gemini 1.5</div>
              </div>
            </div>
            <button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending || isLoading}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-lg"
            >
              {refreshMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Actualiser l'IA
            </button>
          </div>
        </div>
      </div>

      {/* AI Narrative Summary */}
      {(aiSummary || isLoading) && (
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl p-6 border border-indigo-500/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Synthèse Exécutive — Gemini IA</div>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-indigo-500/10 rounded animate-pulse w-full" />
                  <div className="h-4 bg-indigo-500/10 rounded animate-pulse w-4/5" />
                  <div className="h-4 bg-indigo-500/10 rounded animate-pulse w-3/5" />
                </div>
              ) : (
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPI Predictions */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl p-6 bg-card border border-border animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-3" />
              <div className="h-5 bg-muted rounded w-2/3 mb-2" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {predictions.map((pred: any, idx: number) => (
            <div key={idx} className={cn("rounded-2xl p-6 shadow-sm border relative overflow-hidden transition-all hover:scale-[1.02] cursor-pointer bg-card", pred.color)}>
              <div className="flex justify-between items-start mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", pred.color)}>
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-foreground mb-1">{pred.value}</div>
              <div className="font-bold text-foreground text-sm">{pred.label}</div>
              <div className="text-xs font-medium text-muted-foreground mt-1">{pred.subtext}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Dropout Risk Alert */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Alertes Décrochage IA</h2>
                <p className="text-xs font-medium text-muted-foreground">Score calculé sur notes réelles + absences</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-muted/30 animate-pulse">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))
            ) : dropoutRisks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Target className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-bold text-sm">Aucun étudiant à risque détecté</p>
                <p className="text-xs mt-1">Tous les étudiants ont un bon profil académique.</p>
              </div>
            ) : (
              dropoutRisks.map((student: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0 border border-primary/20">
                        {student.name?.charAt(0) ?? '?'}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{student.name}</h4>
                        <p className="text-xs font-medium text-muted-foreground">
                          Moy: {student.avg_grade}/20 · {student.absences} absence(s)
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 border",
                      riskColorMap[student.risk_level] ?? riskColorMap.medium
                    )}>
                      {student.risk_score}% risque
                    </div>
                  </div>
                  
                  {/* Risk progress bar */}
                  <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                    <div
                      className={cn("h-1.5 rounded-full transition-all", student.risk_level === 'high' ? 'bg-rose-500' : student.risk_level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500')}
                      style={{ width: `${student.risk_score}%` }}
                    />
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 bg-primary text-white py-2 rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm">
                      Contacter Étudiant
                    </button>
                    <button className="flex-1 bg-muted border border-border text-foreground py-2 rounded-lg text-xs font-bold hover:bg-muted/80 transition-colors flex items-center justify-center gap-1.5">
                      <BellRing className="w-3.5 h-3.5" /> Alerter Tuteur
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Model Info & Stats */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Modèle Prédictif</h2>
              <p className="text-xs font-medium text-muted-foreground">Algorithme heuristique + LLM Gemini</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/40 border border-border">
              <div className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Sources de Données</div>
              <ul className="space-y-1.5 text-sm text-foreground/80">
                {[
                  'Notes et évaluations (table grades)',
                  'Feuilles de présence (attendance_records)',
                  'Inscriptions académiques',
                  'Données du moteur Gemini 1.5 Flash',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border">
              <div className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Formule du Score de Risque</div>
              <div className="font-mono text-xs text-primary bg-primary/5 p-3 rounded-lg border border-primary/20 leading-relaxed">
                score = max(0, (10 - note_moy) × 6) <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ min(40, absences × 4) <br />
                <span className="text-muted-foreground">Seuil élevé : ≥ 70 — Modéré : ≥ 40</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Étudiants', value: analyticsData?.total_students ?? '—', color: 'text-primary' },
                { label: 'À Risque Élevé', value: dropoutRisks.filter((s: any) => s.risk_level === 'high').length, color: 'text-rose-400' },
                { label: 'À Risque Modéré', value: dropoutRisks.filter((s: any) => s.risk_level === 'medium').length, color: 'text-amber-400' },
              ].map((stat, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-muted/40 border border-border">
                  <div className={cn("text-2xl font-black", stat.color)}>{stat.value}</div>
                  <div className="text-[10px] font-bold text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
